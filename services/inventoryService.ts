
import { db } from './firebase';
import { collection, query, onSnapshot, Unsubscribe, addDoc, doc, updateDoc, where, getDocs, runTransaction, writeBatch, DocumentReference, Timestamp, orderBy, getDoc, deleteDoc } from 'firebase/firestore';
import { InventoryItem, ShelfAnalysis, SalesLog, Invoice } from '../types';
import { deleteNotificationsForItem } from './notificationService';

export const getInventoryStream = (userId: string, callback: (items: InventoryItem[]) => void): Unsubscribe => {
    const itemsCollection = collection(db, `users/${userId}/inventory`);
    const q = query(itemsCollection);

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const items = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as InventoryItem));
        callback(items);
    });

    return unsubscribe;
};

export const findItemByName = async (userId: string, itemName: string): Promise<(InventoryItem & { docRef: DocumentReference }) | null> => {
    const itemsCollection = collection(db, `users/${userId}/inventory`);
    const q = query(itemsCollection, where("name", "==", itemName.toLowerCase()));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return {
            id: doc.id,
            ...doc.data(),
            docRef: doc.ref
        } as (InventoryItem & { docRef: DocumentReference });
    }
    return null;
};


export const addOrUpdateItem = async (userId: string, itemName: string, quantity: number, price: number, expiryDate?: string, costPrice?: number): Promise<void> => {
    const itemRef = collection(db, `users/${userId}/inventory`);
    const normalizedItemName = itemName.toLowerCase();
    
    await runTransaction(db, async (transaction) => {
        const q = query(itemRef, where("name", "==", normalizedItemName));
        const snapshot = await getDocs(q); // Note: getDocs is not transactional but is safe for this check-then-write pattern.
        
        let newItemData: Partial<InventoryItem> = { 
            name: normalizedItemName, 
            quantity, 
            price, // Selling Price
            costPrice: costPrice || 0 // Cost Price (default to 0 if not provided)
        };

        if (expiryDate) {
            newItemData.expiryDate = expiryDate;
            const parts = expiryDate.split('-');
            if (parts.length === 3) {
                 // Format is DD-MM-YYYY, but Date constructor needs YYYY, MM-1, DD
                const expiry = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                expiry.setHours(23, 59, 59, 999); // Set to end of day
                newItemData.expiryTimestamp = Timestamp.fromDate(expiry);
            }
            newItemData.expiryStatus = 'none';
            newItemData.alertRules = { notifyBeforeDays: 7, notifyWhenExpired: true };
        }

        if (snapshot.empty) {
            transaction.set(doc(itemRef), newItemData);
        } else {
            const existingDoc = snapshot.docs[0];
            const existingData = existingDoc.data() as InventoryItem;
            const newQuantity = existingData.quantity + quantity;
            
            const updatedData: any = { quantity: newQuantity, price };
            
            // Only update cost price if provided, otherwise keep existing
            if (costPrice !== undefined) {
                updatedData.costPrice = costPrice;
            }

             if (expiryDate) {
                updatedData.expiryDate = newItemData.expiryDate;
                updatedData.expiryTimestamp = newItemData.expiryTimestamp;
                 // Reset status on update
                updatedData.expiryStatus = 'none';
                updatedData.lastAlertedAt = null;
            }

            transaction.update(existingDoc.ref, updatedData);
        }
    });
};

export const updateInventoryItem = async (userId: string, itemId: string, updates: Partial<InventoryItem>): Promise<void> => {
    const itemRef = doc(db, `users/${userId}/inventory`, itemId);
    const dataToUpdate = { ...updates };
    
    if (dataToUpdate.name) {
        dataToUpdate.name = dataToUpdate.name.toLowerCase();
    }

    if (dataToUpdate.expiryDate) {
        const parts = dataToUpdate.expiryDate.split('-');
        if (parts.length === 3) {
             // Format is DD-MM-YYYY
            const expiry = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
            expiry.setHours(23, 59, 59, 999);
            dataToUpdate.expiryTimestamp = Timestamp.fromDate(expiry);
            dataToUpdate.expiryStatus = 'none'; // Reset status if date changes
            dataToUpdate.lastAlertedAt = undefined; // Allow new alerts
        }
    }
    
    await updateDoc(itemRef, dataToUpdate as any);
};

export const removeItem = async (userId: string, itemName: string, quantityToRemove: number): Promise<{ success: boolean; message: string }> => {
    const normalizedItemName = itemName.toLowerCase();
    const itemData = await findItemByName(userId, normalizedItemName);
    
    if (!itemData) {
        return { success: false, message: `I couldn't find any ${itemName} in the inventory.` };
    }

    const transactionResult = await runTransaction(db, async (transaction) => {
        const itemDoc = await transaction.get(itemData.docRef);
        if (!itemDoc.exists()) {
            return { success: false, message: "This item was already removed." };
        }
        
        const currentQuantity = itemDoc.data().quantity;
        if (currentQuantity < quantityToRemove) {
            return { success: false, message: `You only have ${currentQuantity} ${itemName}. I can't remove ${quantityToRemove}.` };
        }

        const newQuantity = currentQuantity - quantityToRemove;
        
        // Log sale implicitly if removed via voice
        const logRef = doc(collection(db, `users/${userId}/sales_logs`));
        const salesLog: Omit<SalesLog, 'id'> = {
            userId,
            itemId: itemData.id,
            itemName: itemData.name,
            quantity: quantityToRemove,
            costPrice: itemDoc.data().costPrice || 0,
            sellingPrice: itemDoc.data().price || 0,
            totalRevenue: quantityToRemove * (itemDoc.data().price || 0),
            totalCost: quantityToRemove * (itemDoc.data().costPrice || 0),
            profit: (quantityToRemove * (itemDoc.data().price || 0)) - (quantityToRemove * (itemDoc.data().costPrice || 0)),
            timestamp: Timestamp.now(),
            type: 'OUT'
        };
        transaction.set(logRef, salesLog);

        if (newQuantity === 0) {
            transaction.delete(itemDoc.ref);
            return { success: true, message: `Removed all ${itemName}.`, wasFullyDeleted: true };
        } else {
            transaction.update(itemDoc.ref, { quantity: newQuantity });
            return { success: true, message: `Removed ${quantityToRemove} ${itemName}.`, wasFullyDeleted: false };
        }
    });

    if (transactionResult.success && transactionResult.wasFullyDeleted) {
        await deleteNotificationsForItem(userId, itemData.id);
    }
    
    return { success: transactionResult.success, message: transactionResult.message };
};

