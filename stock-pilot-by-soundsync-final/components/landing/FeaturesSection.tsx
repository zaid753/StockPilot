
import React from 'react';
import useScrollAnimation from '../../hooks/useScrollAnimation';
import { ChatIcon, ExpiryAlertIcon, SmartMatchIcon, SecureAuthIcon, CloudSyncIcon, InventoryIcon } from '../icons';

const features = [
    {
        icon: <SmartMatchIcon className="w-8 h-8 text-indigo-500" />,
        title: 'Smart Category Matching',
        description: 'We automatically connect sellers with the right suppliers based on matching product categories, saving you time and effort.',
    },
    {
        icon: <ChatIcon className="w-8 h-8 text-indigo-500" />,
        title: 'Real-Time Chat',
        description: 'Communicate instantly with your matched partners through our integrated, real-time chat system with delivery status updates.',
    },
    {
        icon: <InventoryIcon className="w-8 h-8 text-indigo-500" />,
        title: 'Voice-Powered Management',
        description: 'Manage your inventory hands-free. Add items, update quantities, and ask questions using simple voice commands.',
    },
    {
        icon: <ExpiryAlertIcon className="w-8 h-8 text-indigo-500" />,
        title: 'Automated Expiry Alerts',
        description: 'Our system automatically tracks expiry dates and sends you timely notifications, helping you reduce waste and manage stock.',
    },
    {
        icon: <SecureAuthIcon className="w-8 h-8 text-indigo-500" />,
        title: 'Secure Authentication',
        description: 'Sign up and log in securely with either your email and password or your Google account for quick and easy access.',
    },
    {
        icon: <CloudSyncIcon className="w-8 h-8 text-indigo-500" />,
        title: 'Cloud-Based Data Sync',
        description: 'Your inventory data is stored securely in the cloud and synchronized in real-time across all your devices.',
    },
];

const FeaturesSection: React.FC = () => {
    const sectionRef = useScrollAnimation<HTMLDivElement>();

    return (
        <section id="features" ref={sectionRef} className="py-12 md:py-20 bg-gray-50 dark:bg-gray-800/50">
            <div className="container mx-auto px-4 sm:px-6">
                <div className="max-w-3xl mx-auto text-center pb-12 md:pb-16">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white">Everything You Need to Pilot Your Stock</h2>
                    <p className="text-lg text-gray-600 dark:text-gray-300 mt-4">
                        From intelligent matchmaking to automated alerts, Stock Pilot provides the tools to streamline your business operations.
                    </p>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <div key={index} className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
                            <div className="flex items-center mb-4">
                                <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50">
                                    {feature.icon}
                                </div>
                                <h4 className="text-xl font-bold ml-4 text-gray-900 dark:text-white">{feature.title}</h4>
                            </div>
                            <p className="text-gray-600 dark:text-gray-300">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeaturesSection;
