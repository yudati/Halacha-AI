import React from 'react';
import { motion, Variants } from 'framer-motion';
import { LinkIcon, ExpandIcon, HeartIcon, HeartFilledIcon, PlusIcon } from './Icon';
import { useLanguage } from '../contexts/LanguageContext';
import { HalachicSource } from '../services/geminiService';

interface ResultCardProps {
  source: HalachicSource;
  onExpand: (source: HalachicSource) => void;
  isLoved: boolean;
  onToggleLove: () => void;
  onLoadMore?: (category: string) => void;
  isLoadingMore?: boolean;
  showLoadMore?: boolean;
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

function ResultCard({ source, onExpand, isLoved, onToggleLove, onLoadMore, isLoadingMore, showLoadMore = true, headingClass }: ResultCardProps) {
  const { t } = useLanguage();
  const isCustomBook = !source.link || source.hebrewCategoryName === 'ספר אישי' || source.hebrewCategoryName === 'Custom Book' || source.hebrewCategoryName === 'ספרים מובנים' || source.hebrewCategoryName === 'Packaged Books';
  
  return (
    <motion.div
      variants={itemVariants}
      className="bg-white/50 dark:bg-gray-800/20 p-6 rounded-2xl shadow-lg dark:shadow-black/20 border border-gray-200 dark:border-white/10 w-full transition-shadow duration-300 ease-in-out hover:shadow-xl"
    >
      <div className="flex flex-col">
        <div className="flex justify-between items-start gap-4">
           <h3 className={`text-xl text-primary-600 dark:text-primary-300 ${headingClass}`}>{source.source}</h3>
           <div className="flex items-center gap-2 flex-shrink-0">
             <button 
                  onClick={onToggleLove}
                  className="p-1 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                  aria-label={isLoved ? t('unloveSourceTooltip') : t('loveSourceTooltip')}
                  title={isLoved ? t('unloveSourceTooltip') : t('loveSourceTooltip')}
              >
               {isLoved ? <HeartFilledIcon className="w-6 h-6 text-red-500 dark:text-red-400" /> : <HeartIcon className="w-6 h-6" />}
             </button>
           </div>
        </div>
        
        <div className="mt-4 bg-gray-500/10 dark:bg-black/20 p-4 rounded-lg min-h-[80px] flex items-center justify-center">
            <blockquote className={`border-s-4 border-primary-500 dark:border-primary-400 ps-4 w-full`}>
                <p className="text-lg/relaxed text-gray-800 dark:text-gray-200" dangerouslySetInnerHTML={{ __html: `"${source.quote}"` }} />
            </blockquote>
        </div>

        <div className={`mt-4 flex flex-wrap gap-x-6 gap-y-2 items-center justify-start`}>
           <button
              onClick={() => onExpand(source)}
              disabled={isCustomBook}
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 dark:text-primary-300 hover:text-primary-500 dark:hover:text-primary-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
              <ExpandIcon className="w-4 h-4" />
              <span>{t('expandSourceButton')}</span>
          </button>
          {source.link && (
              <a
                href={source.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 dark:text-primary-300 hover:text-primary-500 dark:hover:text-primary-200 transition-colors"
              >
                <LinkIcon className="w-4 h-4" />
                <span>{t('linkToSource')}</span>
              </a>
          )}
          {showLoadMore && onLoadMore && (
            <button
                onClick={() => onLoadMore(source.hebrewCategoryName)}
                disabled={isLoadingMore || isCustomBook}
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 dark:text-primary-300 hover:text-primary-500 dark:hover:text-primary-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoadingMore ? (
                    <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        <span>{t('loadingMoreButton')}</span>
                    </>
                ) : (
                    <>
                        <PlusIcon className="w-4 h-4" />
                        <span>{`${t('loadMoreFrom')} ${source.hebrewCategoryName}`}</span>
                    </>
                )}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ResultCard;