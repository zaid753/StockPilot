
import React, { useState } from 'react';
import { CheckIcon, SparklesIcon, XMarkIcon } from './icons';
import { useAuth } from '../hooks/useAuth';
import { setUserProfile, recordTransaction } from '../services/firebase';

interface SubscriptionModalProps {
    onClose: () => void;
    forcedPlan?: 'pro'; // If opened with a specific intent
    onSuccess?: () => void;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ onClose, onSuccess }) => {
    const { user, userProfile, updateUserProfileState } = useAuth();
    const [isProcessing, setIsProcessing] = useState(false);
    const [step, setStep] = useState<'details' | 'payment' | 'success'>('details');
    
    // Dummy Form State
    const [cardName, setCardName] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [formError, setFormError] = useState('');

    const validateAndPay = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!cardName || !cardNumber || !expiry || !cvv) {
            setFormError("Please fill in all payment details.");
            return;
        }
        if (cardNumber.length < 12) {
             setFormError("Please enter a valid card number.");
             return;
        }
        
        handleUpgrade();
    };

    const handleUpgrade = async () => {
        if (!user) return;
        setIsProcessing(true);
        setFormError('');

        // Simulate Payment Gateway Delay
        setTimeout(async () => {
            try {
                // 1. Update User Profile
                await setUserProfile(user.uid, { plan: 'pro' });
                updateUserProfileState({ plan: 'pro' });
                
                // 2. Record Transaction for Admin Panel
                await recordTransaction(
                    user.uid,
                    userProfile?.name || 'Unknown User',
                    299,
                    'pro',
                    'Card (Simulated)'
                );

                setStep('success');
                
                setTimeout(() => {
                    if (onSuccess) onSuccess();
                    onClose();
                }, 2000);
            } catch (error) {
                console.error("Upgrade failed", error);
                setFormError("Payment failed. Please try again.");
            } finally {
                setIsProcessing(false);
            }
        }, 2000);
    };

    if (step === 'success') {
         return (
            <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center animate-fade-in-down">
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckIcon className="w-10 h-10 text-green-600 dark:text-green-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Payment Successful!</h2>
                    <p className="text-gray-500 dark:text-gray-400">Welcome to Vyapar Pro. Redirecting...</p>
                </div>
            </div>
         );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden relative animate-fade-in-down my-8">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 z-10">
                    <XMarkIcon className="w-6 h-6" />
                </button>
                
                {step === 'details' && (
                    <>
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white text-center">
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                                <SparklesIcon className="w-8 h-8 text-yellow-300" />
                            </div>
                            <h2 className="text-2xl font-bold">Upgrade to Vyapar Pro</h2>
                            <p className="text-indigo-100 mt-2">Unlimited Scans, Promos & Inventory.</p>
                        </div>

                        <div className="p-8">
                            <div className="space-y-4 mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="p-1 bg-green-100 dark:bg-green-900/50 rounded-full">
                                        <CheckIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                                    </div>
                                    <span className="text-gray-700 dark:text-gray-300">Unlimited AI Invoice Scans</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-1 bg-green-100 dark:bg-green-900/50 rounded-full">
                                        <CheckIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                                    </div>
                                    <span className="text-gray-700 dark:text-gray-300">Unlimited Shelf Doctor Analysis</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-1 bg-green-100 dark:bg-green-900/50 rounded-full">
                                        <CheckIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                                    </div>
                                    <span className="text-gray-700 dark:text-gray-300">Unlimited WhatsApp Promos</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Amount</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">₹299 <span className="text-sm font-normal text-gray-500">/ mo</span></p>
                                </div>
                                <div className="text-xs text-green-600 dark:text-green-400 font-bold bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
                                    SAVE 60%
                                </div>
                            </div>

                            <button 
                                onClick={() => setStep('payment')}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transform transition-all active:scale-95"
                            >
                                Proceed to Payment
                            </button>
                        </div>
                    </>
                )}

                {step === 'payment' && (
                    <div className="p-8">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Secure Payment</h3>
                        <form onSubmit={validateAndPay} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cardholder Name</label>
                                <input 
                                    type="text" 
                                    value={cardName}
                                    onChange={e => setCardName(e.target.value)}
                                    placeholder="e.g. Rajesh Kumar"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Card Number</label>
                                <input 
                                    type="text" 
                                    value={cardNumber}
                                    onChange={e => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                                    placeholder="0000 0000 0000 0000"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:border-indigo-500"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Expiry Date</label>
                                    <input 
                                        type="text" 
                                        value={expiry}
                                        onChange={e => setExpiry(e.target.value.replace(/[^0-9/]/g, '').slice(0, 5))}
                                        placeholder="MM/YY"
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">CVV</label>
                                    <input 
                                        type="password" 
                                        value={cvv}
                                        onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                                        placeholder="123"
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:border-indigo-500"
                                    />
                                </div>
                            </div>
                            
                            {formError && <p className="text-red-500 text-sm font-medium">{formError}</p>}
                            
                            <div className="pt-4">
                                <button 
                                    type="submit"
                                    disabled={isProcessing}
                                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transform transition-all active:scale-95 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isProcessing ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            Processing...
                                        </>
                                    ) : (
                                        'Pay ₹299'
                                    )}
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setStep('details')}
                                    className="w-full mt-2 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-medium"
                                >
                                    Back
                                </button>
                            </div>
                            <p className="text-xs text-center text-gray-400 mt-2">
                                This is a dummy payment screen. No real money will be deducted.
                            </p>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SubscriptionModal;
