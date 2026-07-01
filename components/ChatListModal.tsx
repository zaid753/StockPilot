
import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile } from '../types';
import { getChatsStream } from '../services/chatService';
import { Chat } from '../types';
import { ChatParams } from '../App';

interface ChatListModalProps {
    currentUserProfile: UserProfile;
    onClose: () => void;
    onNavigateToChat: (params: ChatParams) => void;
}

const ChatListModal: React.FC<ChatListModalProps> = ({ currentUserProfile, onClose, onNavigateToChat }) => {
    const [chats, setChats] = useState<Chat[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUserProfile) return;
        const unsubscribe = getChatsStream(currentUserProfile.uid, (fetchedChats) => {
            setChats(fetchedChats);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [currentUserProfile]);

    const groupedChats = useMemo(() => {
        const groups: { [key: string]: Chat[] } = {};
        chats.forEach(chat => {
            const category = chat.categoriesMatched[0] || 'general'; // Fallback category
            if (!groups[category]) {
                groups[category] = [];
            }
            groups[category].push(chat);
        });
        // Sort categories alphabetically
        return Object.keys(groups).sort().reduce((acc, key) => {
            acc[key] = groups[key];
            return acc;
        }, {} as { [key: string]: Chat[] });
    }, [chats]);
    
    const handleChatClick = (chat: Chat) => {
        onClose(); // Close modal before navigating
        onNavigateToChat({ 
            chatId: chat.id, 
            chatTitle: `Chat with ${chat.supplierName}` 
        });
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 z-40 flex items-center justify-center backdrop-blur-sm"
            onClick={onClose}
        >
            <div 
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg h-[80vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700"
                onClick={e => e.stopPropagation()}
            >
                <header className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Your Supplier Chats</h2>
                    <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-2xl">&times;</button>
                </header>

                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <p className="p-6 text-center text-gray-500 dark:text-gray-400">Loading chats...</p>
                    ) : chats.length === 0 ? (
                        <p className="p-6 text-center text-gray-500 dark:text-gray-400">No chats found. Suppliers who match your store category will appear here.</p>
                    ) : (
                        Object.entries(groupedChats).map(([category, categoryChats]: [string, Chat[]]) => (
                            <div key={category}>
                                <h3 className="text-sm font-semibold uppercase text-gray-500 dark:text-gray-400 px-4 py-2 bg-gray-50 dark:bg-gray-700/50 sticky top-0 capitalize">{category}</h3>
                                <ul>
                                    {categoryChats.map(chat => {
                                        const hasUnread = currentUserProfile ? chat.unreadCount[currentUserProfile.uid] > 0 : false;
                                        return (
                                            <li key={chat.id} 
                                                onClick={() => handleChatClick(chat)}
                                                className="p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors flex justify-between items-center"
                                            >
                                                <div>
                                                    <p className={`font-semibold text-gray-900 dark:text-white ${hasUnread ? 'font-bold' : ''}`}>
                                                        {chat.supplierName}
                                                    </p>
                                                    <p className={`text-sm text-gray-500 dark:text-gray-400 truncate ${hasUnread ? 'text-indigo-600 dark:text-indigo-400' : ''}`}>
                                                        {chat.lastMessageText}
                                                    </p>
                                                </div>
                                                {hasUnread && (
                                                    <span className="w-3 h-3 bg-indigo-500 rounded-full flex-shrink-0 ml-4"></span>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatListModal;
