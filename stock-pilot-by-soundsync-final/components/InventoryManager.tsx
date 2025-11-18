
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { LiveSession, LiveServerMessage, Modality, Blob as GenaiBlob, FunctionCall } from '@google/genai';
import { INITIATE_ADD_ITEM_TOOL, PROVIDE_ITEM_QUANTITY_TOOL, PROVIDE_ITEM_PRICE_TOOL, REMOVE_ITEM_TOOL, QUERY_INVENTORY_TOOL, PROVIDE_ITEM_EXPIRY_DATE_TOOL } from '../constants';
import { useAuth } from '../hooks/useAuth';
import { useInventory } from '../hooks/useInventory';
import InventoryTable from './InventoryTable';
import MicButton from './MicButton';
import { encode, decode, decodeAudioData } from '../utils/audioUtils';
import { getAi } from '../services/geminiService';
import { addOrUpdateItem, removeItem } from '../services/inventoryService';
import { getChatsStream } from '../services/chatService';
import { getNotificationsStream } from '../services/notificationService';
import { LogoutIcon, SearchIcon, ChatIcon, BellIcon } from './icons';
import { InventoryItem, Chat, UserProfile, Notification } from '../types';
import { ChatParams } from '../App';
import ChatListModal from './ChatListModal';

interface InventoryManagerProps {
    onNavigateToChat: (params: ChatParams) => void;
    onOpenNotifications: () => void;
}

