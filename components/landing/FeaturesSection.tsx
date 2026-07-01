
import React from 'react';
import { ChatIcon, ExpiryAlertIcon, SmartMatchIcon, SecureAuthIcon, CloudSyncIcon, InventoryIcon, CameraIcon, DocumentTextIcon, ChartBarIcon } from '../icons';
import { SiteFeature } from '../../types';

interface FeaturesSectionProps {
    features?: SiteFeature[];
}

const IconMap: Record<string, React.ReactNode> = {
    'SmartMatch': <SmartMatchIcon className="w-8 h-8" />,
    'Chat': <ChatIcon className="w-8 h-8" />,
    'Inventory': <InventoryIcon className="w-8 h-8" />,
    'Expiry': <ExpiryAlertIcon className="w-8 h-8" />,
    'Secure': <SecureAuthIcon className="w-8 h-8" />,
    'Cloud': <CloudSyncIcon className="w-8 h-8" />,
    'Camera': <CameraIcon className="w-8 h-8" />,
    'Invoice': <DocumentTextIcon className="w-8 h-8" />,
    'Analytics': <ChartBarIcon className="w-8 h-8" />
};

const FeaturesSection: React.FC<FeaturesSectionProps> = ({ features }) => {
    const displayFeatures = features || [];

    return (
        <section id="features" className="py-24 bg-gray-50 dark:bg-gray-900 relative overflow-hidden">
             {/* Decorative Background Blobs */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full filter blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full filter blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

            <div className="container mx-auto px-4 sm:px-6 relative z-10">
                <div className="max-w-3xl mx-auto text-center pb-20" data-aos="fade-up">
                    <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                            Power-Up Your Business
                        </span>
                    </h2>
                    <p className="text-xl text-gray-600 dark:text-gray-300 mt-6">
                        Everything you need to run a smarter, faster, and more profitable store.
                    </p>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {displayFeatures.map((feature, index) => (
                        <div 
                            key={index} 
                            className="group p-8 bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 transition-all duration-500 hover:-translate-y-3 hover:scale-105 hover:shadow-[0_10px_30px_rgba(79,70,229,0.2)] hover:border-indigo-500/50"
                            data-aos="fade-up" 
                            data-aos-delay={100 * index}
                        >
                            <div className="flex items-center mb-6">
                                <div className="flex-shrink-0 flex items-center justify-center h-16 w-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-500">
                                    {IconMap[feature.iconName] || IconMap['Inventory']}
                                </div>
                                <h4 className="text-xl font-bold ml-5 text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{feature.title}</h4>
                            </div>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg">
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
