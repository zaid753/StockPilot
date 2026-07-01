
import React, { useEffect, useState } from 'react';

const StatsSection: React.FC = () => {
    const [stats, setStats] = useState({
        activeSellers: 0,
        suppliersConnected: 0,
        itemsManaged: 0,
        transactions: 0
    });

    useEffect(() => {
        // Simulate animation to target numbers
        const targetStats = {
            activeSellers: 1240,
            suppliersConnected: 350,
            itemsManaged: 15800,
            transactions: 5600
        };

        const duration = 2000; // 2 seconds
        const steps = 50;
        const interval = duration / steps;

        let currentStep = 0;

        const timer = setInterval(() => {
            currentStep++;
            const progress = currentStep / steps;
            
            // Ease-out effect
            const easeOut = 1 - Math.pow(1 - progress, 3);

            setStats({
                activeSellers: Math.floor(targetStats.activeSellers * easeOut),
                suppliersConnected: Math.floor(targetStats.suppliersConnected * easeOut),
                itemsManaged: Math.floor(targetStats.itemsManaged * easeOut),
                transactions: Math.floor(targetStats.transactions * easeOut)
            });

            if (currentStep >= steps) {
                clearInterval(timer);
            }
        }, interval);

        return () => clearInterval(timer);
    }, []);

    return (
        <section className="py-12 bg-white dark:bg-gray-900 border-y border-gray-100 dark:border-gray-800">
            <div className="container mx-auto px-4 sm:px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    <div data-aos="fade-up">
                        <p className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">
                            {stats.activeSellers.toLocaleString()}+
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wide font-medium">Active Sellers</p>
                    </div>
                    <div data-aos="fade-up" data-aos-delay="100">
                        <p className="text-4xl font-bold text-purple-600 dark:text-purple-400">
                            {stats.suppliersConnected.toLocaleString()}+
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wide font-medium">Suppliers Connected</p>
                    </div>
                    <div data-aos="fade-up" data-aos-delay="200">
                        <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                            {stats.itemsManaged.toLocaleString()}+
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wide font-medium">Items Managed</p>
                    </div>
                    <div data-aos="fade-up" data-aos-delay="300">
                        <p className="text-4xl font-bold text-green-600 dark:text-green-400">
                            {stats.transactions.toLocaleString()}+
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wide font-medium">Transactions</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default StatsSection;
