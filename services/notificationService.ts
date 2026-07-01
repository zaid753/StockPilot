
import { db } from './firebase';
import { collection, query, where, getDocs, writeBatch, Unsubscribe, onSnapshot } from 'firebase/firestore';
import { Notification } from '../types';

/**
 * Gets a real-time stream of notifications for a specific user.
 * @param userId The user's ID.
 * @param callback A function to call with the array of notifications.
 * @returns An unsubscribe function to stop listening for updates.
 */
export const getNotificationsStream = (userId: string, callback: (notifications: Notification[]) => void): Unsubscribe => {
    const notificationsRef = collection(db, 'notifications');
    // Removed orderBy to prevent composite index error. Sorting will be done on the client.
    const q = query(notificationsRef, where('userId', '==', userId));

    return onSnapshot(q, (snapshot) => {
        const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
        // Sort notifications by creation date, newest first.
        notifications.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
        callback(notifications);
    });
};

/**
 * Marks all unread notifications for a user as read.
 * @param userId The user's ID.
 */
export const markNotificationsAsRead = async (userId: string): Promise<void> => {
    const notificationsRef = collection(db, 'notifications');
    const q = query(notificationsRef, where('userId', '==', userId), where('read', '==', false));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return;

    const batch = writeBatch(db);
    snapshot.forEach(doc => {
        batch.update(doc.ref, { read: true });
    });

    await batch.commit();
};

/**
 * Deletes all notifications associated with a specific inventory item for a user.
 * This is called when an item is deleted to prevent "ghost" notifications.
 * @param userId The ID of the user.
 * @param itemId The ID of the inventory item whose notifications should be deleted.
 */
export const deleteNotificationsForItem = async (userId: string, itemId: string): Promise<void> => {
    const notificationsRef = collection(db, 'notifications');
    const q = query(notificationsRef, where('userId', '==', userId), where('meta.itemId', '==', itemId));
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return;
    }

    const batch = writeBatch(db);
    snapshot.forEach(doc => {
        batch.delete(doc.ref);
    });

    await batch.commit();
};
