import React from 'react';
import { motion, Variants } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { BrainIcon, SpeakerWaveIcon } from './Icon';

interface AiSummaryCardProps {
  summary: string;
  isStreaming: boolean;
  title?: string;
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


const AiSummaryCard: React.FC<AiSummaryCardProps> = ({ summary, isStreaming, title, headingClass }) => {
  const { t, language } = useLanguage();

  if (!isStreaming && !summary) {
    return null;
  }
  
  const isLoading = isStreaming && !summary;

  const handleTextToSpeech = () => {
    if ('speechSynthesis' in window && summary) {
      const utterance = new SpeechSynthesisUtterance(summary.replace(/<[^>]+>/g, '')); // Strip HTML for reading
      const voices = window.speechSynthesis.getVoices();
      const hebrewVoice = voices.find(voice => voice.lang.startsWith('he'));
      if (language === 'he' && hebrewVoice) {
        utterance.voice = hebrewVoice;
      }
      utterance.lang = language === 'he' ? 'he-IL' : 'en-US';
      window.speechSynthesis.cancel(); 
      window.speechSynthesis.speak(utterance);
    }
  };

  const cardTitle = title || t('aiSummaryTitle');

  return (
    <motion.div
      variants={itemVariants}
      className="bg-primary-500/10 p-6 rounded-2xl shadow-lg border border-primary-500/20 w-full transition-shadow duration-300 ease-in-out hover:shadow-xl"
    >
      <div className="flex justify-between items-start">
        <div className="flex-1 text-center">
            <div className="flex justify-center items-center gap-3">
              <div className="text-primary-600 dark:text-primary-300">
                 <BrainIcon className="w-7 h-7" />
              </div>
              <h3 className={`text-xl text-primary-700 dark:text-primary-200 ${headingClass}`}>{cardTitle}</h3>
              {isStreaming && (
                <div className="w-5 h-5 border-2 border-primary-600 dark:border-primary-300 border-t-transparent rounded-full animate-spin"></div>
              )}
            </div>
            <p className="mt-1 text-sm font-semibold text-primary-600 dark:text-primary-400">{t('aiSummaryDisclaimer')}</p>
        </div>
        <button
          onClick={handleTextToSpeech}
          className="p-2 text-primary-600 dark:text-primary-300 hover:text-primary-500 dark:hover:text-primary-100 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
          aria-label={t('textToSpeechLabel')}
          title={t('textToSpeechLabel')}
        >
          <SpeakerWaveIcon className="w-6 h-6"/>
        </button>
      </div>
      
      <div className="mt-4">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 text-primary-700 dark:text-primary-200 py-4">
            <div className="w-5 h-5 border-2 border-primary-600 dark:border-primary-300 border-t-transparent rounded-full animate-spin"></div>
            <span>{t('generatingSummary')}</span>
          </div>
        ) : (
          <p className="text-lg/relaxed text-gray-700 dark:text-gray-200" dangerouslySetInnerHTML={{ __html: summary }} />
        )}
      </div>
    </motion.div>
  );
};

export default AiSummaryCard;