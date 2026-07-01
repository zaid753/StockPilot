
import React, { useState, useEffect } from 'react';
import { getSiteConfig, updateSiteConfig } from '../../services/siteConfigService';
import { getAllUsers, getAllTransactions } from '../../services/firebase';
import { setDynamicApiKey } from '../../services/geminiService';
import { SiteConfig, UserProfile, Transaction, SubscriptionPlan } from '../../types';
import { LogoutIcon, PencilSquareIcon, PlusIcon, TrashIcon, SecureAuthIcon, ChartBarIcon } from '../icons';
import Toast from '../Toast';

interface AdminDashboardProps {
    onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
    const [config, setConfig] = useState<SiteConfig | null>(null);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'financials' | 'content' | 'api' | 'plans'>('overview');
    const [toastMessage, setToastMessage] = useState('');
    const [saving, setSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // API Config State
    const [newApiKey, setNewApiKey] = useState('');
    const [keyVisibility, setKeyVisibility] = useState(false);

    // Content Sub-tab
    const [contentTab, setContentTab] = useState<'hero' | 'features' | 'testimonials' | 'faq' | 'style' | 'footer'>('hero');

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [conf, allUsers, allTx] = await Promise.all([
                    getSiteConfig(),
                    getAllUsers(),
                    getAllTransactions()
                ]);
                setConfig(conf);
                
                // Initialize API Key input if exists
                if (conf.apiConfig?.geminiApiKey) {
                    setNewApiKey(conf.apiConfig.geminiApiKey);
                    setDynamicApiKey(conf.apiConfig.geminiApiKey); // Hot swap on load
                }

                setUsers(allUsers);
                setTransactions(allTx);
            } catch (error) {
                console.error("Failed to load admin data", error);
                setToastMessage("Error loading data. Check Firebase permissions.");
                // Set a fallback config so the UI doesn't crash to blank
                setConfig({
                    hero: { title: '', subtitle: '', imageUrl: '' },
                    features: [],
                    testimonials: [],
                    faqs: [],
                    footer: { socialLinks: {} as any, links: [] },
                    style: {},
                    apiConfig: { geminiApiKey: '' },
                    plans: []
                } as any);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleSave = async () => {
        if (!config) return;
        setSaving(true);
        try {
            await updateSiteConfig(config);
            setToastMessage('Changes saved successfully!');
        } catch (error) {
            setToastMessage('Failed to save changes.');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveApiKey = async () => {
        if (!config) return;
        setSaving(true);
        try {
            const updatedConfig = { 
                ...config, 
                apiConfig: { 
                    ...config.apiConfig, 
                    geminiApiKey: newApiKey 
                } 
            };
            
            await updateSiteConfig(updatedConfig);
            setConfig(updatedConfig);
            setDynamicApiKey(newApiKey);
            
            setToastMessage('API Key updated & applied!');
        } catch (error) {
            console.error(error);
            setToastMessage('Failed to update API Key.');
        } finally {
            setSaving(false);
        }
    };

    const updateConfig = (key: keyof SiteConfig, value: any) => {
        if (!config) return;
        setConfig({ ...config, [key]: value });
    };

    const updateStyle = (key: string, value: string) => {
        if (!config) return;
        setConfig({
            ...config,
            style: {
                ...config.style!,
                [key]: value
            }
        });
    };
    
    // --- Plan Management ---
    const updatePlan = (index: number, field: keyof SubscriptionPlan, value: any) => {
        if (!config || !config.plans) return;
        const newPlans = [...config.plans];
        (newPlans[index] as any)[field] = value;
        setConfig({ ...config, plans: newPlans });
    };

    const addFeatureToPlan = (planIndex: number) => {
        if (!config || !config.plans) return;
        const newPlans = [...config.plans];
        newPlans[planIndex].features.push('New Feature');
        setConfig({ ...config, plans: newPlans });
    };

    const updatePlanFeature = (planIndex: number, featureIndex: number, value: string) => {
         if (!config || !config.plans) return;
         const newPlans = [...config.plans];
         newPlans[planIndex].features[featureIndex] = value;
         setConfig({ ...config, plans: newPlans });
    };

    const removePlanFeature = (planIndex: number, featureIndex: number) => {
         if (!config || !config.plans) return;
         const newPlans = [...config.plans];
         newPlans[planIndex].features.splice(featureIndex, 1);
         setConfig({ ...config, plans: newPlans });
    };

    // --- Content Helpers ---
    const updateSocialLink = (platform: string, url: string) => {
        if (!config) return;
        setConfig({
            ...config,
            footer: {
                ...config.footer,
                socialLinks: {
                    ...config.footer.socialLinks,
                    [platform]: url
                }
            }
        });
    };

    const updateArrayItem = (arrayName: 'features' | 'testimonials' | 'faqs', index: number, field: string, value: any) => {
        if (!config) return;
        const newArray = [...config[arrayName]];
        (newArray[index] as any)[field] = value;
        setConfig({ ...config, [arrayName]: newArray });
    };

    const removeArrayItem = (arrayName: 'features' | 'testimonials' | 'faqs', index: number) => {
        if (!config) return;
        const newArray = config[arrayName].filter((_, i) => i !== index);
        setConfig({ ...config, [arrayName]: newArray as any });
    };

    const addArrayItem = (arrayName: 'features' | 'testimonials' | 'faqs') => {
        if (!config) return;
        let newItem;
        if (arrayName === 'features') {
            newItem = { title: 'New Feature', description: 'Description here', iconName: 'Inventory' };
        } else if (arrayName === 'testimonials') {
            newItem = { name: 'New User', role: 'Customer', quote: 'Great service!', image: 'https://via.placeholder.com/100' };
        } else {
            newItem = { question: 'New Question?', answer: 'Answer here.' };
        }
        setConfig({ ...config, [arrayName]: [...config[arrayName], newItem] as any });
    };
    
    const updateFooterLink = (index: number, field: 'label' | 'url', value: string) => {
        if (!config) return;
        const newLinks = [...config.footer.links];
        newLinks[index] = { ...newLinks[index], [field]: value };
        setConfig({
            ...config,
            footer: {
                ...config.footer,
                links: newLinks
            }
        });
    };
    
    const addFooterLink = () => {
        if (!config) return;
        const newLinks = [...config.footer.links, { label: 'New Link', url: '#' }];
        setConfig({
            ...config,
            footer: {
                ...config.footer,
                links: newLinks
            }
        });
    };
    
    const removeFooterLink = (index: number) => {
         if (!config) return;
        const newLinks = config.footer.links.filter((_, i) => i !== index);
        setConfig({
            ...config,
            footer: {
                ...config.footer,
                links: newLinks
            }
        });
    };

    // Stats Calculation
    const totalUsers = users.length;
    const sellers = users.filter(u => u.role === 'seller').length;
    const suppliers = users.filter(u => u.role === 'supplier').length;
    const proUsers = users.filter(u => u.plan === 'pro').length;
    const freeUsers = totalUsers - proUsers;
    const totalRevenue = transactions.reduce((sum, tx) => sum + tx.amount, 0);
    
    const copyEmails = () => {
        const emails = users.map(u => u?.email).filter(Boolean).join(', ');
        navigator.clipboard.writeText(emails);
        setToastMessage(`Copied emails to clipboard!`);
    };

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);
    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        return timestamp.toDate ? timestamp.toDate().toLocaleDateString() : new Date().toLocaleDateString();
    };

    const iconOptions = ['SmartMatch', 'Chat', 'Inventory', 'Expiry', 'Secure', 'Cloud', 'Camera', 'Invoice', 'Analytics'];

    if (isLoading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white text-xl font-bold">Loading Admin Command Center...</div>;
    if (!config) return null;

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
            <Toast message={toastMessage} onClose={() => setToastMessage('')} />
            
            {/* Admin Header */}
            <header className="bg-gray-800 border-b border-gray-700 p-4 shadow-lg sticky top-0 z-30">
                <div className="container mx-auto flex justify-between items-center">
                    <h1 className="text-xl font-bold flex items-center gap-3 text-indigo-400">
                        <PencilSquareIcon className="w-6 h-6" />
                        Stock Pilot Admin
                    </h1>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-400">Authenticated as Admin</span>
                        <button onClick={onLogout} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors text-sm font-bold">
                            <LogoutIcon className="w-4 h-4" />
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <div className="container mx-auto p-4 md:p-8">
                {/* Top Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8" data-aos="fade-up">
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl border border-green-500/20 shadow-lg hover:shadow-green-500/10 transition-all">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-400 text-xs uppercase font-bold tracking-wider">Total Revenue</p>
                                <p className="text-3xl font-bold text-green-400 mt-2">{formatCurrency(totalRevenue)}</p>
                                <p className="text-xs text-green-500/50 mt-1 flex items-center gap-1">&#8593; Lifetime Earnings</p>
                            </div>
                            <div className="p-2 bg-green-500/10 rounded-lg"><ChartBarIcon className="w-5 h-5 text-green-400" /></div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl border border-indigo-500/20 shadow-lg hover:shadow-indigo-500/10 transition-all">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-400 text-xs uppercase font-bold tracking-wider">Total Users</p>
                                <p className="text-3xl font-bold text-white mt-2">{totalUsers}</p>
                                <div className="flex gap-2 mt-2 text-xs">
                                    <span className="text-indigo-400 font-bold">{sellers} Sellers</span>
                                    <span className="text-gray-600">|</span>
                                    <span className="text-purple-400 font-bold">{suppliers} Suppliers</span>
                                </div>
                            </div>
                            <div className="p-2 bg-indigo-500/10 rounded-lg"><SecureAuthIcon className="w-5 h-5 text-indigo-400" /></div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl border border-yellow-500/20 shadow-lg hover:shadow-yellow-500/10 transition-all">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-400 text-xs uppercase font-bold tracking-wider">Pro Subscribers</p>
                                <p className="text-3xl font-bold text-yellow-400 mt-2">{proUsers}</p>
                                <p className="text-xs text-yellow-500/50 mt-1">Paying Customers</p>
                            </div>
                            <div className="p-2 bg-yellow-500/10 rounded-lg"><ChartBarIcon className="w-5 h-5 text-yellow-400" /></div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl border border-blue-500/20 shadow-lg hover:shadow-blue-500/10 transition-all">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-400 text-xs uppercase font-bold tracking-wider">Free Users</p>
                                <p className="text-3xl font-bold text-blue-400 mt-2">{freeUsers}</p>
                                <p className="text-xs text-blue-500/50 mt-1">Growth Potential</p>
                            </div>
                            <div className="p-2 bg-blue-500/10 rounded-lg"><SecureAuthIcon className="w-5 h-5 text-blue-400" /></div>
                        </div>
                    </div>
                </div>

                {/* Main Tabs */}
                <div className="flex border-b border-gray-700 mb-6 gap-6 overflow-x-auto">
                    <button onClick={() => setActiveTab('overview')} className={`pb-3 px-1 font-medium transition-colors whitespace-nowrap ${activeTab === 'overview' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-white'}`}>Overview</button>
                    <button onClick={() => setActiveTab('users')} className={`pb-3 px-1 font-medium transition-colors whitespace-nowrap ${activeTab === 'users' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-white'}`}>User Management</button>
                    <button onClick={() => setActiveTab('financials')} className={`pb-3 px-1 font-medium transition-colors whitespace-nowrap ${activeTab === 'financials' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-white'}`}>Financials</button>
                    <button onClick={() => setActiveTab('content')} className={`pb-3 px-1 font-medium transition-colors whitespace-nowrap ${activeTab === 'content' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-white'}`}>Site Content</button>
                    {/* NEW TABS */}
                    <button onClick={() => setActiveTab('api')} className={`pb-3 px-1 font-medium transition-colors whitespace-nowrap ${activeTab === 'api' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-white'}`}>API Configuration</button>
                    <button onClick={() => setActiveTab('plans')} className={`pb-3 px-1 font-medium transition-colors whitespace-nowrap ${activeTab === 'plans' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-white'}`}>Plans</button>
                </div>

                {/* API Tab */}
                {activeTab === 'api' && (
                    <div className="max-w-2xl mx-auto bg-gray-800 p-8 rounded-xl border border-gray-700">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-indigo-900/50 rounded-full text-indigo-400">
                                <SecureAuthIcon className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">API Configuration</h3>
                                <p className="text-sm text-gray-400">Manage external service credentials securely.</p>
                            </div>
                        </div>
                        
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-300 mb-2">Gemini API Key</label>
                            <div className="relative">
                                <input 
                                    type={keyVisibility ? "text" : "password"}
                                    value={newApiKey}
                                    onChange={(e) => setNewApiKey(e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none pr-24 font-mono"
                                    placeholder="AIza..."
                                />
                                <button 
                                    onClick={() => setKeyVisibility(!keyVisibility)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-indigo-400 hover:text-indigo-300 uppercase font-bold"
                                >
                                    {keyVisibility ? "Hide" : "Show"}
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Updating this key will instantly apply to all live users without redeployment.
                            </p>
                        </div>

                        <div className="flex justify-end gap-4">
                            <button 
                                onClick={() => setNewApiKey(config.apiConfig?.geminiApiKey || '')}
                                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                            >
                                Reset
                            </button>
                            <button 
                                onClick={handleSaveApiKey}
                                disabled={saving || !newApiKey}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-bold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {saving ? 'Applying...' : 'Save & Apply Key'}
                            </button>
                        </div>
                        
                        <div className="mt-8 p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                            <h4 className="text-yellow-400 font-bold text-sm mb-1">⚠️ Security Warning</h4>
                            <p className="text-yellow-200/70 text-xs leading-relaxed">
                                This key grants access to AI models and billing quotas. Do not share it. 
                                If a key is reported as leaked, generate a new one in Google AI Studio and update it here immediately.
                            </p>
                        </div>
                    </div>
                )}

                {/* Plans Tab */}
                {activeTab === 'plans' && config?.plans && (
                    <div className="space-y-8">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white">Subscription Plans</h3>
                            <button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md transition-all">Save Changes</button>
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                            {config.plans.map((plan, idx) => (
                                <div key={idx} className="bg-gray-800 p-6 rounded-xl border border-gray-700 relative">
                                    <div className="absolute top-4 right-4 text-xs font-bold text-gray-500 uppercase tracking-widest">{plan.id.toUpperCase()}</div>
                                    
                                    <div className="mb-4">
                                        <label className="text-xs text-gray-500">Plan Name</label>
                                        <input value={plan.name} onChange={(e) => updatePlan(idx, 'name', e.target.value)} className="text-xl font-bold bg-gray-900 border border-gray-600 rounded p-2 w-full text-white" />
                                    </div>
                                    
                                    <div className="flex gap-4 mb-4">
                                        <div className="flex-1">
                                             <label className="text-xs text-gray-500">Price</label>
                                            <input value={plan.price} onChange={(e) => updatePlan(idx, 'price', e.target.value)} className="bg-gray-900 border border-gray-600 p-2 rounded w-full text-white" />
                                        </div>
                                        <div className="flex-1">
                                             <label className="text-xs text-gray-500">Period</label>
                                            <input value={plan.period} onChange={(e) => updatePlan(idx, 'period', e.target.value)} className="bg-gray-900 border border-gray-600 p-2 rounded w-full text-white" />
                                        </div>
                                    </div>
                                    
                                    <div className="mb-4">
                                        <label className="text-xs text-gray-500">Description</label>
                                        <textarea value={plan.description} onChange={(e) => updatePlan(idx, 'description', e.target.value)} className="w-full bg-gray-900 border border-gray-600 p-2 rounded text-sm text-white" rows={2} />
                                    </div>
                                    
                                    <h4 className="font-bold text-sm text-indigo-400 mb-2 mt-4">Features List</h4>
                                    <ul className="space-y-2 mb-4">
                                        {plan.features.map((feat, fIdx) => (
                                            <li key={fIdx} className="flex gap-2">
                                                <input value={feat} onChange={(e) => updatePlanFeature(idx, fIdx, e.target.value)} className="flex-1 bg-gray-700 border border-gray-600 p-2 rounded text-sm text-white" />
                                                <button onClick={() => removePlanFeature(idx, fIdx)} className="text-red-400 hover:bg-red-900/30 p-2 rounded"><TrashIcon className="w-4 h-4"/></button>
                                            </li>
                                        ))}
                                    </ul>
                                    <button onClick={() => addFeatureToPlan(idx)} className="mt-2 text-xs text-indigo-400 hover:text-white flex items-center gap-1"><PlusIcon className="w-3 h-3"/> Add Feature</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Overview Tab (Existing) */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* ... existing overview content ... */}
                         <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                            <h3 className="text-lg font-bold mb-4 text-white">Recent Signups</h3>
                            <ul className="space-y-3">
                                {users.slice(0, 5).map((u, i) => (
                                    <li key={i} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${u.role === 'seller' ? 'bg-indigo-600' : 'bg-purple-600'}`}>
                                                {(u.name || '?').charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{u.name || 'Unknown User'}</p>
                                                <p className="text-xs text-gray-400">{u.email}</p>
                                            </div>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full ${u.plan === 'pro' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-600 text-gray-300'}`}>
                                            {(u.plan || 'free').toUpperCase()}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                         <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                            <h3 className="text-lg font-bold mb-4 text-white">Recent Transactions</h3>
                            <ul className="space-y-3">
                                {transactions.slice(0, 5).map((tx, i) => (
                                    <li key={i} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                                        <div>
                                            <p className="font-medium text-sm text-green-400">+{formatCurrency(tx.amount)}</p>
                                            <p className="text-xs text-gray-400">{tx.userName}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-300">{formatDate(tx.date)}</p>
                                            <p className="text-xs text-gray-500">{tx.paymentMethod}</p>
                                        </div>
                                    </li>
                                ))}
                                {transactions.length === 0 && <p className="text-gray-500 italic text-sm">No transactions yet.</p>}
                            </ul>
                        </div>
                    </div>
                )}

                {/* Users Tab (Existing) */}
                {activeTab === 'users' && (
                    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800">
                            <h3 className="font-bold text-white">All Users ({users.length})</h3>
                            <button onClick={copyEmails} className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded transition-colors">
                                Copy All Emails
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-gray-400">
                                <thead className="bg-gray-900 text-gray-200 uppercase font-medium text-xs">
                                    <tr>
                                        <th className="px-6 py-3">Name / Email</th>
                                        <th className="px-6 py-3">Role</th>
                                        <th className="px-6 py-3">Plan</th>
                                        <th className="px-6 py-3">Usage</th>
                                        <th className="px-6 py-3">Categories</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {users.map((user, i) => (
                                        <tr key={i} className="hover:bg-gray-700/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-white">{user.name || 'Unknown'}</p>
                                                <p className="text-xs text-gray-500">{user.email}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${user.role === 'seller' ? 'bg-indigo-900 text-indigo-200' : 'bg-purple-900 text-purple-200'}`}>
                                                    {(user.role || 'unknown').toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${user.plan === 'pro' ? 'bg-yellow-900 text-yellow-200' : 'bg-gray-700 text-gray-300'}`}>
                                                    {(user.plan || 'free').toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {user.usage?.aiScans || 0} Scans
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {user.categories?.slice(0,3).map((c, ci) => (
                                                        <span key={ci} className="text-xs bg-gray-700 px-1 rounded">{c}</span>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Financials Tab (Existing) */}
                {activeTab === 'financials' && (
                    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                         <div className="p-6 border-b border-gray-700 bg-gray-800">
                            <h3 className="text-xl font-bold text-white">Transaction History</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-gray-400">
                                <thead className="bg-gray-900 text-gray-200 uppercase font-medium text-xs">
                                    <tr>
                                        <th className="px-6 py-3">Date</th>
                                        <th className="px-6 py-3">User</th>
                                        <th className="px-6 py-3">Amount</th>
                                        <th className="px-6 py-3">Plan</th>
                                        <th className="px-6 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {transactions.map((tx, i) => (
                                        <tr key={i} className="hover:bg-gray-700/50 transition-colors">
                                            <td className="px-6 py-4">{formatDate(tx.date)}</td>
                                            <td className="px-6 py-4 font-medium text-white">{tx.userName}</td>
                                            <td className="px-6 py-4 text-green-400 font-bold">{formatCurrency(tx.amount)}</td>
                                            <td className="px-6 py-4 uppercase">{tx.plan}</td>
                                            <td className="px-6 py-4">
                                                <span className="bg-green-900 text-green-200 px-2 py-1 rounded text-xs font-bold">SUCCESS</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Content Management Tab */}
                {activeTab === 'content' && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <nav className="bg-gray-800 rounded-lg shadow p-4 h-fit">
                            <ul className="space-y-2">
                                {['hero', 'features', 'testimonials', 'faq', 'style', 'footer'].map(tab => (
                                    <li key={tab}>
                                        <button 
                                            onClick={() => setContentTab(tab as any)}
                                            className={`w-full text-left px-4 py-2 rounded-lg font-medium transition-colors capitalize ${contentTab === tab ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
                                        >
                                            {tab}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                            <button 
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full mt-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-all disabled:opacity-50 text-sm"
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </nav>
                        
                        <div className="md:col-span-3 bg-gray-800 rounded-lg p-6 border border-gray-700">
                             {contentTab === 'hero' && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-white">Hero Section</h3>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Title</label>
                                        <input value={config.hero.title} onChange={e => updateConfig('hero', { ...config.hero, title: e.target.value })} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Subtitle</label>
                                        <textarea value={config.hero.subtitle} onChange={e => updateConfig('hero', { ...config.hero, subtitle: e.target.value })} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none" rows={3} />
                                    </div>
                                    <div>
                                         <label className="block text-sm text-gray-400 mb-1">Image URL</label>
                                         <input value={config.hero.imageUrl} onChange={e => updateConfig('hero', { ...config.hero, imageUrl: e.target.value })} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                                    </div>
                                </div>
                             )}

                             {contentTab === 'features' && (
                                 <div className="space-y-6">
                                     <div className="flex justify-between items-center">
                                        <h3 className="text-lg font-bold text-white">Features</h3>
                                        <button onClick={() => addArrayItem('features')} className="flex items-center gap-2 text-sm bg-indigo-600 px-3 py-1 rounded hover:bg-indigo-700"><PlusIcon className="w-4 h-4"/> Add Feature</button>
                                     </div>
                                     {config.features.map((feat, idx) => (
                                         <div key={idx} className="bg-gray-700 p-4 rounded border border-gray-600 relative">
                                             <button onClick={() => removeArrayItem('features', idx)} className="absolute top-2 right-2 text-red-400 hover:text-red-300"><TrashIcon className="w-4 h-4" /></button>
                                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                 <div>
                                                     <label className="text-xs text-gray-400">Title</label>
                                                     <input value={feat.title} onChange={e => updateArrayItem('features', idx, 'title', e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-sm text-white" />
                                                 </div>
                                                 <div>
                                                     <label className="text-xs text-gray-400">Icon</label>
                                                     <select value={feat.iconName} onChange={e => updateArrayItem('features', idx, 'iconName', e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-sm text-white">
                                                         {iconOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                     </select>
                                                 </div>
                                                 <div className="md:col-span-2">
                                                     <label className="text-xs text-gray-400">Description</label>
                                                     <input value={feat.description} onChange={e => updateArrayItem('features', idx, 'description', e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-sm text-white" />
                                                 </div>
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                             )}

                             {contentTab === 'testimonials' && (
                                 <div className="space-y-6">
                                     <div className="flex justify-between items-center">
                                        <h3 className="text-lg font-bold text-white">Testimonials</h3>
                                        <button onClick={() => addArrayItem('testimonials')} className="flex items-center gap-2 text-sm bg-indigo-600 px-3 py-1 rounded hover:bg-indigo-700"><PlusIcon className="w-4 h-4"/> Add Testimonial</button>
                                     </div>
                                     {config.testimonials.map((t, idx) => (
                                         <div key={idx} className="bg-gray-700 p-4 rounded border border-gray-600 relative">
                                             <button onClick={() => removeArrayItem('testimonials', idx)} className="absolute top-2 right-2 text-red-400 hover:text-red-300"><TrashIcon className="w-4 h-4" /></button>
                                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                 <div>
                                                     <label className="text-xs text-gray-400">Name</label>
                                                     <input value={t.name} onChange={e => updateArrayItem('testimonials', idx, 'name', e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-sm text-white" />
                                                 </div>
                                                 <div>
                                                     <label className="text-xs text-gray-400">Role</label>
                                                     <input value={t.role} onChange={e => updateArrayItem('testimonials', idx, 'role', e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-sm text-white" />
                                                 </div>
                                                 <div className="md:col-span-2">
                                                     <label className="text-xs text-gray-400">Quote</label>
                                                     <textarea value={t.quote} onChange={e => updateArrayItem('testimonials', idx, 'quote', e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-sm text-white" rows={2} />
                                                 </div>
                                                 <div className="md:col-span-2">
                                                     <label className="text-xs text-gray-400">Image URL</label>
                                                     <input value={t.image} onChange={e => updateArrayItem('testimonials', idx, 'image', e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-sm text-white" />
                                                 </div>
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                             )}

                             {contentTab === 'faq' && (
                                 <div className="space-y-6">
                                     <div className="flex justify-between items-center">
                                        <h3 className="text-lg font-bold text-white">FAQs</h3>
                                        <button onClick={() => addArrayItem('faqs')} className="flex items-center gap-2 text-sm bg-indigo-600 px-3 py-1 rounded hover:bg-indigo-700"><PlusIcon className="w-4 h-4"/> Add FAQ</button>
                                     </div>
                                     {config.faqs.map((f, idx) => (
                                         <div key={idx} className="bg-gray-700 p-4 rounded border border-gray-600 relative">
                                             <button onClick={() => removeArrayItem('faqs', idx)} className="absolute top-2 right-2 text-red-400 hover:text-red-300"><TrashIcon className="w-4 h-4" /></button>
                                             <div className="space-y-3">
                                                 <div>
                                                     <label className="text-xs text-gray-400">Question</label>
                                                     <input value={f.question} onChange={e => updateArrayItem('faqs', idx, 'question', e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-sm text-white" />
                                                 </div>
                                                 <div>
                                                     <label className="text-xs text-gray-400">Answer</label>
                                                     <textarea value={f.answer} onChange={e => updateArrayItem('faqs', idx, 'answer', e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-sm text-white" rows={2} />
                                                 </div>
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                             )}

                             {contentTab === 'style' && (
                                 <div className="space-y-6">
                                     <h3 className="text-lg font-bold text-white">Theme Styling</h3>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                         <div>
                                             <label className="block text-sm text-gray-400 mb-1">Primary Color</label>
                                             <div className="flex gap-2">
                                                <input type="color" value={config.style?.primaryColor || '#4F46E5'} onChange={e => updateStyle('primaryColor', e.target.value)} className="h-10 w-14 cursor-pointer rounded bg-transparent border-0" />
                                                <input type="text" value={config.style?.primaryColor || '#4F46E5'} onChange={e => updateStyle('primaryColor', e.target.value)} className="flex-1 bg-gray-700 border border-gray-600 rounded p-2 text-white text-sm" />
                                             </div>
                                         </div>
                                         <div>
                                             <label className="block text-sm text-gray-400 mb-1">Text Color (Light Mode)</label>
                                              <div className="flex gap-2">
                                                <input type="color" value={config.style?.textColorLight || '#111827'} onChange={e => updateStyle('textColorLight', e.target.value)} className="h-10 w-14 cursor-pointer rounded bg-transparent border-0" />
                                                <input type="text" value={config.style?.textColorLight || '#111827'} onChange={e => updateStyle('textColorLight', e.target.value)} className="flex-1 bg-gray-700 border border-gray-600 rounded p-2 text-white text-sm" />
                                             </div>
                                         </div>
                                         <div>
                                             <label className="block text-sm text-gray-400 mb-1">Text Color (Dark Mode)</label>
                                              <div className="flex gap-2">
                                                <input type="color" value={config.style?.textColorDark || '#F9FAFB'} onChange={e => updateStyle('textColorDark', e.target.value)} className="h-10 w-14 cursor-pointer rounded bg-transparent border-0" />
                                                <input type="text" value={config.style?.textColorDark || '#F9FAFB'} onChange={e => updateStyle('textColorDark', e.target.value)} className="flex-1 bg-gray-700 border border-gray-600 rounded p-2 text-white text-sm" />
                                             </div>
                                         </div>
                                     </div>
                                     <p className="text-sm text-gray-500 italic">Note: These colors will apply to the landing page after saving.</p>
                                 </div>
                             )}
                             
                             {contentTab === 'footer' && (
                                <div className="space-y-8">
                                    <div>
                                        <h3 className="text-lg font-bold text-white mb-4">Social Media Links</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm text-gray-400 mb-1">Twitter / X</label>
                                                <input value={config.footer?.socialLinks?.twitter || ''} onChange={e => updateSocialLink('twitter', e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-gray-400 mb-1">LinkedIn</label>
                                                <input value={config.footer?.socialLinks?.linkedin || ''} onChange={e => updateSocialLink('linkedin', e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-gray-400 mb-1">YouTube</label>
                                                <input value={config.footer?.socialLinks?.youtube || ''} onChange={e => updateSocialLink('youtube', e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-gray-400 mb-1">Facebook</label>
                                                <input value={config.footer?.socialLinks?.facebook || ''} onChange={e => updateSocialLink('facebook', e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-gray-400 mb-1">Instagram</label>
                                                <input value={config.footer?.socialLinks?.instagram || ''} onChange={e => updateSocialLink('instagram', e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-lg font-bold text-white">Footer Links</h3>
                                            <button onClick={addFooterLink} className="flex items-center gap-2 text-sm bg-indigo-600 px-3 py-1 rounded hover:bg-indigo-700"><PlusIcon className="w-4 h-4"/> Add Link</button>
                                        </div>
                                        <div className="space-y-3">
                                            {config.footer?.links?.map((link, idx) => (
                                                <div key={idx} className="flex items-center gap-3 bg-gray-700 p-3 rounded">
                                                    <input 
                                                        value={link.label} 
                                                        onChange={e => updateFooterLink(idx, 'label', e.target.value)} 
                                                        placeholder="Label (e.g. Privacy)" 
                                                        className="flex-1 bg-gray-800 border border-gray-600 rounded p-2 text-sm text-white" 
                                                    />
                                                    <input 
                                                        value={link.url} 
                                                        onChange={e => updateFooterLink(idx, 'url', e.target.value)} 
                                                        placeholder="URL" 
                                                        className="flex-1 bg-gray-800 border border-gray-600 rounded p-2 text-sm text-white" 
                                                    />
                                                    <button onClick={() => removeFooterLink(idx)} className="text-red-400 hover:text-red-300"><TrashIcon className="w-5 h-5" /></button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                             )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
