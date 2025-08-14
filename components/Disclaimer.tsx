import React from 'react';
import { motion } from 'framer-motion';
import { WarningIcon } from './Icon';
import { useLanguage } from '../contexts/LanguageContext';

interface DisclaimerProps {
  headingClass: string;
}

function Disclaimer({ headingClass }: DisclaimerProps) {
  const { t } = useLanguage();
  const disclaimerText = t('disclaimerText');
  return (
    <motion.div
      className="mt-6 p-5 bg-red-500/10 dark:bg-red-500/20 border-s-4 border-red-500 dark:border-red-400 text-red-800 dark:text-red-200 rounded-2xl shadow-lg"
      role="alert"
    >
      <div className="flex items-start gap-4">
        <div>
           <WarningIcon className="h-8 w-8 text-red-600 dark:text-red-300 flex-shrink-0" />
        </div>
        <div className="flex-1">
            <h4 className={`font-extrabold text-lg text-red-900 dark:text-white ${headingClass}`}>{t('disclaimerTitle')}</h4>
            <div className="text-base mt-1 whitespace-pre-line">
              {disclaimerText}
            </div>
        </div>
      </div>
    </motion.div>
  );
}

export default Disclaimer;