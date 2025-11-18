
import React, { useState, useEffect } from 'react';
import { useAuth, AuthProvider } from './hooks/useAuth';
import InventoryManager from './components/InventoryManager';
import { InventoryProvider } from './hooks/useInventory';
import SupplierDashboard from './components/SupplierDashboard';
import ChatRoom from './components/ChatRoom';
import { ThemeProvider } from './hooks/useTheme';
import Onboarding from './components/Onboarding';
import { getChatsStream } from './services/chatService';
import Toast from './components/Toast';
import { Chat } from './types';
import { useExpiryScheduler } from './hooks/useExpiryScheduler';
import NotificationCenter from './components/NotificationCenter';
import LandingPage from './components/landing/LandingPage';

// Define navigation state types
export interface ChatParams {
    chatId: string;
    chatTitle: string;
}

const AppContent: React.FC = () => {
    const { user, userProfile, loading } = useAuth();
    const [activeChatParams, setActiveChatParams] = useState<ChatParams | null>(null);
    const [toastMessage, setToastMessage] = useState('');
    const lastMessageTimestampRef = React.useRef<any>(null);
    const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);

    // Run the expiry checker in the background when a user is logged in
    useExpiryScheduler(user?.uid);

    useEffect(() => {
        if (!user || !userProfile?.role) return;

        const unsubscribe = getChatsStream(user.uid, (chats: Chat[]) => {
            if (chats.length === 0) return;
            const latestChat = chats.sort((a,b) => (b.lastMessageTimestamp?.toMillis() ?? 0) - (a.lastMessageTimestamp?.toMillis() ?? 0))[0];
            
            if (latestChat && latestChat.lastMessageTimestamp && latestChat.lastMessageText) {
                const newTimestamp = latestChat.lastMessageTimestamp.seconds;
                const lastTimestamp = lastMessageTimestampRef.current?.seconds || 0;

                const senderId = latestChat.participants.find(p => p !== user.uid);
                
                if (newTimestamp > lastTimestamp && (latestChat.unreadCount[user.uid] || 0) > 0) {
                    const senderName = latestChat.sellerId === senderId ? latestChat.sellerName : latestChat.supplierName;
                    setToastMessage(`New message from ${senderName}`);
                    lastMessageTimestampRef.current = latestChat.lastMessageTimestamp;
                }
            }
        });

        return () => unsubscribe();
    }, [user, userProfile?.role]);

    const navigateToChat = (params: ChatParams) => setActiveChatParams(params);
    const navigateFromChat = () => setActiveChatParams(null);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
                <div className="text-2xl text-gray-800 dark:text-gray-200">Loading...</div>
            </div>
        );
    }

    if (!user) {
        return <LandingPage />;
    }
    
    if (userProfile && (!userProfile.role || !userProfile.name)) {
        return <Onboarding />;
    }

    if (activeChatParams) {
        return <ChatRoom chatParams={activeChatParams} onBack={navigateFromChat} />;
    }
    
    const renderDashboard = () => {
        if (userProfile?.role === 'seller') {
            return (
                <InventoryProvider userId={user.uid}>
                    <InventoryManager 
                        onNavigateToChat={navigateToChat} 
                        onOpenNotifications={() => setIsNotificationCenterOpen(true)} 
                    />
                </InventoryProvider>
            );
        }
        if (userProfile?.role === 'supplier') {
            return <SupplierDashboard 
                        onNavigateToChat={navigateToChat}
                        onOpenNotifications={() => setIsNotificationCenterOpen(true)}
                    />;
        }
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
                <div className="text-2xl text-gray-800 dark:text-gray-200">Loading user profile...</div>
            </div>
        );
    };

    return (
        <>
            <Toast message={toastMessage} onClose={() => setToastMessage('')} />
            {renderDashboard()}
            {isNotificationCenterOpen && user && (
                <NotificationCenter userId={user.uid} onClose={() => setIsNotificationCenterOpen(false)} />
            )}
        </>
    );
};

const App: React.FC = () => {
    return (
        <ThemeProvider>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </ThemeProvider>
    );
};

export default App;
