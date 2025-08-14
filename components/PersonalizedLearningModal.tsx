import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { CloseIcon } from './Icon';

interface PersonalizedLearningModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectPath: (path: string) => void;
}

const PersonalizedLearningModal: React.FC<PersonalizedLearningModalProps> = ({ isOpen, onClose, onSelectPath }) => {
    const { t, dir } = useLanguage();

    if (!isOpen) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center animate-fade-in-fast"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="personalized-learning-title"
        >
            <div
                className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg m-4 flex flex-col"
                onClick={(e) => e.stopPropagation()}
                dir={dir}
            >
                <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 id="personalized-learning-title" className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t('personalizedLearningTitle')}</h2>
                    <button onClick={onClose} className="p-2 rounded-full text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6">
                    <p className="text-center text-gray-500 dark:text-gray-400">{t('noLearningProfile')}</p>
                    {/* Placeholder content for future development */}
                </div>
            </div>
        </div>
    );
};

export default PersonalizedLearningModal;
