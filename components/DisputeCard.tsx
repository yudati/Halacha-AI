import React from 'react';
import { motion, Variants } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { HalachicSource, Dispute } from '../services/geminiService';
import ResultCard from './ResultCard';
import { ScalesIcon } from './Icon';

interface DisputeCardProps {
  dispute: Dispute;
  onExpandSource: (source: HalachicSource) => void;
  isSourceLoved: (sourceId: string) => boolean;
  onToggleLove: (source: HalachicSource) => void;
  headingClass: string;
}

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'tween', ease: 'easeOut', duration: 0.4 }
  }
};

const DisputeCard: React.FC<DisputeCardProps> = ({ dispute, onExpandSource, isSourceLoved, onToggleLove, headingClass }) => {
  const { t } = useLanguage();

  return (
    <motion.div
      variants={itemVariants}
      className="bg-white/50 dark:bg-gray-800/20 p-4 sm:p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-white/10 w-full transition-shadow duration-300 ease-in-out hover:shadow-xl"
    >
      <div className="flex items-center gap-3 pb-4 border-b-2 border-gray-200 dark:border-white/10">
        <ScalesIcon className="w-8 h-8 text-primary-600 dark:text-primary-400 flex-shrink-0" />
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{t('disputeTopicTitle')}</h2>
          <p className={`text-xl text-gray-800 dark:text-gray-200 ${headingClass}`}>{dispute.topic}</p>
        </div>
      </div>
      
      <div className="mt-4 space-y-8">
        {dispute.opinions.map((opinion, index) => (
          <div key={index} className="p-4 bg-gray-50/50 dark:bg-black/20 rounded-lg">
            <div className="mb-4">
              <h4 className="text-md font-semibold text-gray-600 dark:text-gray-300">{t('opinionSummaryTitle')}</h4>
              <p className="mt-1 text-lg text-gray-800 dark:text-gray-200">{opinion.summary}</p>
            </div>
            
            <h5 className="mb-3 text-sm font-semibold text-gray-500 dark:text-gray-400">{t('sourcesForThisOpinion')}</h5>
            <div className="space-y-4">
              {opinion.sources.map(source => (
                <ResultCard
                  key={source.id}
                  source={source}
                  onExpand={onExpandSource}
                  isLoved={isSourceLoved(source.id)}
                  onToggleLove={() => onToggleLove(source)}
                  showLoadMore={false} // Never show "load more" in this context
                  headingClass={headingClass}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default DisputeCard;