
import { useEffect, useRef } from 'react';

const useScrollAnimation = <T extends HTMLElement>() => {
    const ref = useRef<T>(null);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;
        
        // Add a class to hide the element initially
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    element.style.opacity = '1';
                    element.style.transform = 'translateY(0)';
                    observer.unobserve(element); // Stop observing once it's visible
                }
            },
            {
                threshold: 0.1, // Trigger when 10% of the element is visible
            }
        );

        observer.observe(element);

        return () => {
            if (element) {
                observer.unobserve(element);
            }
        };
    }, []);

    return ref;
};

export default useScrollAnimation;
