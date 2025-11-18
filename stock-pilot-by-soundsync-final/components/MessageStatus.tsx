
import React from 'react';
import { Message } from '../types';
import { CheckIcon, CheckDoubleIcon } from './icons';

interface MessageStatusProps {
    status: Message['deliveryStatus'];
}

const MessageStatus: React.FC<MessageStatusProps> = ({ status }) => {
    switch (status) {
        case 'sent':
            return <CheckIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />;
        case 'delivered':
            return <CheckDoubleIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />;
        case 'seen':
            return <CheckDoubleIcon className="w-4 h-4 text-blue-500 dark:text-blue-400" />;
        default:
            return null;
    }
};

export default MessageStatus;
