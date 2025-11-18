
import React from 'react';
import { TwitterIcon, LinkedinIcon, GithubIcon } from '../icons';

const Footer: React.FC = () => {
    return (
        <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <div className="container mx-auto px-4 sm:px-6 py-8">
                <div className="md:flex md:items-center md:justify-between">
                    {/* Social links */}
                    <ul className="flex mb-4 md:order-1 md:ml-4 md:mb-0">
                        <li>
                            <a href="#" className="flex justify-center items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white bg-white dark:bg-gray-800 hover:bg-white-100 dark:hover:bg-gray-700 rounded-full shadow transition duration-150 ease-in-out" aria-label="Twitter">
                                <TwitterIcon className="w-8 h-8 p-2"/>
                            </a>
                        </li>
                        <li className="ml-4">
                            <a href="#" className="flex justify-center items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white bg-white dark:bg-gray-800 hover:bg-white-100 dark:hover:bg-gray-700 rounded-full shadow transition duration-150 ease-in-out" aria-label="LinkedIn">
                                <LinkedinIcon className="w-8 h-8 p-1"/>
                            </a>
                        </li>
                         <li className="ml-4">
                            <a href="#" className="flex justify-center items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white bg-white dark:bg-gray-800 hover:bg-white-100 dark:hover:bg-gray-700 rounded-full shadow transition duration-150 ease-in-out" aria-label="Github">
                                <GithubIcon className="w-8 h-8 p-1"/>
                            </a>
                        </li>
                    </ul>

                    {/* Copyright */}
                    <div className="text-sm text-gray-600 dark:text-gray-400 mr-4">
                        &copy; {new Date().getFullYear()} Stock Pilot by SoundSync. All rights reserved.
                    </div>
                </div>
                 <div className="text-sm text-gray-500 dark:text-gray-400 mt-4 text-center md:text-left">
                    <a href="#" className="hover:underline">Privacy Policy</a> &middot; <a href="#" className="hover:underline">Terms of Service</a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
