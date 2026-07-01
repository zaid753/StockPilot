import React from 'react';

const BackgroundEffects: React.FC = () => {
    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
            {/* Base gradient */}
            <div className="absolute inset-0 bg-gray-900"></div>
            
            {/* Grid overlay */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
            <div 
                className="absolute inset-0"
                style={{
                    backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}
            ></div>

            {/* Animated Orbs */}
            <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-600/20 blur-[120px] animate-blob"></div>
            <div className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] rounded-full bg-purple-600/20 blur-[120px] animate-blob [animation-delay:2000ms]"></div>
            <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[50%] rounded-full bg-blue-600/20 blur-[120px] animate-blob [animation-delay:4000ms]"></div>
        </div>
    );
};

export default BackgroundEffects;
