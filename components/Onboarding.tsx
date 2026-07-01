
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { setUserProfile } from '../services/firebase';
import { triggerMatching } from '../services/chatService';
import { UserProfile } from '../types';
import SubscriptionModal from './SubscriptionModal';
import { CheckIcon, SparklesIcon } from './icons';

const availableCategories = ['medical', 'grocery', 'electric', 'cloths', 'footwear', 'stationary', 'sweets'];

const Onboarding: React.FC = () => {
    const { user, userProfile, updateUserProfileState, logOut } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (userProfile?.role && userProfile?.name) {
            navigate('/dashboard', { replace: true });
        }
    }, [userProfile, navigate]);
    
    // Determine initial step based on profile completeness
    const getInitialStep = () => {
        if (!userProfile?.role) return 1; // Start with role selection if not present
        if (!userProfile?.name) return 2; // Then go to name if no name
        if (!userProfile?.categories || userProfile.categories.length === 0) return 3; // Then categories
        if (!userProfile?.plan) return 4; // Finally, plan selection
        return 1;
    };

    const [step, setStep] = useState(getInitialStep);
    const [role, setRole] = useState<'seller' | 'supplier' | ''>('');
    const [name, setName] = useState(userProfile?.name || '');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showProPayment, setShowProPayment] = useState(false);

    const handleSignOut = async () => {
        try {
            await logOut();
        } catch (err) {
            console.error("Failed to sign out:", err);
            setError('Failed to sign out. Please try again.');
        }
    };

    const handleRoleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!role) {
            setError('Please select a role.');
            return;
        }
        setError('');
        setStep(2);
    };

    const handleNameSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim().length < 3) {
            setError('Please enter a valid name (at least 3 characters).');
            return;
        }
        setError('');
        setStep(3);
    };

    const handleCategorySubmit = (e: React.FormEvent) => {
        e.preventDefault();
         if (selectedCategories.length === 0) {
            setError('Please select at least one category.');
            return;
        }
        setError('');
        setStep(4); // Move to plan selection

        const preferredPlan = localStorage.getItem('preferredPlan');
        if (preferredPlan) {
            localStorage.removeItem('preferredPlan'); // Consume it
            if (preferredPlan === 'pro') {
                setShowProPayment(true);
            } else if (preferredPlan === 'free') {
                finalizeProfile('free');
            }
        }
    };

    const toggleCategory = (category: string) => {
        setSelectedCategories(prev =>
            prev.includes(category)
            ? prev.filter(c => c !== category)
            : [...prev, category]
        );
    };

    const finalizeProfile = async (plan: 'free' | 'pro') => {
        if (!user) return;

        setLoading(true);
        setError('');
        try {
            const finalProfile: Partial<UserProfile> = {
                uid: user.uid,
                email: user.email || '',
                role: (userProfile?.role || role) as 'seller' | 'supplier',
                name: name.trim(),
                categories: selectedCategories,
                plan: plan,
                loginMethod: userProfile?.loginMethod || 'google',
                usage: userProfile?.usage || { aiScans: 0, promosGenerated: 0, inventoryCount: 0 }
            };
            
            await setUserProfile(user.uid, finalProfile);
            
            const fullProfile = { ...userProfile, ...finalProfile } as UserProfile;
            await triggerMatching(fullProfile);

            updateUserProfileState(finalProfile);
             // App will navigate automatically as profile is now complete
        } catch (err) {
            console.error("Failed to save profile:", err);
            setError('Could not save your profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleFreePlanSelect = () => {
        finalizeProfile('free');
    };

    const handleProPlanSelect = () => {
        setShowProPayment(true);
    };
    
    const renderRoleStep = () => (
         <form onSubmit={handleRoleSubmit} className="space-y-6">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">One Last Step</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">To get started, please tell us what you do.</p>
            </div>
            <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">I am a:</label>
                <div className="flex items-center justify-center mt-4 space-x-6">
                    <button type="button" onClick={() => setRole('seller')} className={`px-8 py-3 rounded-lg font-semibold transition-all ${role === 'seller' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>Seller</button>
                    <button type="button" onClick={() => setRole('supplier')} className={`px-8 py-3 rounded-lg font-semibold transition-all ${role === 'supplier' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>Supplier</button>
                </div>
            </div>
            {error && <p className="text-sm text-center text-red-500 dark:text-red-400">{error}</p>}
            <button type="submit" disabled={!role} className="w-full py-3 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 focus:ring-indigo-500 transition duration-150 disabled:bg-gray-400 dark:disabled:bg-gray-500">
                Continue
            </button>
        </form>
    );

    const renderNameStep = () => (
        <form onSubmit={handleNameSubmit} className="space-y-6">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome to Stock Pilot</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">What is your name or the name of your business?</p>
            </div>
            <div>
                <label htmlFor="name" className="text-sm font-medium text-gray-600 dark:text-gray-300">Full Name / Business Name</label>
                <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-3 py-2 mt-1 text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., Ravi Traders"
                />
            </div>
            {error && <p className="text-sm text-center text-red-500 dark:text-red-400">{error}</p>}
            <button type="submit" className="w-full py-3 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 focus:ring-indigo-500 transition duration-150">
                Continue
            </button>
        </form>
    );

    const renderCategoriesStep = () => (
        <div className="space-y-6">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hello, {name}!</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                    Select all the product categories you {userProfile?.role === 'seller' || role === 'seller' ? 'sell in your store' : 'supply'}.
                </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {availableCategories.map(category => (
                    <button
                        key={category}
                        onClick={() => toggleCategory(category)}
                        className={`p-4 rounded-lg text-center font-semibold capitalize transition-all duration-200
                            ${selectedCategories.includes(category)
                                ? 'bg-indigo-600 text-white ring-2 ring-indigo-400'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                    >
                        {category}
                    </button>
                ))}
            </div>
            {error && <p className="text-sm text-center text-red-500 dark:text-red-400">{error}</p>}
            <button
                onClick={handleCategorySubmit}
                disabled={selectedCategories.length === 0}
                className="w-full py-3 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 focus:ring-indigo-500 transition duration-150 disabled:bg-gray-400 dark:disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
                Continue
            </button>
        </div>
    );

    const renderPlanStep = () => (
        <div className="space-y-6">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Select Your Plan</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Choose the plan that fits your business scale.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                {/* Free Plan */}
                <div className="border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6 cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-all" onClick={handleFreePlanSelect}>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Vyapar Shuru</h3>
                    <p className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">Free</p>
                    <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                        <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-green-500"/> Access to all AI features</li>
                        <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-green-500"/> 5 AI Scans / month</li>
                        <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-green-500"/> 3 Promo Generations / month</li>
                        <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-green-500"/> 50 Item Inventory Limit</li>
                    </ul>
                    <button onClick={(e) => { e.stopPropagation(); handleFreePlanSelect(); }} className="w-full mt-6 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg font-semibold text-gray-800 dark:text-white">
                        Select Free
                    </button>
                </div>

                {/* Pro Plan */}
                <div className="border-2 border-indigo-600 rounded-xl p-6 relative cursor-pointer hover:shadow-lg transition-all bg-indigo-50 dark:bg-indigo-900/20" onClick={handleProPlanSelect}>
                    <div className="absolute top-0 right-0 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">BEST VALUE</div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        Vyapar Pro <SparklesIcon className="w-4 h-4 text-yellow-500" />
                    </h3>
                    <p className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">₹299<span className="text-sm font-normal">/mo</span></p>
                    <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                        <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-green-500"/> <strong>Unlimited</strong> AI Scans</li>
                        <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-green-500"/> <strong>Unlimited</strong> Promo Gen</li>
                        <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-green-500"/> <strong>Unlimited</strong> Inventory</li>
                        <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-green-500"/> Priority Support</li>
                    </ul>
                    <button onClick={(e) => { e.stopPropagation(); handleProPlanSelect(); }} className="w-full mt-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-md">
                        Select Pro
                    </button>
                </div>
            </div>

            {loading && <p className="text-center text-indigo-600">Setting up your account...</p>}
            {showProPayment && <SubscriptionModal onClose={() => setShowProPayment(false)} onSuccess={() => finalizeProfile('pro')} />}
        </div>
    );
    
    const renderStepContent = () => {
        switch (step) {
            case 1: return renderRoleStep();
            case 2: return renderNameStep();
            case 3: return renderCategoriesStep();
            case 4: return renderPlanStep();
            default: return renderRoleStep();
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
            <div className="w-full max-w-2xl p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg relative">
                <button
                    onClick={handleSignOut}
                    className="absolute top-4 right-4 px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                    Sign Out
                </button>
                {renderStepContent()}
            </div>
        </div>
    );
};

export default Onboarding;
