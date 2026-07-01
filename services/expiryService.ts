
import { db } from './firebase';
import { collectionGroup, query, getDocs, writeBatch, Timestamp, doc, collection } from 'firebase/firestore';
import { InventoryItem, Notification } from '../types';

/**
 * Scans all inventory items across all users and creates notifications for items
 * that are expiring soon or have already expired, based on their alert rules.
 */
export const checkAllItemsForExpiry = async (): Promise<void> => {
    const now = Timestamp.now();
    const oneDayInMillis = 24 * 60 * 60 * 1000;
    
    const inventoryGroup = collectionGroup(db, 'inventory');
    
    // Removed the `where('expiryTimestamp', '!=', null)` clause to avoid the need for a specific
    // collection group index. We will now fetch all items and filter on the client.
    // This is less efficient but works without manual index creation in Firebase.
    const q = query(inventoryGroup);
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
        return; // No items to check
    }

    const batch = writeBatch(db);
    const notificationsRef = collection(db, 'notifications');
    const aDayAgoMillis = now.toMillis() - (23 * 60 * 60 * 1000);
    let opsCount = 0;

    for (const itemDoc of snapshot.docs) {
        const item = { id: itemDoc.id, ...itemDoc.data() } as InventoryItem;
        const userId = itemDoc.ref.parent.parent?.id;
        
        // This check is now crucial as we are fetching all items.
        if (!userId || !item.expiryTimestamp) continue;

        // Client-side check to see if we've alerted recently
        const lastAlertedTime = item.lastAlertedAt?.toMillis() || 0;
        if (lastAlertedTime > aDayAgoMillis) {
            continue; // Skip this item, it was alerted recently.
        }
        
        const expiryTime = item.expiryTimestamp.toMillis();
        const daysLeft = Math.ceil((expiryTime - now.toMillis()) / oneDayInMillis);

        let alert: Omit<Notification, 'id'> | null = null;
        let newStatus: InventoryItem['expiryStatus'] = item.expiryStatus;
        
        // Case 1: Item has expired
        if (daysLeft < 0 && item.alertRules.notifyWhenExpired && item.expiryStatus !== 'expired') {
            newStatus = 'expired';
            alert = {
                userId,
                title: `Item Expired: ${item.name}`,
                body: `Your item "${item.name}" expired ${Math.abs(daysLeft)} days ago.`,
                createdAt: now,
                read: false,
                type: 'expiry',
                meta: { itemId: item.id, itemName: item.name, expiryTimestamp: item.expiryTimestamp, daysLeft }
            };
        } 
        // Case 2: Item is expiring soon
        else if (daysLeft >= 0 && daysLeft <= item.alertRules.notifyBeforeDays && item.expiryStatus !== 'upcoming') {
            newStatus = 'upcoming';
            alert = {
                userId,
                title: `Item Expiring Soon: ${item.name}`,
                body: `Your item "${item.name}" will expire in ${daysLeft} days.`,
                createdAt: now,
                read: false,
                type: 'expiry',
                meta: { itemId: item.id, itemName: item.name, expiryTimestamp: item.expiryTimestamp, daysLeft }
            };
        }

        // If an alert condition was met, add operations to the batch
        if (alert) {
            batch.set(doc(notificationsRef), alert);
            batch.update(itemDoc.ref, { expiryStatus: newStatus, lastAlertedAt: now });
            opsCount++;
        }
    }

    if (opsCount > 0) {
        await batch.commit();
    }
};
