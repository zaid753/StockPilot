
import React, { useState, useEffect } from 'react';
import { Notification } from '../types';
import { getNotificationsStream, markNotificationsAsRead } from '../services/notificationService';

interface NotificationCenterProps {
    userId: string;
    onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ userId, onClose }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = getNotificationsStream(userId, (fetchedNotifications) => {
            setNotifications(fetchedNotifications);
            setLoading(false);
        });

        // When the component opens, mark all notifications as read
        markNotificationsAsRead(userId);

        return () => unsubscribe();
    }, [userId]);
    
    const getNotificationStyle = (notification: Notification) => {
        if (notification.type === 'expiry') {
            if (notification.meta.daysLeft < 0) {
                return 'border-red-500 bg-red-50 dark:bg-red-500/10'; // Expired
            }
            return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-500/10'; // Upcoming
        }
        return 'border-gray-200 dark:border-gray-600';
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 z-40 flex items-center justify-center backdrop-blur-sm"
            onClick={onClose}
        >
            <div 
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md h-[70vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700"
                onClick={e => e.stopPropagation()}
            >
                <header className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Notifications</h2>
                    <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-2xl">&times;</button>
                </header>
                
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <p className="p-6 text-center text-gray-500 dark:text-gray-400">Loading notifications...</p>
                    ) : notifications.length === 0 ? (
                        <p className="p-6 text-center text-gray-500 dark:text-gray-400">You have no new notifications.</p>
                    ) : (
                       <ul>
                           {notifications.map(notification => (
                               <li key={notification.id} className={`p-4 border-b border-gray-200 dark:border-gray-700 border-l-4 ${getNotificationStyle(notification)}`}>
                                   <div className="flex justify-between items-start">
                                       <div>
                                           <p className={`font-semibold ${!notification.read ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>{notification.title}</p>
                                           <p className={`text-sm ${!notification.read ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}>{notification.body}</p>
                                       </div>
                                       {!notification.read && <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full flex-shrink-0 ml-4 mt-1"></span>}
                                   </div>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{notification.createdAt.toDate().toLocaleString()}</p>
                               </li>
                           ))}
                       </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationCenter;
