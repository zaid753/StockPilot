import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useInventory } from '../../hooks/useInventory';
import { LiveServerMessage, Blob as GenaiBlob, FunctionCall, Modality } from '@google/genai';
import { getAi } from '../../services/geminiService';
import { encode, decode, decodeAudioData } from '../../utils/audioUtils';
import { addOrUpdateItem, removeItem, updateInventoryItem, deleteItemsBatch, findItemByName } from '../../services/inventoryService';
import { INITIATE_ADD_ITEM_TOOL, PROVIDE_ITEM_QUANTITY_TOOL, PROVIDE_ITEM_PRICE_TOOL, REMOVE_ITEM_TOOL, QUERY_INVENTORY_TOOL, PROVIDE_ITEM_EXPIRY_DATE_TOOL, BULK_ACTION_TOOL, UPDATE_ITEM_TOOL } from '../../constants';
import AudioVisualizer from '../AudioVisualizer';
import { XMarkIcon, MicIcon, SparklesIcon } from '../icons';

const VoiceWidget: React.FC = () => {
    const { user, userProfile } = useAuth();
    const { inventory } = useInventory();
    const location = useLocation();
    
    const [isOpen, setIsOpen] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isGreeting, setIsGreeting] = useState(false);
    const [statusText, setStatusText] = useState("Tap to connect AI Assistant");
    const [transcript, setTranscript] = useState<{ speaker: 'user' | 'assistant', text: string }[]>([]);
    const [activeStream, setActiveStream] = useState<MediaStream | null>(null);

    const transcriptContainerRef = useRef<HTMLDivElement>(null);
    const inventoryRef = useRef(inventory);
    
    // AI Connection Refs
    const sessionRef = useRef<Promise<any> | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const isSessionActiveRef = useRef(false);
    const audioPlaybackTimeRef = useRef(0);
    const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const greetingAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);

    // State for multi-turn conversational tools
    const awaitingPriceInfoRef = useRef<any | null>(null);
    const awaitingQuantityInfoRef = useRef<any | null>(null);
    const awaitingExpiryInfoRef = useRef<any | null>(null);

    useEffect(() => {
        inventoryRef.current = inventory;
    }, [inventory]);

    useEffect(() => {
        const container = transcriptContainerRef.current;
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }, [transcript, isOpen]);

    const stopSession = useCallback(() => {
        if (!isSessionActiveRef.current) return;
        isSessionActiveRef.current = false;
    
        if (greetingAudioSourceRef.current) {
            try { greetingAudioSourceRef.current.stop(); } catch(e) {}
            greetingAudioSourceRef.current = null;
        }

        setIsListening(false);
        setIsGreeting(false);
        setActiveStream(null); 
        setStatusText("Tap to connect AI Assistant");
        
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }

        scriptProcessorRef.current?.disconnect();
        scriptProcessorRef.current = null;
        
        inputAudioContextRef.current?.close().catch(console.error);
        inputAudioContextRef.current = null;

        outputAudioContextRef.current?.close().catch(console.error);
        outputAudioContextRef.current = null;
        
        audioSourcesRef.current.forEach(source => {
            try { source.stop(); } catch (e) { }
        });
        audioSourcesRef.current.clear();

        sessionRef.current?.then((session: any) => session.close()).catch(console.error);
        sessionRef.current = null;
        
        awaitingPriceInfoRef.current = null;
        awaitingQuantityInfoRef.current = null;
        awaitingExpiryInfoRef.current = null;
    }, []);

    const handleToolCall = useCallback(async (fc: FunctionCall, session: any): Promise<void> => {
        if (!user || !userProfile || !fc.args) return;
        let result: any = { success: false, message: "Sorry, I couldn't do that." };
        const args = fc.args as any;

        switch (fc.name) {
            case 'initiateAddItem': {
                const { itemName, quantity } = args;
                if (quantity) {
                    awaitingPriceInfoRef.current = { itemName, quantity };
                    result = { success: true, message: `Okay, adding ${quantity} ${itemName}. What is the Buying Cost Price (CP) and Selling Price (SP)?` };
                } else {
                    awaitingQuantityInfoRef.current = { itemName };
                    result = { success: true, message: `Okay, you want to add ${itemName}. How many?` };
                }
                break;
            }
            case 'provideItemQuantity': {
                if (awaitingQuantityInfoRef.current) {
                    const { itemName } = awaitingQuantityInfoRef.current;
                    const { quantity } = args;
                    awaitingPriceInfoRef.current = { itemName, quantity };
                    awaitingQuantityInfoRef.current = null;
                    result = { success: true, message: `Got it, ${quantity}. What is the Buying Cost Price (CP) and Selling Price (SP)?` };
                } else {
                    result = { success: false, message: "I'm sorry, I don't know which item you're providing the quantity for." };
                }
                break;
            }
            case 'provideItemPrice': {
                if (awaitingPriceInfoRef.current) {
                    const { itemName, quantity } = awaitingPriceInfoRef.current;
                    const { price, costPrice } = args;
                    
                    if (price === undefined) {
                         result = { success: false, message: "I need at least the Selling Price." };
                         break;
                    }

                    awaitingPriceInfoRef.current = null;
                    await addOrUpdateItem(user.uid, itemName, quantity, price, undefined, costPrice);
                    result = { success: true, message: `Great, added ${quantity} ${itemName}.` };
                } else {
                    result = { success: false, message: "I don't know which item you're providing the price for." };
                }
                break;
            }
            case 'updateItem': {
                const { itemName, newPrice, newQuantity, newCostPrice } = args;
                const foundItem = await findItemByName(user.uid, itemName);
                if (!foundItem) {
                     result = { success: false, message: `I couldn't find ${itemName} in your inventory to update.` };
                } else {
                     const updates: any = {};
                     if (newPrice !== undefined) updates.price = newPrice;
                     if (newCostPrice !== undefined) updates.costPrice = newCostPrice;
                     if (newQuantity !== undefined) updates.quantity = newQuantity;
                     
                     if (Object.keys(updates).length > 0) {
                        await updateInventoryItem(user.uid, foundItem.id, updates);
                        result = { success: true, message: `Updated ${itemName}.` };
                     } else {
                        result = { success: false, message: `What would you like to update for ${itemName}?` };
                     }
                }
                break;
            }
            case 'removeItem': {
                const removeResult = await removeItem(user.uid, args.itemName, args.quantity);
                result = { success: removeResult.success, message: removeResult.message };
                break;
            }
            case 'queryInventory': {
                const items = inventoryRef.current;
                const totalValue = items.reduce((acc, item) => acc + (item.quantity * item.price), 0);
                const inventoryList = items.map(i => `${i.name} (Qty: ${i.quantity})`).join(', ');
                result = { success: true, message: inventoryList ? `Total value: ${totalValue}. Items: ${inventoryList}` : "Inventory is empty." };
                break;
            }
        }

        session.sendToolResponse({
            functionResponses: [{
                id: fc.id,
                name: fc.name,
                response: { result: result.message },
            }]
        });
    }, [user, userProfile]);

    const connectToGemini = async () => {
        if (!user || !userProfile?.categories || !isSessionActiveRef.current) return;
        
        if (!inputAudioContextRef.current || !outputAudioContextRef.current || !mediaStreamRef.current) {
             stopSession();
             return;
        }

        setIsListening(true);
        setStatusText("Listening... Say something.");

        const ai = getAi();
        const userCats = userProfile.categories.join(', ');
        const systemInstruction = userProfile.role === 'supplier'
            ? `You are a bilingual AI business assistant for a wholesale supplier in India.
        1. Understand Hindi, English, and Hinglish.
        2. Supplier Categories: [${userCats}].
        3. Assist the supplier in managing active deals, drafting flash deals, and communicating with retail store sellers.
        4. Be professional, persuasive, and focus on B2B sales and network management.`
            : `You are a bilingual inventory assistant for a shopkeeper in India. 
        1. Understand Hindi, English, and Hinglish. 
        2. Store Categories: [${userCats}]. 
        3. ALWAYS ask for BOTH "Cost Price" (CP) and "Selling Price" (SP) when adding items.
        4. Use provided tools.`;

        try {
            sessionRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    systemInstruction,
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    tools: [{ functionDeclarations: [INITIATE_ADD_ITEM_TOOL, PROVIDE_ITEM_QUANTITY_TOOL, PROVIDE_ITEM_PRICE_TOOL, REMOVE_ITEM_TOOL, QUERY_INVENTORY_TOOL, PROVIDE_ITEM_EXPIRY_DATE_TOOL, BULK_ACTION_TOOL, UPDATE_ITEM_TOOL] }]
                },
                callbacks: {
                    onopen: () => {
                        if (!inputAudioContextRef.current || !mediaStreamRef.current) return;
                        const source = inputAudioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
                        scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current.onaudioprocess = (e) => {
                            if (!isSessionActiveRef.current) return;
                            const inputData = e.inputBuffer.getChannelData(0);
                            const pcmBlob: GenaiBlob = { data: encode(new Uint8Array(new Int16Array(inputData.map(f => f * 32768)).buffer)), mimeType: 'audio/pcm;rate=16000' };
                            sessionRef.current?.then((s: any) => s.sendRealtimeInput({ media: pcmBlob }));
                        };
                        source.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);
                    },
                    onmessage: async (msg: LiveServerMessage) => {
                        if (!isSessionActiveRef.current) return;

                        if (msg.serverContent?.interrupted) {
                            audioSourcesRef.current.forEach(source => { try { source.stop(); } catch (e) {} });
                            audioSourcesRef.current.clear();
                            if (outputAudioContextRef.current) {
                                audioPlaybackTimeRef.current = outputAudioContextRef.current.currentTime;
                            }
                        }

                        const inlineData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData;
                        if (inlineData?.data) {
                            const base64 = inlineData.data;
                            if (outputAudioContextRef.current) {
                                if (outputAudioContextRef.current.state === 'suspended') {
                                    await outputAudioContextRef.current.resume();
                                }
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

                        if (msg.serverContent?.outputTranscription?.text) {
                            const text = msg.serverContent.outputTranscription.text;
                            setTranscript(prev => {
                                const last = prev[prev.length - 1];
                                if (last && last.speaker === 'assistant') {
                                    return [...prev.slice(0, -1), { ...last, text: last.text + text }];
                                }
                                return [...prev, { speaker: 'assistant', text }];
                            });
                        }

                        if (msg.serverContent?.inputTranscription?.text) {
                            const text = msg.serverContent.inputTranscription.text;
                            setTranscript(prev => {
                                const last = prev[prev.length - 1];
                                if (last && last.speaker === 'user') {
                                    return [...prev.slice(0, -1), { ...last, text: last.text + text }];
                                }
                                return [...prev, { speaker: 'user', text }];
                            });
                        }

                        if (msg.toolCall?.functionCalls) {
                            const s = await sessionRef.current;
                            if (s) msg.toolCall.functionCalls.forEach(fc => handleToolCall(fc, s));
                        }
                    },
                    onerror: (e: ErrorEvent) => { 
                        setStatusText("Connection Error.");
                        stopSession(); 
                    },
                    onclose: () => {
                         if (isSessionActiveRef.current) stopSession();
                    },
                },
            });
        } catch (e: any) {
            setStatusText("Failed to connect.");
            stopSession();
        }
    };

    const startAndGreetSession = async () => {
        if (!user) return;
        
        if (isSessionActiveRef.current) {
            stopSession();
            return;
        }

        setIsOpen(true);
        isSessionActiveRef.current = true;
        setIsGreeting(true);
        setTranscript([]); 
        setStatusText("Initializing...");

        try {
            mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
            setActiveStream(mediaStreamRef.current);

            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            
            await outputAudioContextRef.current.resume();
            await inputAudioContextRef.current.resume();

        } catch (error: any) {
            setStatusText("Microphone permission denied.");
            stopSession();
            return;
        }

        setStatusText("Assistant is speaking...");
        setTranscript([{ speaker: 'assistant', text: "Hello, how can I help you?" }]);

        try {
            const ai = getAi();
            const res = await ai.models.generateContent({
                model: "gemini-2.5-flash-preview-tts", 
                contents: [{ parts: [{ text: "Hello, how can I help you?" }] }],
                config: { 
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } } 
                }
            });

            if (res.candidates && res.candidates[0]?.content?.parts?.[0]?.inlineData?.data) {
                const base64Audio = res.candidates[0].content.parts[0].inlineData.data;
                const buffer = await decodeAudioData(decode(base64Audio), outputAudioContextRef.current, 24000, 1);
                
                const source = outputAudioContextRef.current.createBufferSource();
                source.buffer = buffer;
                source.connect(outputAudioContextRef.current.destination);
                
                greetingAudioSourceRef.current = source;
                source.onended = () => {
                    greetingAudioSourceRef.current = null;
                    setIsGreeting(false);
                    connectToGemini();
                };
                
                audioPlaybackTimeRef.current = outputAudioContextRef.current.currentTime;
                source.start(audioPlaybackTimeRef.current);
                audioPlaybackTimeRef.current += buffer.duration;
            } else {
                setIsGreeting(false);
                connectToGemini();
            }
        } catch (error) {
            setIsGreeting(false);
            connectToGemini();
        }
    };

    if (location.pathname.endsWith('/ai')) {
        return null;
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Expanded Widget */}
            {isOpen && (
                <div className="bg-white dark:bg-gray-800 w-80 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 mb-4 overflow-hidden flex flex-col transition-all duration-300 transform origin-bottom-right">
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex justify-between items-center text-white">
                        <h3 className="font-bold">AI Stock Assistant</h3>
                        <button onClick={() => { setIsOpen(false); stopSession(); }} className="text-white/80 hover:text-white">
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <div className="p-4 bg-indigo-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center relative h-24">
                        {(isListening || isGreeting) && (
                            <AudioVisualizer stream={activeStream} isActive={isListening || isGreeting} />
                        )}
                        <p className="text-xs text-indigo-800 dark:text-indigo-300 mt-2 z-10 font-medium">{statusText}</p>
                    </div>

                    <div ref={transcriptContainerRef} className="h-48 overflow-y-auto p-4 space-y-3 bg-white dark:bg-gray-800 text-sm custom-scrollbar">
                        {transcript.length === 0 ? (
                            <p className="text-gray-400 text-xs italic text-center mt-8">Say "Add 10 apples" to begin.</p>
                        ) : (
                            transcript.map((entry, i) => (
                                <div key={i} className={`flex ${entry.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <span className={`inline-block px-3 py-2 rounded-xl max-w-[85%] ${
                                        entry.speaker === 'user' 
                                        ? 'bg-indigo-600 text-white rounded-br-sm' 
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-sm'
                                    }`}>
                                        {entry.text}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Floating Action Button */}
            <div className={`relative transition-all duration-300 ${isSessionActiveRef.current ? 'scale-105' : 'hover:scale-105'}`}>
                {/* Glowing ring when active */}
                {(isListening || isGreeting) && (
                    <div className="absolute -inset-2 rounded-full bg-indigo-500 opacity-20 blur-xl animate-pulse pointer-events-none"></div>
                )}
                
                <button
                    onClick={isSessionActiveRef.current ? stopSession : startAndGreetSession}
                    className={`relative flex items-center justify-center gap-3 px-6 py-4 rounded-full shadow-2xl transition-all duration-300 overflow-hidden group
                        ${isSessionActiveRef.current 
                            ? 'bg-red-500 hover:bg-red-600 text-white' 
                            : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white'
                        }`}
                >
                    {/* Ripple effect overlay */}
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    {isSessionActiveRef.current ? (
                        <>
                            <span className="relative flex h-4 w-4">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-4 w-4 bg-white"></span>
                            </span>
                            <span className="font-bold tracking-wide">Stop AI</span>
                        </>
                    ) : (
                        <>
                            <SparklesIcon className="w-5 h-5 animate-pulse" />
                            <span className="font-bold tracking-wide">Ask StockPilot AI</span>
                            <MicIcon className="w-5 h-5 ml-1" />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default VoiceWidget;
