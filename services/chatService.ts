
import { db } from './firebase';
import { collection, query, onSnapshot, Unsubscribe, where, getDocs, serverTimestamp, orderBy, doc, writeBatch, increment, getDoc, updateDoc } from 'firebase/firestore';
import { Chat, Message, UserProfile } from '../types';
import { findUsersByCategories } from './firebase';

/**
 * After a user completes onboarding, this finds matching counterparts and creates chats.
 * @param userProfile The profile of the user who just completed onboarding.
 */
export const triggerMatching = async (userProfile: UserProfile): Promise<void> => {
    if (!userProfile.categories || userProfile.categories.length === 0) return;

    const oppositeRole = userProfile.role === 'seller' ? 'supplier' : 'seller';
    const counterparts = await findUsersByCategories(userProfile.categories, oppositeRole);
    const batch = writeBatch(db);

    for (const counterpart of counterparts) {
        // Find common categories for context
        const commonCategories = userProfile.categories.filter(cat => counterpart.categories.includes(cat));
        if (commonCategories.length === 0) continue; 

        const sellerProfile = userProfile.role === 'seller' ? userProfile : counterpart;
        const supplierProfile = userProfile.role === 'supplier' ? userProfile : counterpart;

        const chatId = [sellerProfile.uid, supplierProfile.uid].sort().join('_');
        const chatRef = doc(db, 'chats', chatId);
        
        const chatSnap = await getDoc(chatRef);

        if (!chatSnap.exists()) {
            const newChat: Chat = {
                id: chatId,
                participants: [sellerProfile.uid, supplierProfile.uid],
                sellerId: sellerProfile.uid,
                sellerName: sellerProfile.name,
                supplierId: supplierProfile.uid,
                supplierName: supplierProfile.name,
                categoriesMatched: commonCategories,
                lastMessageText: 'You are now connected!',
                lastMessageTimestamp: serverTimestamp(),
                unreadCount: {
                    [sellerProfile.uid]: 1,
                    [supplierProfile.uid]: 1,
                }
            };
            batch.set(chatRef, newChat);
        }
    }
    await batch.commit();
};


export const getChatsStream = (userId: string, callback: (chats: Chat[]) => void): Unsubscribe => {
    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, where('participants', 'array-contains', userId));
    
    return onSnapshot(q, (snapshot) => {
        const chats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chat));
        
        chats.sort((a, b) => {
            const timeA = a.lastMessageTimestamp?.toDate ? a.lastMessageTimestamp.toDate().getTime() : 0;
            const timeB = b.lastMessageTimestamp?.toDate ? b.lastMessageTimestamp.toDate().getTime() : 0;
            return timeB - timeA;
        });

        callback(chats);
    });
};


export const getMessagesStream = (chatId: string, callback: (messages: Message[]) => void): Unsubscribe => {
    const messagesRef = collection(db, `chats/${chatId}/messages`);
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
        callback(messages);
    });
};


export const sendMessage = async (chatId: string, senderProfile: UserProfile, text: string): Promise<void> => {
    const chatRef = doc(db, 'chats', chatId);
    const messagesRef = collection(db, `chats/${chatId}/messages`);

    const chatSnap = await getDoc(chatRef);
    if (!chatSnap.exists()) return;
    const participants = chatSnap.data().participants as string[];
    const recipientId = participants.find(p => p !== senderProfile.uid);
    if (!recipientId) return;

    const newMessage: Omit<Message, 'id'> = {
        chatId,
        senderId: senderProfile.uid,
        senderName: senderProfile.name,
        text,
        timestamp: serverTimestamp(),
        isRead: false,
        deliveryStatus: 'sent',
    };
    
    const batch = writeBatch(db);
    batch.set(doc(messagesRef), newMessage);
    batch.update(chatRef, {
        lastMessageText: text,
        lastMessageTimestamp: serverTimestamp(),
        [`unreadCount.${recipientId}`]: increment(1)
    });

    await batch.commit();
};

