
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
            <div className="container mx-auto px-4 sm:px-6 py-8">
                <div className="md:flex md:items-center md:justify-between">
                    {/* Social links */}
                    <ul className="flex mb-4 md:order-1 md:ml-4 md:mb-0">
                        {config?.socialLinks?.twitter && (
                        <li>
                            <a href={config.socialLinks.twitter} className="flex justify-center items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white bg-white dark:bg-gray-800 hover:bg-white-100 dark:hover:bg-gray-700 rounded-full shadow transition duration-150 ease-in-out" aria-label="Twitter">
                                <TwitterIcon className="w-8 h-8 p-2"/>
                            </a>
                        </li>
                        )}
                        <li className="ml-4">
                            <a href="https://www.linkedin.com/in/mohammedjaid" target="_blank" rel="noopener noreferrer" className="flex justify-center items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white bg-white dark:bg-gray-800 hover:bg-white-100 dark:hover:bg-gray-700 rounded-full shadow transition duration-150 ease-in-out" aria-label="LinkedIn">
                                <LinkedinIcon className="w-8 h-8 p-1"/>
                            </a>
                        </li>
                        <li className="ml-4">
                            <a href="https://github.com/zaid753" target="_blank" rel="noopener noreferrer" className="flex justify-center items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white bg-white dark:bg-gray-800 hover:bg-white-100 dark:hover:bg-gray-700 rounded-full shadow transition duration-150 ease-in-out" aria-label="GitHub">
                                <GithubIcon className="w-8 h-8 p-2"/>
                            </a>
                        </li>
                    </ul>

                    {/* Copyright */}
                    <div className="text-sm text-gray-600 dark:text-gray-400 mr-4">
                        &copy; {new Date().getFullYear()} Stock Pilot by SoundSync. All rights reserved.
                    </div>
                </div>
                 <div className="flex flex-col md:flex-row justify-between items-center mt-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex gap-4">
                        {config?.links?.map((link, idx) => (
                            <a key={idx} href={link.url} className="hover:underline">{link.label}</a>
                        ))}
                    </div>
                    <button 
                        onClick={onAdminClick} 
                        className="mt-4 md:mt-0 flex items-center gap-1 text-xs opacity-50 hover:opacity-100 transition-opacity"
                    >
                        <LockClosedIcon className="w-3 h-3" />
                        Admin Panel
                    </button>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
