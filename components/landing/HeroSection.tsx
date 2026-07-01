
import React, { useEffect, useState } from 'react';
import { SiteConfig } from '../../types';

interface HeroSectionProps {
    onGetStartedClick: () => void;
    config?: SiteConfig['hero'];
}

const HeroSection: React.FC<HeroSectionProps> = ({ onGetStartedClick, config }) => {
    const title = config?.title || 'Smart Inventory,\nSeamless Connections.';
    const subtitle = config?.subtitle || 'Stock Pilot is the all-in-one platform that connects sellers with suppliers and automates inventory management with voice commands, expiry alerts, and real-time chat.';
    const bgImage = config?.imageUrl || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80';

    const [offset, setOffset] = useState(0);

    useEffect(() => {
        const handleScroll = () => setOffset(window.scrollY);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <section id="hero" className="relative h-screen min-h-[600px] flex items-center overflow-hidden">
            {/* Parallax Background */}
            <div 
                className="absolute inset-0 z-0"
                style={{ transform: `translateY(${offset * 0.5}px)` }}
            >
                <img 
                    src={bgImage} 
                    alt="Warehouse Background" 
                    className="w-full h-full object-cover scale-110 filter brightness-50 contrast-125 transition-transform duration-[20000ms] ease-linear hover:scale-125" 
                />
                <div className="absolute inset-0 bg-gradient-to-b from-gray-900/80 via-gray-900/70 to-gray-900"></div>
            </div>

            <div className="container mx-auto px-4 sm:px-6 relative z-10 pt-20">
                <div className="text-center max-w-5xl mx-auto">
                    <h1 
                        className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 drop-shadow-2xl bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-blue-500 to-purple-600 animate-fade-in-down" 
                        data-aos="zoom-y-out" 
                        data-aos-duration="1200"
                    >
                        {title}
                    </h1>
                    <div className="max-w-3xl mx-auto">
                        <p className="text-xl md:text-2xl text-gray-300 mb-10 font-light leading-relaxed" data-aos="fade-up" data-aos-delay="300">
                            {subtitle}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-5 justify-center" data-aos="fade-up" data-aos-delay="600">
                            <button
                                onClick={onGetStartedClick}
                                className="px-10 py-4 text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full shadow-[0_0_15px_rgba(79,70,229,0.5)] hover:shadow-[0_0_30px_rgba(79,70,229,0.8)] transition-all duration-300 ease-out font-bold text-lg transform hover:-translate-y-1 hover:scale-110 ring-2 ring-offset-2 ring-offset-transparent ring-indigo-500"
                            >
                                Get Started Free
                            </button>
                            <button
                                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                                className="px-10 py-4 text-white border border-gray-500 bg-gray-800/40 backdrop-blur-md rounded-full hover:bg-gray-700/60 transition-all duration-300 ease-out font-bold text-lg hover:border-white"
                            >
                                Learn More
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Scroll Indicator */}
            <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce text-cyan-400/70">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
            </div>
        </section>
    );
};

export default HeroSection;
