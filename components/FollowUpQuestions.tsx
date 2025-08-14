import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LightbulbIcon, BrainIcon } from './Icon';
import { useLanguage } from '../contexts/LanguageContext';

interface FollowUpQuestionsProps {
    questions: string[];
    onQuestionClick: (question: string) => void;
    answers: Record<string, { answer: string; isLoading: boolean }>;
}

const FollowUpQuestions: React.FC<FollowUpQuestionsProps> = ({ questions, onQuestionClick, answers }) => {
    const { t } = useLanguage();

    const answerVariants = {
        hidden: { opacity: 0, height: 0, marginTop: 0 },
        visible: { opacity: 1, height: 'auto', marginTop: '0.75rem' }, // 12px
    };

    return (
        <div className="mt-8 p-6 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl border border-blue-200/50 dark:border-blue-800/30 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
                <LightbulbIcon className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                <h3 className="text-lg font-bold text-blue-700 dark:text-blue-300">{t('followUpQuestionsTitle')}</h3>
            </div>
            <div className="flex flex-col gap-3">
                {questions.map((q, index) => {
                    const answerData = answers[q];
                    const isAnswered = !!answerData;

                    return (
                        <div key={index}>
                            <button
                                onClick={() => onQuestionClick(q)}
                                disabled={answerData?.isLoading}
                                className={`w-full text-left px-4 py-3 text-sm font-medium bg-white text-blue-800 rounded-lg border border-blue-200 hover:bg-blue-100 hover:border-blue-300 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-700 dark:hover:bg-blue-900/60 transition-all shadow-sm flex justify-between items-center disabled:opacity-70 disabled:cursor-wait`}
                            >
                                <span>{q}</span>
                                {answerData?.isLoading && (
                                     <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                )}
                            </button>
                            <AnimatePresence>
                                {isAnswered && !answerData.isLoading && (
                                    <motion.div
                                        variants={answerVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit="hidden"
                                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                                        className="p-4 bg-gray-100 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700/50 overflow-hidden"
                                    >
                                        <div className="flex items-center gap-2 mb-2 text-primary-600 dark:text-primary-400">
                                            <BrainIcon className="w-5 h-5" />
                                            <h4 className="font-semibold text-sm">{t('aiClarificationTitle')}</h4>
                                        </div>
                                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{answerData.answer}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default FollowUpQuestions;