export const deleteItemsBatch = async (userId: string, itemIds: string[]): Promise<void> => {
    if (!itemIds.length) return;
    
    const batch = writeBatch(db);
    itemIds.forEach(id => {
        const itemRef = doc(db, `users/${userId}/inventory`, id);
        batch.delete(itemRef);
    });
    
    await batch.commit();
    
    itemIds.forEach(id => deleteNotificationsForItem(userId, id));
};

// --- Sales & Analytics ---

export const logSale = async (userId: string, item: InventoryItem, quantity: number): Promise<void> => {
    const logsCol = collection(db, `users/${userId}/sales_logs`);
    const salesLog: Omit<SalesLog, 'id'> = {
        userId,
        itemId: item.id,
        itemName: item.name,
        quantity: quantity,
        costPrice: item.costPrice || 0,
        sellingPrice: item.price,
        totalRevenue: quantity * item.price,
        totalCost: quantity * (item.costPrice || 0),
        profit: (quantity * item.price) - (quantity * (item.costPrice || 0)),
        timestamp: Timestamp.now(),
        type: 'OUT'
    };
    await addDoc(logsCol, salesLog);
};

export const getSalesLogs = async (userId: string): Promise<SalesLog[]> => {
    const logsCol = collection(db, `users/${userId}/sales_logs`);
    // Ideally filter by date range here, but for now fetch all and filter in UI for flexibility
    const q = query(logsCol, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SalesLog));
};

// --- Invoice Generation ---

export const createInvoice = async (userId: string, invoiceData: Omit<Invoice, 'id'>): Promise<string> => {
    const invoicesRef = collection(db, `users/${userId}/invoices`);
    const invoiceRef = doc(invoicesRef);
    const logsRef = collection(db, `users/${userId}/sales_logs`);

    await runTransaction(db, async (transaction) => {
        // 1. Verify stock and prepare updates
        for (const lineItem of invoiceData.lineItems) {
            const itemRef = doc(db, `users/${userId}/inventory`, lineItem.itemId);
            const itemDoc = await transaction.get(itemRef);

            if (!itemDoc.exists()) {
                throw new Error(`Item ${lineItem.itemName} not found in inventory.`);
            }

            const currentQty = itemDoc.data().quantity || 0;
            if (currentQty < lineItem.quantity) {
                throw new Error(`Insufficient stock for ${lineItem.itemName}. Requested: ${lineItem.quantity}, Available: ${currentQty}`);
            }

            // 2. Decrement stock
            const newQty = currentQty - lineItem.quantity;
            if (newQty === 0) {
                transaction.delete(itemRef);
            } else {
                transaction.update(itemRef, { quantity: newQty });
            }

            // 3. Create SalesLog entry (OUT movement)
            const salesLogRef = doc(logsRef);
            const costPrice = lineItem.unitCostPrice || itemDoc.data().costPrice || 0;
            const salesLog: Omit<SalesLog, 'id'> = {
                userId,
                itemId: lineItem.itemId,
                itemName: lineItem.itemName,
                quantity: lineItem.quantity,
                costPrice: costPrice,
                sellingPrice: lineItem.unitSellingPrice,
                totalRevenue: lineItem.quantity * lineItem.unitSellingPrice,
                totalCost: lineItem.quantity * costPrice,
                profit: (lineItem.quantity * lineItem.unitSellingPrice) - (lineItem.quantity * costPrice),
                timestamp: Timestamp.now(),
                type: 'OUT'
            };
            transaction.set(salesLogRef, salesLog);
        }

        // 4. Save Invoice
        transaction.set(invoiceRef, invoiceData);
    });

    return invoiceRef.id;
};

// --- Shelf Analysis Storage ---

export const saveShelfAnalysis = async (analysis: Omit<ShelfAnalysis, 'id'>): Promise<string> => {
    const collectionRef = collection(db, `users/${analysis.userId}/shelf_analyses`);
    const docRef = await addDoc(collectionRef, analysis);
    return docRef.id;
};

export const getShelfAnalyses = async (userId: string): Promise<ShelfAnalysis[]> => {
    const collectionRef = collection(db, `users/${userId}/shelf_analyses`);
    const q = query(collectionRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as ShelfAnalysis));
};

export const getShelfAnalysisById = async (userId: string, analysisId: string): Promise<ShelfAnalysis | null> => {
    const docRef = doc(db, `users/${userId}/shelf_analyses`, analysisId);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
        return { id: snapshot.id, ...snapshot.data() } as ShelfAnalysis;
    }
    return null;
};

export const deleteShelfAnalysis = async (userId: string, analysisId: string): Promise<void> => {
    const docRef = doc(db, `users/${userId}/shelf_analyses`, analysisId);
    await deleteDoc(docRef);
};
