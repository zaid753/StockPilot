
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LockClosedIcon } from '../icons';

interface AdminLoginProps {
    onLogin: () => void;
    onBack: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin, onBack }) => {
    const [key, setKey] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (key === '123456' || key === 'Sound@sync') {
            onLogin();
        } else {
            setError('Invalid Security Key');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="bg-indigo-100 dark:bg-indigo-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <LockClosedIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Access</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Restricted Area. Authorized Personnel Only.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Security Key</label>
                        <input 
                            type="password" 
                            value={key}
                            onChange={(e) => setKey(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            placeholder="Enter Key"
                            autoFocus
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    
                    <button 
                        type="submit"
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors"
                    >
                        Access Panel
                    </button>
                    <button 
                        type="button"
                        onClick={() => navigate('/')}
                        className="w-full py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-medium"
                    >
                        Back to Site
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;
