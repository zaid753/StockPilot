
import { db } from './firebase';
import { collection, query, onSnapshot, Unsubscribe, addDoc, doc, updateDoc, deleteDoc, where, getDocs, runTransaction, DocumentReference, Timestamp } from 'firebase/firestore';
import { InventoryItem } from '../types';
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


export const addOrUpdateItem = async (userId: string, itemName: string, quantity: number, price: number, expiryDate?: string): Promise<void> => {
    const itemRef = collection(db, `users/${userId}/inventory`);
    const normalizedItemName = itemName.toLowerCase();
    
    await runTransaction(db, async (transaction) => {
        const q = query(itemRef, where("name", "==", normalizedItemName));
        const snapshot = await getDocs(q); // Note: getDocs is not transactional but is safe for this check-then-write pattern.
        
        let newItemData: Partial<InventoryItem> = { 
            name: normalizedItemName, 
            quantity, 
            price 
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
        if (newQuantity === 0) {
            transaction.delete(itemDoc.ref);
            return { success: true, message: `Removed all ${itemName}.`, wasFullyDeleted: true };
        } else {
            transaction.update(itemDoc.ref, { quantity: newQuantity });
            return { success: true, message: `Removed ${quantityToRemove} ${itemName}.`, wasFullyDeleted: false };
        }
    });

    // After the transaction, if the item was fully deleted, clean up its notifications.
    if (transactionResult.success && transactionResult.wasFullyDeleted) {
        await deleteNotificationsForItem(userId, itemData.id);
    }
    
    return { success: transactionResult.success, message: transactionResult.message };
};