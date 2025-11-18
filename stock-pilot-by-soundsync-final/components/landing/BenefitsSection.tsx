
import React from 'react';
import useScrollAnimation from '../../hooks/useScrollAnimation';

const benefits = [
    {
        title: 'Reduce Product Waste',
        description: 'With automatic expiry detection and timely alerts, you can sell or use stock before it goes to waste, saving you money.'
    },
    {
        title: 'Save Time on Sourcing',
        description: 'Our smart matching system connects you directly with relevant partners, so you spend less time searching and more time doing business.'
    },
    {
        title: 'Streamline Communication',
        description: 'No more switching between apps. All your business conversations happen in one place with our integrated real-time chat.'
    },
    {
        title: 'Manage Stock Effortlessly',
        description: 'Whether you use your voice or our modern dashboard, tracking your items, quantities, and values has never been easier.'
    },
];

const BenefitsSection: React.FC = () => {
    const sectionRef = useScrollAnimation<HTMLDivElement>();
    return (
        <section id="benefits" ref={sectionRef} className="py-12 md:py-20">
            <div className="container mx-auto px-4 sm:px-6">
                <div className="max-w-3xl mx-auto text-center pb-12 md:pb-16">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white">The Ultimate Advantage for Your Business</h2>
                    <p className="text-lg text-gray-600 dark:text-gray-300 mt-4">
                        Stock Pilot isn't just an inventory tool; it's a platform designed to make your business more efficient and profitable.
                    </p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {benefits.map((benefit, index) => (
                        <div key={index} className="flex flex-col p-6 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
                            <h4 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{benefit.title}</h4>
                            <p className="text-gray-600 dark:text-gray-300 flex-grow">{benefit.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default BenefitsSection;
