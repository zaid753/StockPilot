
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { EyeIcon, EyeSlashIcon, GoogleIcon } from './icons';

interface LoginComponentProps {
    isOpen: boolean;
    onClose: () => void;
}

const LoginComponent: React.FC<LoginComponentProps> = ({ isOpen, onClose }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [error, setError] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [role, setRole] = useState<'seller' | 'supplier'>('seller');
    const { signUp, logIn, signInWithGoogle } = useAuth();

    if (!isOpen) return null;

    const handleGoogleSignIn = async () => {
        try {
            await signInWithGoogle();
            // On successful login, the App component will handle navigation, so we can close the modal.
            onClose(); 
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            if (isLogin) {
                await logIn(email, password);
            } else {
                await signUp(email, password, role);
            }
             // On successful login/signup, close the modal.
            onClose();
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div 
                className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg relative"
                onClick={e => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-3xl font-light">&times;</button>

                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Stock Pilot</h1>
                    <p className="text-gray-500 dark:text-gray-400">by SoundSync</p>
                </div>
                
                <button
                    onClick={handleGoogleSignIn}
                    type="button"
                    className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                    <GoogleIcon className="w-5 h-5 mr-2" />
                    Continue with Google
                </button>

                <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                    <span className="flex-shrink mx-4 text-gray-400 dark:text-gray-500 text-sm">OR</span>
                    <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                </div>

                <p className="text-center text-gray-500 dark:text-gray-400">{isLogin ? 'Sign in with your email' : 'Sign up with email'}</p>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email-auth" className="text-sm font-medium text-gray-600 dark:text-gray-300">Email</label>
                        <input
                            id="email-auth"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-3 py-2 mt-1 text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="password-auth"className="text-sm font-medium text-gray-600 dark:text-gray-300">Password</label>
                        <div className="relative">
                            <input
                                id="password-auth"
                                type={passwordVisible ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-3 py-2 mt-1 text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                             <button 
                                type="button" 
                                onClick={() => setPasswordVisible(!passwordVisible)}
                                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                aria-label={passwordVisible ? 'Hide password' : 'Show password'}
                            >
                                {passwordVisible ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                    {!isLogin && (
                        <div>
                            <label className="text-sm font-medium text-gray-600 dark:text-gray-300">I am a:</label>
                            <div className="flex items-center mt-2 space-x-6">
                                <label className="flex items-center cursor-pointer">
                                    <input type="radio" name="role" value="seller" checked={role === 'seller'} onChange={() => setRole('seller')} className="w-4 h-4 text-indigo-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-indigo-500" />
                                    <span className="ml-2 text-gray-900 dark:text-white">Seller</span>
                                </label>
                                <label className="flex items-center cursor-pointer">
                                    <input type="radio" name="role" value="supplier" checked={role === 'supplier'} onChange={() => setRole('supplier')} className="w-4 h-4 text-indigo-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-indigo-500" />
                                    <span className="ml-2 text-gray-900 dark:text-white">Supplier</span>
                                </label>
                            </div>
                        </div>
                    )}
                    {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
                    <button type="submit" className="w-full py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-800 focus:ring-indigo-500 transition duration-150">
                        {isLogin ? 'Log In' : 'Sign Up'}
                    </button>
                </form>
                <div className="text-center">
                    <button onClick={() => setIsLogin(!isLogin)} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                        {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Log In'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginComponent;
