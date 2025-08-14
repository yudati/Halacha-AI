import React from 'react';
import { motion } from 'framer-motion';
import { ChatMessage } from '../services/geminiService';
import { UserCircleIcon, BookIcon } from './Icon';
import { useLanguage } from '../contexts/LanguageContext';

interface RabbiChatMessageProps {
    message: ChatMessage;
    isLoading?: boolean;
}

const RabbiChatMessage: React.FC<RabbiChatMessageProps> = ({ message, isLoading = false }) => {
    const { t } = useLanguage();
    const isModel = message.role === 'model';

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 },
    };

    const containerClasses = isModel ? 'justify-start' : 'justify-end';
    const bubbleClasses = isModel 
        ? 'bg-white dark:bg-gray-700/80 rounded-b-xl rounded-tr-xl' 
        : 'bg-primary-500 text-white rounded-b-xl rounded-tl-xl';
    const icon = isModel 
        ? <BookIcon className="w-8 h-8 text-gray-500 dark:text-gray-400" />
        : <UserCircleIcon className="w-8 h-8 text-primary-500 dark:text-primary-400" />;
    
    const TypingIndicator = () => (
        <div className="flex items-center gap-1.5 p-3">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
        </div>
    );

    return (
        <motion.div
            layout
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className={`flex items-end gap-3 w-full ${containerClasses}`}
        >
            {isModel && <div className="flex-shrink-0">{icon}</div>}
            <div className={`max-w-xl p-4 shadow-md ${bubbleClasses} ${isLoading && isModel ? 'min-h-14 flex items-center' : ''}`}>
                {isLoading ? (
                    <TypingIndicator />
                ) : (
                    <p className="whitespace-pre-wrap">{message.text}</p>
                )}
            </div>
            {!isModel && <div className="flex-shrink-0">{icon}</div>}
        </motion.div>
    );
};

export default RabbiChatMessage;