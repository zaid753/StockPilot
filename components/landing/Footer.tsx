
import React from 'react';
import { TwitterIcon, LinkedinIcon, LockClosedIcon, GithubIcon } from '../icons';
import { SiteConfig } from '../../types';

interface FooterProps {
    onAdminClick?: () => void;
    config?: SiteConfig['footer'];
}

const Footer: React.FC<FooterProps> = ({ onAdminClick, config }) => {
    return (
        <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <div className="container mx-auto px-4 sm:px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    <div className="col-span-1 md:col-span-2">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Stock Pilot</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm">
                            The intelligent inventory management and supply chain platform powered by AI. Designed by SoundSync.
                        </p>
                        <ul className="flex">
                            {config?.socialLinks?.twitter && (
                            <li>
                                <a href={config.socialLinks.twitter} className="flex justify-center items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full shadow transition duration-150 ease-in-out" aria-label="Twitter">
                                    <TwitterIcon className="w-8 h-8 p-2"/>
                                </a>
                            </li>
                            )}
                            <li className={config?.socialLinks?.twitter ? "ml-4" : ""}>
                                <a href="https://www.linkedin.com/in/mohammedjaid" target="_blank" rel="noopener noreferrer" className="flex justify-center items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full shadow transition duration-150 ease-in-out" aria-label="LinkedIn">
                                    <LinkedinIcon className="w-8 h-8 p-1"/>
                                </a>
                            </li>
                            <li className="ml-4">
                                <a href="https://github.com/zaid753" target="_blank" rel="noopener noreferrer" className="flex justify-center items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full shadow transition duration-150 ease-in-out" aria-label="GitHub">
                                    <GithubIcon className="w-8 h-8 p-2"/>
                                </a>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-gray-900 dark:text-white font-semibold mb-4">Product</h4>
                        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                            <li><a href="#" className="hover:text-indigo-500 transition-colors">Features</a></li>
                            <li><a href="#" className="hover:text-indigo-500 transition-colors">Pricing</a></li>
                            <li><a href="#" className="hover:text-indigo-500 transition-colors">Use Cases</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-gray-900 dark:text-white font-semibold mb-4">Company</h4>
                        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                            <li><a href="#" className="hover:text-indigo-500 transition-colors">About Us</a></li>
                            <li><a href="#" className="hover:text-indigo-500 transition-colors">Contact</a></li>
                            <li><a href="#" className="hover:text-indigo-500 transition-colors">Privacy Policy</a></li>
                            <li><a href="#" className="hover:text-indigo-500 transition-colors">Terms of Service</a></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-gray-200 dark:border-gray-700 flex flex-col md:flex-row justify-between items-center">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        &copy; {new Date().getFullYear()} Stock Pilot by SoundSync. All rights reserved.
                    </div>
                    <div className="flex items-center gap-4 mt-4 md:mt-0">
                        <button 
                            onClick={onAdminClick} 
                            className="flex items-center gap-1 text-xs text-gray-500 opacity-50 hover:opacity-100 transition-opacity"
                        >
                            <LockClosedIcon className="w-3 h-3" />
                            Admin Panel
                        </button>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