const InventoryManager: React.FC<InventoryManagerProps> = ({ onNavigateToChat, onOpenNotifications }) => {
    const { user, userProfile, logOut } = useAuth();
    const { inventory, loading: inventoryLoading } = useInventory();
    
    const [isListening, setIsListening] = useState(false);
    const [isGreeting, setIsGreeting] = useState(false);
    const [statusText, setStatusText] = useState("Tap the mic to manage your stock with Stock Pilot.");
    const [searchTerm, setSearchTerm] = useState('');
    const [isChatModalOpen, setIsChatModalOpen] = useState(false);
    const [totalUnreadChatCount, setTotalUnreadChatCount] = useState(0);
    const [totalUnreadNotificationCount, setTotalUnreadNotificationCount] = useState(0);
    
    const [transcript, setTranscript] = useState<{ speaker: 'user' | 'assistant', text: string }[]>([]);
    const transcriptEndRef = useRef<HTMLDivElement>(null);

    const awaitingPriceInfoRef = useRef<any | null>(null);
    const awaitingQuantityInfoRef = useRef<any | null>(null);
    const awaitingExpiryInfoRef = useRef<any | null>(null);

    const sessionRef = useRef<Promise<LiveSession> | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const isSessionActiveRef = useRef(false);
    const audioPlaybackTimeRef = useRef(0);
    const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const greetingAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);
    
    useEffect(() => {
        if (!user) return;
        const unsubChats = getChatsStream(user.uid, (chats: Chat[]) => {
            const unreadSum = chats.reduce((sum, chat) => sum + (chat.unreadCount[user.uid] || 0), 0);
            setTotalUnreadChatCount(unreadSum);
        });
        const unsubNotifications = getNotificationsStream(user.uid, (notifications: Notification[]) => {
            const unreadSum = notifications.filter(n => !n.read).length;
            setTotalUnreadNotificationCount(unreadSum);
        });
        return () => {
            unsubChats();
            unsubNotifications();
        };
    }, [user]);

    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcript]);

    const handleToolCall = useCallback(async (fc: FunctionCall, session: LiveSession): Promise<void> => {
        if (!user || !userProfile) return;
        let result: any = { success: false, message: "Sorry, I couldn't do that." };
        const userCategories = userProfile.categories || [];

        switch (fc.name) {
            case 'initiateAddItem': {
                const { itemName, quantity } = fc.args;
                if (quantity) {
                    awaitingPriceInfoRef.current = { itemName, quantity };
                    result = { success: true, message: `Okay, adding ${quantity} ${itemName}. How much does one cost in rupees?` };
                } else {
                    awaitingQuantityInfoRef.current = { itemName };
                    result = { success: true, message: `Okay, you want to add ${itemName}. How many?` };
                }
                break;
            }
            case 'provideItemQuantity': {
                if (awaitingQuantityInfoRef.current) {
                    const { itemName } = awaitingQuantityInfoRef.current;
                    const { quantity } = fc.args;
                    awaitingPriceInfoRef.current = { itemName, quantity };
                    awaitingQuantityInfoRef.current = null;
                    result = { success: true, message: `Got it, ${quantity}. And how much is one in rupees?` };
                } else {
                    result = { success: false, message: "I'm sorry, I don't know which item you're providing the quantity for." };
                }
                break;
            }
            case 'provideItemPrice': {
                if (awaitingPriceInfoRef.current) {
                    const { itemName, quantity } = awaitingPriceInfoRef.current;
                    const { price } = fc.args;
                    awaitingPriceInfoRef.current = null;
                    
                    const needsExpiry = userCategories.some(cat => ['medical', 'grocery', 'sweets'].includes(cat));

                    if (needsExpiry) {
                        awaitingExpiryInfoRef.current = { itemName, quantity, price };
                        result = { success: true, message: `The price is set. Now, what is the expiry date? Please tell me in Day-Month-Year format.` };
                    } else {
                        await addOrUpdateItem(user.uid, itemName, quantity, price);
                        result = { success: true, message: `Great, I've added ${quantity} ${itemName} to your inventory.` };
                    }
                } else {
                    result = { success: false, message: "I'm sorry, I don't know which item you're providing the price for. Let's start over." };
                }
                break;
            }
            case 'provideItemExpiryDate': {
                 if (awaitingExpiryInfoRef.current) {
                    const { itemName, quantity, price } = awaitingExpiryInfoRef.current;
                    const { expiryDate } = fc.args;
                    if (!/^\d{2}-\d{2}-\d{4}$/.test(expiryDate)) {
                        result = { success: false, message: "That doesn't look right. Please provide the date in Day-Month-Year format, for example, 31-12-2025." };
                    } else {
                        await addOrUpdateItem(user.uid, itemName, quantity, price, expiryDate);
                        result = { success: true, message: `Got it. I've added ${quantity} ${itemName} with an expiry date of ${expiryDate}.` };
                        awaitingExpiryInfoRef.current = null;
                    }
                } else {
                    result = { success: false, message: "I'm sorry, I don't know which item you're providing an expiry for." };
                }
                break;
            }
            case 'removeItem': {
                const removeResult = await removeItem(user.uid, fc.args.itemName, fc.args.quantity);
                result = { success: removeResult.success, message: removeResult.message };
                break;
            }
            case 'queryInventory': {
                result = { success: true, message: "Query acknowledged. Proceed with your answer." };
                break;
            }
        }

        session.sendToolResponse({
            functionResponses: {
                id: fc.id,
                name: fc.name,
                response: { result: result.message },
            }
        });
    }, [user, userProfile]);
    
    const stopSession = useCallback(() => {
        if (!isSessionActiveRef.current) return;
        isSessionActiveRef.current = false;
    
        if (greetingAudioSourceRef.current) {
            greetingAudioSourceRef.current.stop();
            greetingAudioSourceRef.current = null;
        }

        setIsListening(false);
        setIsGreeting(false);
        setStatusText("Tap the mic to manage your stock with Stock Pilot.");
        setTranscript([]);

        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;

        scriptProcessorRef.current?.disconnect();
        scriptProcessorRef.current = null;
        
        inputAudioContextRef.current?.close().catch(console.error);
        inputAudioContextRef.current = null;

        outputAudioContextRef.current?.close().catch(console.error);
        outputAudioContextRef.current = null;
        audioSourcesRef.current.clear();

        sessionRef.current?.then(session => session.close()).catch(console.error);
        sessionRef.current = null;
        
        awaitingPriceInfoRef.current = null;
        awaitingQuantityInfoRef.current = null;
        awaitingExpiryInfoRef.current = null;
    }, []);

    const startListeningSession = async () => {
        if (!process.env.API_KEY || !user || !userProfile?.categories || !isSessionActiveRef.current) return;
        
        setIsListening(true);
        setStatusText("Connecting...");
        
        inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
       
        try {
            mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (error) {
            console.error("Microphone access denied:", error);
            setStatusText("Microphone access is required.");
            stopSession();
            return;
        }
        
        const ai = getAi();
        const userCategories = userProfile.categories;
        const needsExpiry = userCategories.some(cat => ['medical', 'grocery', 'sweets'].includes(cat));
        const systemInstruction = `You are a bilingual (English and Hindi) voice-first inventory assistant for a store with categories: ${userCategories.join(', ')}.
IMPORTANT: You must only respond in English or Hindi. Prefer English.
- You must only accept items relevant for these categories. If a user tries to add something irrelevant, politely decline.
- To add an item: Use 'initiateAddItem'. If the user doesn't say how many, the system will ask. Once you know the quantity, you must ask for the price.
- ${needsExpiry ? "For this store type, items may have an expiry date. After getting the price, you MUST ask for the expiry date and you MUST explicitly state the required format is Day-Month-Year (DD-MM-YYYY)." : "For this store type, items DO NOT have an expiry date, so DO NOT ask for one."}
- To remove an item: Use 'removeItem'.
- To answer questions: Use 'queryInventory' and then answer based on the provided inventory context.
Keep responses brief and conversational. Current inventory is: ${JSON.stringify(inventory.slice(0, 50))}`;

        let currentInput = '';
        let currentOutput = '';

        sessionRef.current = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            config: {
                systemInstruction,
                responseModalities: [Modality.AUDIO],
                inputAudioTranscription: {},
                outputAudioTranscription: {},
                tools: [{ functionDeclarations: [INITIATE_ADD_ITEM_TOOL, PROVIDE_ITEM_QUANTITY_TOOL, PROVIDE_ITEM_PRICE_TOOL, REMOVE_ITEM_TOOL, QUERY_INVENTORY_TOOL, PROVIDE_ITEM_EXPIRY_DATE_TOOL] }]
            },
            callbacks: {
                onopen: () => {
                    setStatusText("Listening... Say something.");
                    setTranscript([{ speaker: 'assistant', text: "Hello, how can I help you?" }]);
                    if (!inputAudioContextRef.current || !mediaStreamRef.current) return;
                    const source = inputAudioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
                    scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                    scriptProcessorRef.current.onaudioprocess = (e) => {
                        const inputData = e.inputBuffer.getChannelData(0);
                        const pcmBlob: GenaiBlob = {
                            data: encode(new Uint8Array(new Int16Array(inputData.map(f => f * 32768)).buffer)),
                            mimeType: 'audio/pcm;rate=16000',
                        };
                        sessionRef.current?.then((s) => isSessionActiveRef.current && s.sendRealtimeInput({ media: pcmBlob }));
                    };
                    source.connect(scriptProcessorRef.current);
                    scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);
                },
                onmessage: async (msg: LiveServerMessage) => {
                    if (msg.serverContent?.inputTranscription) {
                        currentInput += msg.serverContent.inputTranscription.text;
                        setTranscript(prev => {
                            const last = prev[prev.length - 1];
                            if (last?.speaker === 'user') {
                                const newTranscript = [...prev];
                                newTranscript[newTranscript.length - 1] = { ...last, text: currentInput };
                                return newTranscript;
                            }
                            return [...prev, { speaker: 'user', text: currentInput }];
                        });
                    }
                    if (msg.serverContent?.outputTranscription) {
                         currentOutput += msg.serverContent.outputTranscription.text;
                         setTranscript(prev => {
                            const last = prev[prev.length - 1];
                            if (last?.speaker === 'assistant') {
                                const newTranscript = [...prev];
                                newTranscript[newTranscript.length - 1] = { ...last, text: currentOutput };
                                return newTranscript;
                            }
                            return [...prev, { speaker: 'assistant', text: currentOutput }];
                        });
                    }
                    if(msg.serverContent?.turnComplete) {
                        currentInput = '';
                        currentOutput = '';
                    }

                    if (msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data) {
                        const base64 = msg.serverContent.modelTurn.parts[0].inlineData.data;
                        if (outputAudioContextRef.current) {
                            audioPlaybackTimeRef.current = Math.max(audioPlaybackTimeRef.current, outputAudioContextRef.current.currentTime);
                            const buffer = await decodeAudioData(decode(base64), outputAudioContextRef.current, 24000, 1);
                            const sourceNode = outputAudioContextRef.current.createBufferSource();
                            sourceNode.buffer = buffer;
                            sourceNode.connect(outputAudioContextRef.current.destination);
                            sourceNode.onended = () => audioSourcesRef.current.delete(sourceNode);
                            sourceNode.start(audioPlaybackTimeRef.current);
                            audioPlaybackTimeRef.current += buffer.duration;
                            audioSourcesRef.current.add(sourceNode);
                        }
                    }
                    if (msg.toolCall?.functionCalls) {
                        const s = await sessionRef.current;
                        if (s) msg.toolCall.functionCalls.forEach(fc => handleToolCall(fc, s));
                    }
                    if (msg.serverContent?.interrupted) {
                         audioSourcesRef.current.forEach(s => s.stop());
                         audioSourcesRef.current.clear();
                         audioPlaybackTimeRef.current = 0;
                    }
                },
                onerror: (e: ErrorEvent) => {
                    console.error("Session error:", e);
                    setStatusText("An error occurred. Please try again.");
                    stopSession();
                },
                onclose: () => isSessionActiveRef.current && stopSession(),
            },
        });
    };

    const startAndGreetSession = async () => {
        if (!process.env.API_KEY || !user) return;
        isSessionActiveRef.current = true;
        setIsGreeting(true);
        setStatusText("Assistant is speaking...");
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        try {
            const ai = getAi();
            const res = await ai.models.generateContent({
                model: "gemini-2.5-flash-preview-tts", contents: [{ parts: [{ text: 'Hello, how can I help you?' }] }],
                config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } } },
            });
            const base64 = res.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (!base64 || !outputAudioContextRef.current) throw new Error("TTS failed.");
            const buffer = await decodeAudioData(decode(base64), outputAudioContextRef.current, 24000, 1);
            const source = outputAudioContextRef.current.createBufferSource();
            greetingAudioSourceRef.current = source;
            source.buffer = buffer;
            source.connect(outputAudioContextRef.current.destination);
            source.onended = () => { if (isSessionActiveRef.current) startListeningSession(); };
            source.start();
        } catch (error) {
            console.error("Greeting failed:", error);
            stopSession();
        }
    };
    
    const handleMicClick = () => {
        if (isListening || isGreeting) stopSession();
        else startAndGreetSession();
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value);
    const filteredInventory = inventory.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const totalItems = inventory.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = inventory.reduce((sum, item) => sum + item.quantity * item.price, 0);
    
    useEffect(() => () => stopSession(), [stopSession]);

    return (
        <>
            <main className="container mx-auto p-4 md:p-8">
                <header className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white text-center md:text-left">Stock Pilot</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-center md:text-left">by SoundSync | Welcome, {userProfile?.name}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative"><SearchIcon className="absolute inset-y-0 left-3 w-5 h-5 text-gray-400" /><input type="text" placeholder="Search..." value={searchTerm} onChange={handleSearchChange} className="w-full md:w-40 bg-gray-200 dark:bg-gray-700 rounded-md py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                        <button onClick={() => onOpenNotifications()} title="Notifications" className="relative p-3 text-gray-500 dark:text-white bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600">
                            <BellIcon className="w-5 h-5" />
                            {totalUnreadNotificationCount > 0 && <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white ring-2 ring-white dark:ring-gray-700">{totalUnreadNotificationCount}</span>}
                        </button>
                        <button onClick={() => setIsChatModalOpen(true)} title="Chats" className="relative p-3 text-gray-500 dark:text-white bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600">
                            <ChatIcon className="w-5 h-5" />
                            {totalUnreadChatCount > 0 && <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white ring-2 ring-white dark:ring-gray-700">{totalUnreadChatCount}</span>}
                        </button>
                        <MicButton isListening={isListening || isGreeting} onClick={handleMicClick} />
                        <button onClick={logOut} title="Logout" className="p-3 text-gray-500 dark:text-white bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600"><LogoutIcon className="w-5 h-5" /></button>
                    </div>
                </header>
                <div className="text-center mb-4"><p className="text-gray-600 dark:text-gray-300 h-5">{statusText}</p></div>
                 
                 {transcript.length > 0 && (
                    <div className="mb-4 bg-gray-100 dark:bg-gray-800 rounded-lg p-4 h-32 overflow-y-auto shadow-inner">
                        {transcript.map((entry, index) => (
                            <p key={index} className="text-sm text-gray-700 dark:text-gray-300">
                                <span className={`font-bold ${entry.speaker === 'user' ? 'text-blue-600 dark:text-blue-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
                                    {entry.speaker === 'user' ? 'You: ' : 'Assistant: '}
                                </span>
                                {entry.text}
                            </p>
                        ))}
                         <div ref={transcriptEndRef} />
                    </div>
                )}

                <div className="mb-8">
                    <InventoryTable items={filteredInventory} loading={inventoryLoading} totalItems={totalItems} totalValue={totalValue} onStartChat={() => setIsChatModalOpen(true)} onAddItemClick={handleMicClick} />
                </div>
            </main>
            {isChatModalOpen && userProfile && <ChatListModal currentUserProfile={userProfile} onClose={() => setIsChatModalOpen(false)} onNavigateToChat={onNavigateToChat} />}
        </>
    );
};

export default InventoryManager;