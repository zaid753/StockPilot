import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getChatsStream } from '../../services/chatService';
import { Chat, UserProfile } from '../../types';
import { ChatIcon, UsersIcon } from '../icons';
import { db } from '../../services/firebase';
import { collection, query, where, onSnapshot, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const NetworkView: React.FC = () => {
    const { user, userProfile } = useAuth();
    const navigate = useNavigate();
    
    const [chats, setChats] = useState<Chat[]>([]);
    const [matchingSuppliers, setMatchingSuppliers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const unsubscribe = getChatsStream(user.uid, (fetchedChats) => {
            setChats(fetchedChats);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    useEffect(() => {
        if (!userProfile) return;
        
        const oppositeRole = userProfile.role === 'seller' ? 'supplier' : 'seller';
        
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('role', '==', oppositeRole));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            let users = snapshot.docs.map(doc => doc.data() as UserProfile)
                .filter(u => u.uid !== userProfile.uid); // exclude self
                
            // Sort so those matching our categories appear first
            const myCategories = userProfile.categories || [];
            if (myCategories.length > 0) {
                users.sort((a, b) => {
                    const aMatches = a.categories?.filter(c => myCategories.includes(c)).length || 0;
                    const bMatches = b.categories?.filter(c => myCategories.includes(c)).length || 0;
                    return bMatches - aMatches;
                });
            }
            setMatchingSuppliers(users);
        }, (error) => {
            console.error("Failed to fetch matching counterparts:", error);
        });
        
        return () => unsubscribe();
    }, [userProfile]);

    const unconnectedSuppliers = useMemo(() => {
        const chatPartnerIds = new Set(chats.map(chat => 
            userProfile?.role === 'seller' ? chat.supplierId : chat.sellerId
        ));
        return matchingSuppliers.filter(s => !chatPartnerIds.has(s.uid));
    }, [matchingSuppliers, chats, userProfile]);

    const groupedChats = useMemo(() => {
        const groups: { [key: string]: Chat[] } = {};
        chats.forEach(chat => {
            const category = chat.categoriesMatched?.[0] || 'general';
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
        navigate(`/seller/chat/${chat.id}`, { state: { chatTitle: chat.supplierName } });
    };

    const handleConnect = async (supplier: UserProfile) => {
        if (!userProfile) return;
        
        const sellerProfile = userProfile.role === 'seller' ? userProfile : supplier;
        const supplierProfile = userProfile.role === 'supplier' ? userProfile : supplier;
        
        const chatId = [sellerProfile.uid, supplierProfile.uid].sort().join('_');
        const chatRef = doc(db, 'chats', chatId);
        
        try {
            const chatSnap = await getDoc(chatRef);
            if (!chatSnap.exists()) {
                const commonCategories = sellerProfile.categories.filter(cat => supplierProfile.categories.includes(cat));
                const newChat: Chat = {
                    id: chatId,
                    participants: [sellerProfile.uid, supplierProfile.uid],
                    sellerId: sellerProfile.uid,
                    sellerName: sellerProfile.name,
                    supplierId: supplierProfile.uid,
                    supplierName: supplierProfile.name,
                    categoriesMatched: commonCategories,
                    lastMessageText: 'Connection established! Send a message to start chatting.',
                    lastMessageTimestamp: serverTimestamp(),
                    unreadCount: {
                        [sellerProfile.uid]: 0,
                        [supplierProfile.uid]: 0,
                    }
                };
                await setDoc(chatRef, newChat);
            }
            navigate(`/seller/chat/${chatId}`, { state: { chatTitle: supplier.name } });
        } catch (error) {
            console.error("Failed to connect with supplier:", error);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Supplier Network</h2>
                    <p className="text-gray-500 dark:text-gray-400">Connect with suppliers matching your store's categories.</p>
                </div>
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl">
                    <UsersIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden min-h-[500px] flex flex-col">
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
                            Loading your network...
                        </div>
                    ) : (chats.length === 0 && unconnectedSuppliers.length === 0) ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center px-4">
                            <ChatIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Active Connections</h3>
                            <p className="text-gray-500 dark:text-gray-400 max-w-md">
                                Suppliers who match your store categories will appear here when they send you a message or a flash deal.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Suggested / Matching suppliers available to connect */}
                            {unconnectedSuppliers.length > 0 && (
                                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">
                                        Matching Suppliers (Available to Connect)
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {unconnectedSuppliers.map(supplier => (
                                            <div 
                                                key={supplier.uid}
                                                className="p-4 bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700 rounded-xl flex items-center justify-between hover:border-indigo-400 dark:hover:border-indigo-600 transition-all"
                                            >
                                                <div className="flex items-center min-w-0 mr-4">
                                                    <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold mr-3 shrink-0">
                                                        {supplier.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="font-semibold text-gray-900 dark:text-white truncate">{supplier.name}</h4>
                                                        <p className="text-xs text-gray-500 truncate capitalize">{supplier.categories.join(', ')}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleConnect(supplier)}
                                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow transition-colors shrink-0"
                                                >
                                                    Connect
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Active chats grouped by category */}
                            {chats.length > 0 && Object.entries(groupedChats).map(([category, categoryChats]) => (
                                <div key={category} className="mb-6">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 px-6 py-3 bg-gray-50 dark:bg-gray-700/50 sticky top-0 border-y border-gray-200 dark:border-gray-700">
                                        {category} Suppliers
                                    </h3>
                                    <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {categoryChats.map(chat => {
                                            const hasUnread = userProfile && chat.unreadCount[userProfile.uid] > 0;
                                            return (
                                                <li 
                                                    key={chat.id} 
                                                    onClick={() => handleChatClick(chat)}
                                                    className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors flex items-center group"
                                                >
                                                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-lg mr-4 group-hover:scale-105 transition-transform">
                                                        {chat.supplierName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <h4 className={`text-lg font-semibold truncate ${hasUnread ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-800 dark:text-gray-200'}`}>
                                                                {chat.supplierName}
                                                            </h4>
                                                            <span className="text-xs text-gray-400 ml-4 flex-shrink-0">
                                                                {chat.lastMessageTimestamp?.toDate ? chat.lastMessageTimestamp.toDate().toLocaleDateString() : new Date().toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        <p className={`text-sm truncate ${hasUnread ? 'text-indigo-600 dark:text-indigo-400 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                                                            {chat.lastMessageText || 'No messages yet'}
                                                        </p>
                                                    </div>
                                                    {hasUnread && (
                                                        <div className="w-3 h-3 bg-indigo-600 rounded-full ml-4 shadow-[0_0_8px_rgba(79,70,229,0.5)]"></div>
                                                    )}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NetworkView;
