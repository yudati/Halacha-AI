import React from 'react';
import { motion, Variants } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { BrainIcon, LinkIcon } from './Icon';
import { GoogleGroundedResult } from '../services/geminiService';


interface GoogleResultCardProps {
  result: GoogleGroundedResult;
  headingClass: string;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'tween', ease: 'easeOut', duration: 0.4 }
  }
};

const GoogleResultCard: React.FC<GoogleResultCardProps> = ({ result, headingClass }) => {
  const { t } = useLanguage();

  const getHostname = (url: string) => {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch (e) {
      // Fallback for invalid URLs, though unlikely from the API
      return url;
    }
  };

  const hasShortSummary = result.shortSummary && result.shortSummary.trim() !== '';
  const hasFullSummary = result.summary && result.summary.trim() !== '';

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      className="space-y-6"
    >
      {hasShortSummary || hasFullSummary ? (
        <motion.div
          variants={itemVariants}
          className="bg-primary-500/10 p-6 rounded-2xl shadow-lg border border-primary-500/20 w-full"
        >
          {/* Short Summary Section */}
          {hasShortSummary && (
            <div>
              <div className="flex justify-center items-center gap-3">
                <div className="text-primary-600 dark:text-primary-300">
                   <BrainIcon className="w-7 h-7" />
                </div>
                <h3 className={`text-xl text-primary-700 dark:text-primary-200 ${headingClass}`}>{t('shortSummaryTitle')}</h3>
              </div>
              <div className="mt-4">
                <p className="text-lg/relaxed text-gray-700 dark:text-gray-200">{result.shortSummary}</p>
              </div>
            </div>
          )}

          {/* Separator */}
          {hasShortSummary && hasFullSummary && <hr className="my-6 border-primary-500/20" />}
          
          {/* Full Summary Section */}
          {hasFullSummary && (
             <div>
              <div className="flex justify-center items-center gap-3">
                {!hasShortSummary && (
                    <div className="text-primary-600 dark:text-primary-300">
                        <BrainIcon className="w-7 h-7" />
                    </div>
                )}
                <h3 className={`text-xl text-primary-700 dark:text-primary-200 ${headingClass}`}>{t('longSummaryTitle')}</h3>
              </div>
              <p className="mt-1 text-center text-sm font-semibold text-primary-600 dark:text-primary-400">{t('aiSummaryDisclaimer')}</p>
              <div className="mt-4">
                <p className="text-lg/relaxed text-gray-700 dark:text-gray-200" dangerouslySetInnerHTML={{ __html: result.summary }} />
              </div>
            </div>
          )}
        </motion.div>
      ) : null}
      
      {result.sources && result.sources.length > 0 && (
        <motion.div
          variants={itemVariants}
          className="bg-white/50 dark:bg-gray-800/20 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-white/10 w-full"
        >
          <h3 className={`text-xl text-primary-600 dark:text-primary-300 mb-4 ${headingClass}`}>{t('webSourcesTitle')}</h3>
          <ul className="space-y-4">
            {result.sources.map((source, index) => {
              const hostname = getHostname(source.web.uri);
              const linkTitle = source.web.title;
              
              return (
                <li key={index} className="flex items-start gap-3">
                  <LinkIcon className="w-5 h-5 mt-1 text-gray-400 dark:text-gray-500 flex-shrink-0"/>
                  <div className="min-w-0">
                    <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="font-semibold text-gray-800 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors block truncate">
                      {linkTitle || hostname}
                    </a>
                    {/* Only show the hostname underneath if a title exists, to avoid redundancy */}
                    {linkTitle && <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{hostname}</p>}
                  </div>
                </li>
              )
            })}
          </ul>
        </motion.div>
      )}
    </motion.div>
  );
};

export default GoogleResultCard;