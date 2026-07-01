import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { updateUserProfile } from '../services/firebase';
import { UserIcon, SparklesIcon, SaveIcon, ShieldCheckIcon } from './icons';

const ProfileView: React.FC = () => {
    const { user, userProfile, updateUserProfileState } = useAuth();
    
    const [name, setName] = useState('');
    const [businessName, setBusinessName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        if (userProfile) {
            setName(userProfile.name || '');
            setBusinessName(userProfile.businessName || '');
            setPhone(userProfile.phone || '');
            setAddress(userProfile.address || '');
        }
    }, [userProfile]);

    const handleSave = async () => {
        if (!user || !userProfile) return;
        setLoading(true);
        try {
            const updates = { name, businessName, phone, address };
            await updateUserProfile(user.uid, updates);
            updateUserProfileState(updates);
            setSuccessMsg("Profile updated successfully!");
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (error) {
            console.error("Failed to update profile", error);
        } finally {
            setLoading(false);
        }
    };

    if (!userProfile) return null;

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div data-aos="fade-down" className="flex items-center gap-3">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl">
                    <UserIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Profile Management</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Manage your personal and business details</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Col - Stats & Info */}
                <div data-aos="fade-right" data-aos-delay="100" className="md:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 text-center">
                        <div className="w-24 h-24 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full mx-auto flex items-center justify-center text-white text-4xl font-bold shadow-lg mb-4">
                            {userProfile.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{userProfile.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 capitalize">{userProfile.role}</p>
                        
                        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 flex flex-col gap-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2"><ShieldCheckIcon className="w-4 h-4"/> Plan</span>
                                <span className="font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">{userProfile.plan}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-2xl shadow-md text-white relative overflow-hidden">
                        <SparklesIcon className="w-32 h-32 absolute -bottom-6 -right-6 text-white opacity-10" />
                        <h3 className="font-bold text-lg mb-2 relative z-10">{userProfile.role === 'supplier' ? 'Engagement Stats' : 'AI Usage'}</h3>
                        <div className="space-y-2 relative z-10">
                            {userProfile.role === 'supplier' ? (
                                <>
                                    <div className="flex justify-between text-indigo-100 text-sm">
                                        <span>Active Deals</span>
                                        <span className="font-bold text-white">{userProfile.usage?.activeBroadcasts || 0}</span>
                                    </div>
                                    <div className="flex justify-between text-indigo-100 text-sm">
                                        <span>Network Connections</span>
                                        <span className="font-bold text-white">{userProfile.usage?.connections || 0}</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex justify-between text-indigo-100 text-sm">
                                        <span>Shelf/Invoice Scans</span>
                                        <span className="font-bold text-white">{userProfile.usage?.aiScans || 0}</span>
                                    </div>
                                    <div className="flex justify-between text-indigo-100 text-sm">
                                        <span>Promos Generated</span>
                                        <span className="font-bold text-white">{userProfile.usage?.promosGenerated || 0}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Col - Edit Form */}
                <div data-aos="fade-left" data-aos-delay="200" className="md:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Edit Details</h3>
                    
                    {successMsg && (
                        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-xl text-sm font-medium border border-green-200 dark:border-green-800">
                            {successMsg}
                        </div>
                    )}

                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                            <input 
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Business Name</label>
                            <input 
                                type="text"
                                value={businessName}
                                onChange={(e) => setBusinessName(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                            <input 
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Business Address</label>
                            <textarea 
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
                            ></textarea>
                        </div>
                        
                        <div className="pt-4 flex justify-end">
                            <button 
                                onClick={handleSave}
                                disabled={loading}
                                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2 shadow-sm disabled:opacity-70"
                            >
                                {loading ? 'Saving...' : <><SaveIcon className="w-5 h-5"/> Save Changes</>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileView;
