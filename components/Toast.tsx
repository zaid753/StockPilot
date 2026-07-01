
import React, { useEffect } from 'react';

interface ToastProps {
    message: string;
    onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => {
                onClose();
            }, 3000); // Auto-dismiss after 3 seconds
            return () => clearTimeout(timer);
        }
    }, [message, onClose]);

    if (!message) return null;

    return (
        <div 
            className="fixed top-5 right-5 z-50 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-6 py-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 animate-fade-in-down"
            role="alert"
        >
            <style>
                {`
                    @keyframes fade-in-down {
                        0% {
                            opacity: 0;
                            transform: translateY(-10px);
                        }
                        100% {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                    .animate-fade-in-down {
                        animation: fade-in-down 0.5s ease-out forwards;
                    }
                `}
            </style>
            <p>{message}</p>
        </div>
    );
};

export default Toast;
