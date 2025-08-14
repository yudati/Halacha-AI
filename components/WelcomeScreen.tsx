import React, { useMemo } from 'react';
import { motion, Variants } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { HistoryItem } from '../contexts/UserLibraryContext';
import RecentSearches from './RecentSearches';
import { SearchProvider } from '../contexts/SettingsContext';

interface WelcomeScreenProps {
  headingClass: string;
  onSelectSampleQuestion: (question: string) => void;
  onLoadSearch: (item: HistoryItem) => void;
  subtitleText: string;
  provider: SearchProvider;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.2,
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 100 },
  },
};

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ headingClass, onSelectSampleQuestion, onLoadSearch, subtitleText, provider }) => {
  const { t } = useLanguage();

  const sampleQuestions = useMemo(() => {
    const key = provider === 'sefaria' ? 'sampleQuestionsSefaria' : 'sampleQuestionsGoogle';
    const allQuestions: string[] = t(key);
    if (!Array.isArray(allQuestions) || allQuestions.length === 0) return [];
    
    // Shuffle the array and take the first 3
    return [...allQuestions].sort(() => 0.5 - Math.random()).slice(0, 3);
  }, [provider, t]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="text-center text-gray-500 dark:text-gray-400 mt-8 sm:mt-12 flex flex-col items-center"
    >
      <motion.svg
        width="120"
        height="120"
        viewBox="0 0 24 24"
        className="mb-6 text-primary-500 drop-shadow-lg"
        initial="hidden"
        animate="visible"
      >
        <motion.path
          d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          variants={{
            hidden: { pathLength: 0, opacity: 0 },
            visible: { pathLength: 1, opacity: 1, transition: { duration: 1.5, ease: "easeInOut" } }
          }}
        />
      </motion.svg>
      <h2 className={`text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white ${headingClass}`}>{t('welcomeTitle')}</h2>
      <p className="mt-2 text-lg text-primary-600 dark:text-primary-400">{subtitleText}</p>
      
      {sampleQuestions.length > 0 && (
          <div className="w-full max-w-2xl mt-12">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">{t('trySampleQuestion')}</h3>
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
                {sampleQuestions.map((q, i) => (
                    <motion.button
                        key={i}
                        variants={itemVariants}
                        whileHover={{ y: -5, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onSelectSampleQuestion(q)}
                        className="text-center p-4 bg-white/50 dark:bg-gray-800/20 rounded-2xl shadow-lg border border-gray-200 dark:border-white/10 w-full h-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 flex items-center justify-center"
                    >
                        <p className="font-semibold text-gray-700 dark:text-gray-200">{q}</p>
                    </motion.button>
                ))}
            </motion.div>
        </div>
      )}
      
      <RecentSearches onLoadSearch={onLoadSearch} />
    </motion.div>
  );
};

export default WelcomeScreen;