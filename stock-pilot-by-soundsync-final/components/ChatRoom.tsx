
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getMessagesStream, sendMessage, markMessagesAsDelivered, markMessagesAsSeen } from '../services/chatService';
import { Message } from '../types';
import { ChatParams } from '../App';
import MessageStatus from './MessageStatus';

interface ChatRoomProps {
    chatParams: ChatParams;
    onBack: () => void;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ chatParams, onBack }) => {
    const { user, userProfile } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!user) return;
        
        // Mark messages as seen when the component mounts and the user is in the chat
        markMessagesAsSeen(chatParams.chatId, user.uid);

        const unsubscribe = getMessagesStream(chatParams.chatId, (fetchedMessages) => {
            setMessages(fetchedMessages);
            
            // As soon as we receive messages, we can mark them as "delivered"
            const unreadMessagesFromOthers = fetchedMessages
                .filter(m => m.senderId !== user.uid && m.deliveryStatus === 'sent')
                .map(m => m.id);

            if (unreadMessagesFromOthers.length > 0) {
                markMessagesAsDelivered(chatParams.chatId, unreadMessagesFromOthers);
            }
        });

        return () => {
            unsubscribe();
        };
    }, [chatParams.chatId, user]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);
    
    // Mark as seen again if the window is refocused
    useEffect(() => {
        const handleFocus = () => {
            if (user) {
                markMessagesAsSeen(chatParams.chatId, user.uid);
            }
        };
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [chatParams.chatId, user]);


    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() && userProfile) {
            sendMessage(chatParams.chatId, userProfile, newMessage.trim());
            setNewMessage('');
        }
    };

    if (!user || !userProfile) {
        return (
             <div className="flex items-center justify-center h-screen">
                <div className="text-2xl">Joining chat...</div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col p-4 md:p-8 container mx-auto">
            <header className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <button onClick={onBack} className="text-indigo-600 dark:text-indigo-400 hover:underline">
                    &larr; Back
                </button>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white capitalize text-center">{chatParams.chatTitle}</h1>
                <div className="w-20 text-right"></div> {/* Spacer */}
            </header>
            <div className="flex-1 overflow-y-auto mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex flex-col ${msg.senderId === user.uid ? 'items-end' : 'items-start'} mb-3`}>
                         <div className={`max-w-xs md:max-w-md p-3 rounded-lg shadow ${msg.senderId === user.uid ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200'}`}>
                            {msg.senderId !== user.uid && <p className="text-xs font-bold mb-1 text-indigo-500 dark:text-indigo-400">{msg.senderName}</p>}
                            <p className="text-sm">{msg.text}</p>
                        </div>
                        {msg.senderId === user.uid && (
                            <div className="flex items-center justify-end mt-1 pr-1">
                                <MessageStatus status={msg.deliveryStatus} />
                            </div>
                        )}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="flex gap-4">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-md py-2 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    aria-label="Chat message input"
                />
                <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-900 focus:ring-indigo-500 transition-colors">
                    Send
                </button>
            </form>
        </div>
    );
};

export default ChatRoom;
