
import React from 'react';
import { MicIcon } from './icons';

interface MicButtonProps {
    isListening: boolean;
    onClick: () => void;
}

const MicButton: React.FC<MicButtonProps> = ({ isListening, onClick }) => {
    return (
        <button
            onClick={onClick}
            aria-label={isListening ? 'Stop listening' : 'Start listening'}
            className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ease-in-out shadow-md
                ${isListening 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
        >
            {isListening && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>}
            <MicIcon className="w-6 h-6 text-white" />
        </button>
    );
};

export default MicButton;