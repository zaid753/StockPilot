
import React from 'react';

interface HeroSectionProps {
    onGetStartedClick: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onGetStartedClick }) => {
    return (
        <section id="hero" className="relative pt-32 pb-20 md:pt-40 md:pb-28 bg-gradient-to-b from-indigo-50 to-white dark:from-gray-900 dark:to-gray-900">
            {/* Removed the absolute positioned div that was causing a visual glitch */}

            <div className="container mx-auto px-4 sm:px-6">
                <div className="text-center">
                    <h1 className="text-4xl md:text-6xl font-extrabold leading-tighter tracking-tighter mb-4 text-gray-900 dark:text-white" data-aos="zoom-y-out">
                        Smart Inventory, 
                        <br />
                        <span className="text-indigo-500">Seamless Connections.</span>
                    </h1>
                    <div className="max-w-3xl mx-auto">
                        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8" data-aos="zoom-y-out" data-aos-delay="150">
                            Stock Pilot is the all-in-one platform that connects sellers with suppliers and automates inventory management with voice commands, expiry alerts, and real-time chat.
                        </p>
                        <div className="max-w-xs mx-auto sm:max-w-none sm:flex sm:justify-center" data-aos="zoom-y-out" data-aos-delay="300">
                            <button
                                onClick={onGetStartedClick}
                                className="w-full sm:w-auto px-8 py-3 text-white bg-indigo-600 rounded-full hover:bg-indigo-700 shadow-lg transition duration-150 ease-in-out"
                            >
                                Get Started
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