/**
 * Broadcasts a message to multiple chats.
 */
export const broadcastMessage = async (chatIds: string[], senderProfile: UserProfile, text: string): Promise<{ success: boolean; count: number }> => {
    if (chatIds.length === 0) return { success: true, count: 0 };

    const batch = writeBatch(db);
    let operationCount = 0;

    for (const chatId of chatIds) {
        const messagesRef = collection(db, `chats/${chatId}/messages`);
        const chatRef = doc(db, 'chats', chatId);
        
        // We need to know the recipient ID to update unread count.
        // For efficiency in broadcast, we'll assume we can't fetch every chat doc.
        // However, we can use a trick: get the ID from the participants field in the chat document.
        // BUT, strictly for batch writes, we can't read. 
        // So we will perform a read first (Promise.all) which is okay for reasonable numbers (<50).
        // If scaling, we'd move this to a Cloud Function.
        
        const chatSnap = await getDoc(chatRef);
        if (!chatSnap.exists()) continue;
        
        const participants = chatSnap.data().participants as string[];
        const recipientId = participants.find(p => p !== senderProfile.uid);
        
        if (!recipientId) continue;

        const newMessage: Omit<Message, 'id'> = {
            chatId,
            senderId: senderProfile.uid,
            senderName: senderProfile.name,
            text,
            timestamp: serverTimestamp(),
            isRead: false,
            deliveryStatus: 'sent',
        };

        batch.set(doc(messagesRef), newMessage);
        batch.update(chatRef, {
            lastMessageText: `📢 ${text}`,
            lastMessageTimestamp: serverTimestamp(),
            [`unreadCount.${recipientId}`]: increment(1)
        });
        operationCount++;
    }

    if (operationCount > 0) {
        await batch.commit();
    }

    return { success: true, count: operationCount };
};

/**
 * Updates the status of multiple messages to 'delivered'.
 * @param chatId The ID of the chat.
 * @param messageIds An array of message IDs to update.
 */
export const markMessagesAsDelivered = async (chatId: string, messageIds: string[]): Promise<void> => {
    if (messageIds.length === 0) return;
    const batch = writeBatch(db);
    messageIds.forEach(msgId => {
        const msgRef = doc(db, `chats/${chatId}/messages`, msgId);
        batch.update(msgRef, { deliveryStatus: 'delivered' });
    });
    await batch.commit();
};

/**
 * Marks messages in a chat as 'seen' and resets the user's unread count.
 * @param chatId The ID of the chat.
 * @param userId The ID of the user reading the messages.
 */
export const markMessagesAsSeen = async (chatId: string, userId: string): Promise<void> => {
    const chatRef = doc(db, 'chats', chatId);
    const messagesRef = collection(db, `chats/${chatId}/messages`);
    
    const chatSnap = await getDoc(chatRef);
    if (!chatSnap.exists()) return;

    // First, reset the unread count for the user
    if (chatSnap.data().unreadCount[userId] > 0) {
        await updateDoc(chatRef, {
            [`unreadCount.${userId}`]: 0
        });
    }

    const participants = chatSnap.data().participants as string[];
    const otherUserId = participants.find(p => p !== userId);

    if (!otherUserId) return; // No one else in the chat.

    // Then, update the status of all messages sent by the other person.
    // We query for all messages from the other user and filter on the client
    // to avoid a composite index requirement on Firestore.
    const q = query(messagesRef, where('senderId', '==', otherUserId));
    const messagesToUpdateSnap = await getDocs(q);
    
    if (messagesToUpdateSnap.empty) return;

    const batch = writeBatch(db);
    let hasUpdates = false;
    messagesToUpdateSnap.forEach(doc => {
        if (doc.data().deliveryStatus !== 'seen') {
            batch.update(doc.ref, { deliveryStatus: 'seen', isRead: true });
            hasUpdates = true;
        }
    });
    
    if (hasUpdates) {
        await batch.commit();
    }
};
