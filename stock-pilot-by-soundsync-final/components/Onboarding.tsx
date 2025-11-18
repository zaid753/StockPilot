
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { setUserProfile } from '../services/firebase';
import { triggerMatching } from '../services/chatService';
import { UserProfile } from '../types';

const availableCategories = ['medical', 'grocery', 'electric', 'cloths', 'footwear', 'stationary', 'sweets'];

const Onboarding: React.FC = () => {
    const { user, userProfile, updateUserProfileState } = useAuth();
    
    // Determine initial step based on profile completeness
    const getInitialStep = () => {
        if (!userProfile?.role) return 1; // Start with role selection if not present
        if (!userProfile?.name) return 2; // Then go to name if no name
        return 3; // Finally, categories
    };

    const [step, setStep] = useState(getInitialStep);
    const [role, setRole] = useState<'seller' | 'supplier' | ''>('');
    const [name, setName] = useState(userProfile?.name || '');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    const handleRoleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!role) {
            setError('Please select a role.');
            return;
        }
        setError('');
        setStep(2); // Move to name step
    };

    const handleNameSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim().length < 3) {
            setError('Please enter a valid name (at least 3 characters).');
            return;
        }
        setError('');
        setStep(3); // Move to categories step
    };

    const toggleCategory = (category: string) => {
        setSelectedCategories(prev =>
            prev.includes(category)
            ? prev.filter(c => c !== category)
            : [...prev, category]
        );
    };

    const handleFinalSubmit = async () => {
        if (selectedCategories.length === 0) {
            setError('Please select at least one category.');
            return;
        }
        if (!user || !userProfile) return;

        setLoading(true);
        setError('');
        try {
            const finalProfile: Partial<UserProfile> = {
                role: userProfile.role || role as 'seller' | 'supplier',
                name: name.trim(),
                categories: selectedCategories,
            };
            await setUserProfile(user.uid, finalProfile);
            
            const fullProfile = { ...userProfile, ...finalProfile } as UserProfile;
            await triggerMatching(fullProfile);

            updateUserProfileState(finalProfile);

        } catch (err) {
            console.error("Failed to save profile and match:", err);
            setError('Could not save your selection. Please try again.');
        } finally {
            setLoading(false);
        }
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
                onClick={handleFinalSubmit}
                disabled={selectedCategories.length === 0 || loading}
                className="w-full py-3 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 focus:ring-indigo-500 transition duration-150 disabled:bg-gray-400 dark:disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
                {loading ? 'Saving & Connecting...' : 'Complete Setup'}
            </button>
        </div>
    );
    
    const renderStepContent = () => {
        switch (step) {
            case 1:
                return renderRoleStep();
            case 2:
                return renderNameStep();
            case 3:
                return renderCategoriesStep();
            default:
                return renderRoleStep();
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="w-full max-w-2xl p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                {renderStepContent()}
            </div>
        </div>
    );
};

export default Onboarding;
