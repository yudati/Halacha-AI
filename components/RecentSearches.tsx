import React from 'react';
import { motion, Variants } from 'framer-motion';
import { useUserLibrary, HistoryItem } from '../contexts/UserLibraryContext';
import { useLanguage } from '../contexts/LanguageContext';
import { HistoryIcon } from './Icon';

interface RecentSearchesProps {
  onLoadSearch: (item: HistoryItem) => void;
}

const RecentSearches: React.FC<RecentSearchesProps> = ({ onLoadSearch }) => {
  const { history } = useUserLibrary();
  const { t } = useLanguage();
  const recentHistory = history.slice(0, 3);

  if (recentHistory.length === 0) {
    return null;
  }

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: 'tween', ease: 'easeOut', duration: 0.4 }
    },
  };

  return (
    <div className="w-full max-w-2xl mt-12">
      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">{t('recentSearchesTitle')}</h3>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {recentHistory.map(item => (
          <motion.button
            key={item.id}
            variants={itemVariants}
            onClick={() => onLoadSearch(item)}
            className="text-left p-4 bg-white/50 dark:bg-gray-800/20 rounded-2xl shadow-lg border border-gray-200 dark:border-white/10 w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow duration-300 ease-in-out hover:shadow-xl"
          >
            <div className="flex items-center gap-2 mb-2 text-primary-600 dark:text-primary-400">
                <HistoryIcon className="w-4 h-4 flex-shrink-0" />
                <p className="text-sm font-semibold truncate">{new Date(item.timestamp).toLocaleDateString()}</p>
            </div>
            <p className="font-semibold text-gray-800 dark:text-gray-200 line-clamp-2">{item.query}</p>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
};

export default RecentSearches;