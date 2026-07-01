import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
    LogoutIcon, BellIcon, PresentationChartLineIcon, 
    InventoryIcon, CameraIcon, ChatIcon, ReceiptIcon, UserIcon, SparklesIcon
} from './icons';

const SellerLayout: React.FC = () => {
    const { userProfile, logOut } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logOut();
        navigate('/');
    };

    const navItems = [
        { path: '/seller', label: 'Dashboard', icon: <PresentationChartLineIcon className="w-5 h-5" />, exact: true },
        { path: '/seller/ai', label: 'AI Assistant', icon: <SparklesIcon className="w-5 h-5" /> },
        { path: '/seller/inventory', label: 'Inventory', icon: <InventoryIcon className="w-5 h-5" /> },
        { path: '/seller/sales', label: 'Sales', icon: <ReceiptIcon className="w-5 h-5" /> },
        { path: '/seller/shelf-doctor', label: 'Shelf Doctor', icon: <CameraIcon className="w-5 h-5" /> },
        { path: '/seller/network', label: 'Network', icon: <ChatIcon className="w-5 h-5" /> },
        { path: '/seller/profile', label: 'Profile', icon: <UserIcon className="w-5 h-5" /> },
    ];

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col hidden md:flex">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        Stock Pilot
                        <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-700 bg-indigo-100 dark:bg-indigo-900 dark:text-indigo-300 px-2 py-0.5 rounded-full">Seller</span>
                    </h1>
                </div>
                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.exact}
                            className={({ isActive }) => 
                                `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                                    isActive 
                                    ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300' 
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                                }`
                            }
                        >
                            {item.icon}
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <button 
                        onClick={() => navigate('/seller/profile')}
                        className="flex items-center justify-between w-full px-2 mb-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 p-2 rounded-lg transition-colors text-left"
                    >
                        <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{userProfile?.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{userProfile?.businessName}</p>
                        </div>
                    </button>
                    <button 
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 font-medium hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                        <LogoutIcon className="w-5 h-5" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                {/* Mobile Header */}
                <header className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Stock Pilot</h1>
                    <button onClick={handleLogout} className="p-2 text-gray-500">
                        <LogoutIcon className="w-6 h-6" />
                    </button>
                </header>
                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 relative">
                    <Outlet />
                </div>
                
                {/* Mobile Bottom Nav */}
                <nav className="md:hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-around p-2">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.exact}
                            className={({ isActive }) => 
                                `flex flex-col items-center p-2 rounded-lg ${
                                    isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'
                                }`
                            }
                        >
                            {item.icon}
                            <span className="text-[10px] mt-1">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>
            </main>
        </div>
    );
};

export default SellerLayout;
