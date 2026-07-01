
import React, { useEffect, useRef, useState } from 'react';

const CustomCursor: React.FC = () => {
    const cursorRef = useRef<HTMLDivElement>(null);
    const trailerRef = useRef<HTMLDivElement>(null);
    const [isHovering, setIsHovering] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Only run on desktop devices (mouse interaction)
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (isTouchDevice) return;

        setIsVisible(true);

        const moveCursor = (e: MouseEvent) => {
            if (cursorRef.current) {
                cursorRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
            }
            if (trailerRef.current) {
                // Use a slight delay/lag for the trailer for smooth effect
                const x = e.clientX - 12; // center trailer (w=24)
                const y = e.clientY - 12; 
                trailerRef.current.animate({
                    transform: `translate3d(${x}px, ${y}px, 0)`
                }, { duration: 500, fill: "forwards" });
            }
        };

        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'BUTTON' || target.tagName === 'A' || target.closest('button') || target.closest('a') || target.getAttribute('role') === 'button') {
                setIsHovering(true);
            } else {
                setIsHovering(false);
            }
        };

        window.addEventListener('mousemove', moveCursor);
        window.addEventListener('mouseover', handleMouseOver);

        return () => {
            window.removeEventListener('mousemove', moveCursor);
            window.removeEventListener('mouseover', handleMouseOver);
        };
    }, []);

    if (!isVisible) return null;

    return (
        <>
            {/* Main Dot */}
            <div 
                ref={cursorRef}
                className="fixed top-0 left-0 w-3 h-3 bg-cyan-400 rounded-full pointer-events-none z-[9999] mix-blend-difference"
                style={{ transform: 'translate3d(-100px, -100px, 0)' }}
            />
            
            {/* Trailing Ring */}
            <div 
                ref={trailerRef}
                className={`fixed top-0 left-0 w-8 h-8 border-2 border-cyan-400 rounded-full pointer-events-none z-[9998] transition-all duration-300 ease-out
                    ${isHovering ? 'scale-150 bg-cyan-400/20 border-transparent' : 'scale-100'}
                `}
                style={{ transform: 'translate3d(-100px, -100px, 0)' }}
            />
        </>
    );
};

export default CustomCursor;
