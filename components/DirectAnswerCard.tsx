import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { ZapIcon } from './Icon';

interface DirectAnswerCardProps {
  answer: string;
  onSearchSources: () => void;
}

const DirectAnswerCard: React.FC<DirectAnswerCardProps> = ({ answer }) => {
  const { t } = useLanguage();

  return (
    <div className="bg-yellow-500/10 dark:bg-yellow-400/10 p-6 rounded-xl shadow-lg border border-yellow-500/20 dark:border-yellow-400/20 w-full animate-fade-in mb-6 backdrop-blur-sm">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 text-yellow-600 dark:text-yellow-300">
           <ZapIcon className="w-8 h-8" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-yellow-800 dark:text-yellow-200">{t('directAnswerTitle')}</h3>
          <p className="mt-2 text-lg/relaxed text-yellow-900 dark:text-yellow-100">{answer}</p>
          <p className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">{t('aiSummaryDisclaimer')}</p>
        </div>
      </div>
    </div>
  );
};

export default DirectAnswerCard;
