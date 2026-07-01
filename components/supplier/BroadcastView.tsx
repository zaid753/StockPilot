import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getChatsStream, broadcastMessage } from '../../services/chatService';
import { Chat } from '../../types';
import { MegaphoneIcon } from '../icons';
import Toast from '../Toast';

const BroadcastView: React.FC = () => {
    const { userProfile } = useAuth();
    const [chats, setChats] = useState<Chat[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [broadcastText, setBroadcastText] = useState('');
    const [isBroadcasting, setIsBroadcasting] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    useEffect(() => {
        if (!userProfile?.uid) return;
        const unsubChats = getChatsStream(userProfile.uid, (fetchedChats) => {
            setChats(fetchedChats);
            setLoading(false);
        });
        return () => unsubChats();
    }, [userProfile?.uid]);

    const groupedChats = useMemo(() => {
        const groups: { [key: string]: Chat[] } = {};
        chats.forEach(chat => {
            const category = chat.categoriesMatched[0] || 'general';
            if (!groups[category]) groups[category] = [];
            groups[category].push(chat);
        });
        return Object.keys(groups).sort().reduce((acc, key) => {
            acc[key] = groups[key];
            return acc;
        }, {} as { [key: string]: Chat[] });
    }, [chats]);

    const handleBroadcast = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!broadcastText.trim() || !userProfile) return;
        
        setIsBroadcasting(true);
        try {
            const targetChats = selectedCategory 
                ? groupedChats[selectedCategory] || [] 
                : chats;
                
            if (targetChats.length === 0) {
                setToastMessage("No sellers found in the selected category.");
                setIsBroadcasting(false);
                return;
            }

            const chatIds = targetChats.map(c => c.id);
            await broadcastMessage(chatIds, userProfile.uid, broadcastText.trim());
            
            setToastMessage(`Broadcast sent to ${targetChats.length} sellers!`);
            setBroadcastText('');
        } catch (error) {
            console.error("Broadcast failed", error);
            setToastMessage("Failed to send broadcast.");
        } finally {
            setIsBroadcasting(false);
        }
    };

    const targetCount = selectedCategory ? (groupedChats[selectedCategory]?.length || 0) : chats.length;

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6">
            <Toast message={toastMessage} onClose={() => setToastMessage('')} />
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Flash Deals</h2>
                    <p className="text-gray-500 dark:text-gray-400">Instantly notify sellers about new stock or special offers.</p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-emerald-100 dark:border-emerald-900/50 p-6 md:p-8">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100 dark:border-gray-700">
                    <div className="p-4 bg-emerald-100 dark:bg-emerald-900/50 rounded-full">
                        <MegaphoneIcon className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Send a Broadcast</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Reach multiple sellers at once.</p>
                    </div>
                </div>

                <form onSubmit={handleBroadcast} className="space-y-6">
                    {/* Category Selector */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Target Audience
                        </label>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => setSelectedCategory(null)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                                    selectedCategory === null 
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                            >
                                All Sellers ({chats.length})
                            </button>
                            {Object.entries(groupedChats).map(([cat, catChats]) => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border capitalize ${
                                        selectedCategory === cat 
                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
                                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    {cat} ({catChats.length})
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Message Input */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Message
                        </label>
                        <textarea
                            value={broadcastText}
                            onChange={(e) => setBroadcastText(e.target.value)}
                            placeholder="e.g., Flash sale! 20% off on all cold drinks today. Reply to order."
                            className="w-full bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl p-4 min-h-[120px] focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all resize-none"
                            required
                        />
                    </div>

                    {/* Submit */}
                    <div className="flex items-center justify-between pt-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Sending to <strong className="text-emerald-600 dark:text-emerald-400">{targetCount}</strong> seller(s)
                        </p>
                        <button
                            type="submit"
                            disabled={isBroadcasting || targetCount === 0 || !broadcastText.trim()}
                            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-xl flex items-center gap-2 transition-transform transform active:scale-95 shadow-md"
                        >
                            {isBroadcasting ? (
                                <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> Sending...</>
                            ) : (
                                <><MegaphoneIcon className="w-5 h-5" /> Send Broadcast</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BroadcastView;
