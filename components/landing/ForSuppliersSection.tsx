import React from 'react';

const ForSuppliersSection: React.FC = () => {
    return (
        <section id="for-suppliers" className="py-12 md:py-20 overflow-hidden">
            <div className="container mx-auto px-4 sm:px-6">
                <div className="md:grid md:grid-cols-12 md:gap-6 items-center">
                     <div className="max-w-xl md:max-w-none md:w-full mx-auto md:col-span-5 lg:col-span-6 mb-8 md:mb-0" data-aos="fade-right">
                        <div className="relative">
                           <div className="bg-gray-800 rounded-lg p-4 shadow-xl border border-gray-700">
                                <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">Supplier Chat List</p>
                                <img src="/supplier_dashboard.png" alt="Supplier Dashboard" className="rounded"/>
                           </div>
                        </div>
                    </div>
                    <div className="max-w-xl md:max-w-none md:w-full mx-auto md:col-span-7 lg:col-span-6" data-aos="fade-left">
                        <div className="md:pl-4 lg:pl-12 xl:pl-16">
                            <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3">For Suppliers</h3>
                            <p className="text-xl text-gray-600 dark:text-gray-300 mb-4">Connect directly with a network of sellers actively looking for your products. Expand your reach effortlessly.</p>
                            <ul className="text-lg text-gray-600 dark:text-gray-300 -mb-2">
                                <li className="flex items-center mb-2">
                                    <svg className="w-3 h-3 fill-current text-green-500 mr-2 shrink-0" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg"><path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" /></svg>
                                    <span>Get discovered by sellers based on your product categories.</span>
                                </li>
                                <li className="flex items-center mb-2">
                                    <svg className="w-3 h-3 fill-current text-green-500 mr-2 shrink-0" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg"><path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" /></svg>
                                    <span>Receive inbound leads directly in your chat dashboard.</span>
                                </li>
                                <li className="flex items-center">
                                    <svg className="w-3 h-3 fill-current text-green-500 mr-2 shrink-0" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg"><path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" /></svg>
                                    <span>Build and manage all your seller relationships in one place.</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ForSuppliersSection;