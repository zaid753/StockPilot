
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getChatsStream, triggerMatching } from '../services/chatService';
import { getNotificationsStream } from '../services/notificationService';
import { Chat, Notification } from '../types';
import { LogoutIcon, BellIcon } from './icons';
import { ChatParams } from '../App';

interface SupplierDashboardProps {
    onNavigateToChat: (params: ChatParams) => void;
    onOpenNotifications: () => void;
}

const SupplierDashboard: React.FC<SupplierDashboardProps> = ({ onNavigateToChat, onOpenNotifications }) => {
    const { user, userProfile, logOut } = useAuth();
    const [chats, setChats] = useState<Chat[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [totalUnreadChatCount, setTotalUnreadChatCount] = useState(0);
    const [totalUnreadNotificationCount, setTotalUnreadNotificationCount] = useState(0);

    useEffect(() => {
        if (!userProfile?.uid) return;
        setLoading(true);
        const unsubChats = getChatsStream(userProfile.uid, (fetchedChats) => {
            setChats(fetchedChats);
            const unreadSum = fetchedChats.reduce((sum, chat) => sum + (chat.unreadCount[userProfile.uid] || 0), 0);
            setTotalUnreadChatCount(unreadSum);
            setLoading(false);
        });
        const unsubNotifications = getNotificationsStream(userProfile.uid, (notifications: Notification[]) => {
            const unreadSum = notifications.filter(n => !n.read).length;
            setTotalUnreadNotificationCount(unreadSum);
        });
        return () => {
            unsubChats();
            unsubNotifications();
        };
    }, [userProfile?.uid]);

    const handleRefreshMatches = async () => {
        if (!userProfile) return;
        setIsRefreshing(true);
        await triggerMatching(userProfile);
        // The real-time listener will automatically update the chat list.
        setTimeout(() => setIsRefreshing(false), 1000); // Prevent spamming
    };

    const groupedChats = useMemo(() => {
        const groups: { [key: string]: Chat[] } = {};
        chats.forEach(chat => {
            const category = chat.categoriesMatched[0] || 'general';
            if (!groups[category]) {
                groups[category] = [];
            }
            groups[category].push(chat);
        });
        return Object.keys(groups).sort().reduce((acc, key) => {
            acc[key] = groups[key];
            return acc;
        }, {} as { [key: string]: Chat[] });
    }, [chats]);
    
    const handleChatClick = (chat: Chat) => {
        onNavigateToChat({ 
            chatId: chat.id, 
            chatTitle: `Chat with ${chat.sellerName}`
        });
    };

    return (
        <main className="container mx-auto p-4 md:p-8">
            <header className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">Supplier Dashboard</h1>
                    <p className="text-gray-500 dark:text-gray-400">Welcome, {userProfile?.name}</p>
                </div>
                 <div className="flex items-center gap-3">
                    <button onClick={onOpenNotifications} title="Notifications" className="relative p-3 text-gray-500 dark:text-white bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600">
                        <BellIcon className="w-5 h-5" />
                        {totalUnreadNotificationCount > 0 && <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white ring-2 ring-white dark:ring-gray-700">{totalUnreadNotificationCount}</span>}
                    </button>
                    <button onClick={logOut} title="Logout" className="p-3 text-gray-500 dark:text-white bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600">
                        <LogoutIcon className="w-5 h-5" />
                    </button>
                </div>
            </header>
            <div className="bg-white dark:bg-gray-800 dark:bg-opacity-50 backdrop-blur-md rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <span>Matched Seller Chats</span>
                    {totalUnreadChatCount > 0 && (
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                            {totalUnreadChatCount}
                        </span>
                    )}
                </h2>
                {loading ? (
                    <p className="p-4 text-gray-500 dark:text-gray-400">Finding sellers...</p>
                ) : chats.length === 0 ? (
                    <div className="text-center p-10 md:p-16">
                        <div className="max-w-md mx-auto">
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">No Connections Yet</h2>
                            <p className="text-gray-500 dark:text-gray-400 mb-6">
                                We're looking for sellers who match your categories. Check back soon or refresh to see new connections.
                            </p>
                            <button
                                onClick={handleRefreshMatches}
                                disabled={isRefreshing}
                                className="px-6 py-3 text-white bg-indigo-600 rounded-full hover:bg-indigo-700 shadow-lg transition duration-150 ease-in-out font-semibold disabled:bg-gray-400"
                            >
                                {isRefreshing ? 'Searching...' : 'Refresh Matches'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="max-h-[60vh] overflow-y-auto">
                        {Object.entries(groupedChats).map(([category, categoryChats]: [string, Chat[]]) => (
                            <div key={category}>
                                <h3 className="text-sm font-semibold uppercase text-gray-500 dark:text-gray-400 px-4 py-2 bg-gray-50 dark:bg-gray-700/50 sticky top-0 capitalize">{category}</h3>
                                <ul>
                                    {categoryChats.map(chat => {
                                        const hasUnread = user ? chat.unreadCount[user.uid] > 0 : false;
                                        return (
                                            <li key={chat.id} 
                                                onClick={() => handleChatClick(chat)}
                                                className="p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700/50 cursor-pointer transition-colors flex justify-between items-center"
                                            >
                                                <div>
                                                    <p className={`font-semibold text-gray-900 dark:text-white ${hasUnread ? 'font-bold' : ''}`}>
                                                        {chat.sellerName}
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
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
};

export default SupplierDashboard;
