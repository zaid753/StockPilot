import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getChatsStream, triggerMatching } from '../../services/chatService';
import { Chat } from '../../types';
import { ChartBarIcon, UsersIcon, TrendingUpIcon } from '../icons';

const SupplierDashboardView: React.FC = () => {
    const { userProfile } = useAuth();
    const [chats, setChats] = useState<Chat[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        if (!userProfile?.uid) return;
        setLoading(true);
        const unsubChats = getChatsStream(userProfile.uid, (fetchedChats) => {
            setChats(fetchedChats);
            setLoading(false);
        });
        return () => unsubChats();
    }, [userProfile?.uid]);

    const handleRefreshMatches = async () => {
        if (!userProfile) return;
        setIsRefreshing(true);
        await triggerMatching(userProfile);
        setTimeout(() => setIsRefreshing(false), 1000);
    };

    const groupedChats = useMemo(() => {
        const groups: { [key: string]: Chat[] } = {};
        chats.forEach(chat => {
            const category = chat.categoriesMatched[0] || 'general';
            if (!groups[category]) groups[category] = [];
            groups[category].push(chat);
        });
        return groups;
    }, [chats]);

    const totalConnections = chats.length;
    const topCategoryEntry = Object.entries(groupedChats).sort((a, b) => b[1].length - a[1].length)[0];
    const topCategory = topCategoryEntry ? topCategoryEntry[0] : 'N/A';
    const topCategoryCount = topCategoryEntry ? topCategoryEntry[1].length : 0;
    const activeChatsCount = chats.filter(c => c.lastMessageText && c.lastMessageText !== 'You are now connected!').length;

    return (
        <div className="w-full max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4" data-aos="fade-down">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Supplier Insights</h2>
                    <p className="text-gray-500 dark:text-gray-400">Track your network growth and demand across categories.</p>
                </div>
                <button 
                    onClick={handleRefreshMatches} 
                    disabled={isRefreshing}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                >
                    {isRefreshing ? (
                        <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> Scanning...</>
                    ) : (
                        <><UsersIcon className="w-5 h-5" /> Find New Sellers</>
                    )}
                </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-emerald-100 dark:border-emerald-900/50 relative overflow-hidden" data-aos="fade-up" data-aos-delay="100">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><UsersIcon className="w-16 h-16 text-emerald-600" /></div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Connections</p>
                    <p className="text-4xl font-extrabold text-gray-900 dark:text-white mt-2">{totalConnections}</p>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-2 font-medium">Sellers in your network</p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-emerald-100 dark:border-emerald-900/50 relative overflow-hidden" data-aos="fade-up" data-aos-delay="200">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><TrendingUpIcon className="w-16 h-16 text-emerald-600" /></div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Highest Demand Category</p>
                    <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-2 capitalize truncate">{topCategory}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{topCategoryCount} active sellers</p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-emerald-100 dark:border-emerald-900/50 relative overflow-hidden" data-aos="fade-up" data-aos-delay="300">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><ChartBarIcon className="w-16 h-16 text-emerald-600" /></div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Active Conversations</p>
                    <p className="text-4xl font-extrabold text-gray-900 dark:text-white mt-2">{activeChatsCount}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Messages exchanged</p>
                </div>
            </div>

            {/* Distribution */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700" data-aos="fade-up" data-aos-delay="400">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <ChartBarIcon className="w-5 h-5 text-emerald-500" /> Network Distribution
                </h3>
                {loading ? (
                    <div className="py-8 text-center text-gray-500">Loading...</div>
                ) : totalConnections === 0 ? (
                    <div className="py-8 text-center text-gray-500">No connections yet. Click "Find New Sellers" to match with stores.</div>
                ) : (
                    <div className="space-y-4">
                        {Object.entries(groupedChats).sort((a, b) => b[1].length - a[1].length).map(([category, catChats]) => {
                            const percentage = Math.round((catChats.length / totalConnections) * 100);
                            return (
                                <div key={category} className="flex items-center gap-4">
                                    <div className="w-32 text-sm font-medium text-gray-700 dark:text-gray-300 capitalize truncate">
                                        {category}
                                    </div>
                                    <div className="flex-1 h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-emerald-500 rounded-full" 
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                    <div className="w-12 text-right text-sm text-gray-500 font-medium">
                                        {percentage}%
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SupplierDashboardView;
