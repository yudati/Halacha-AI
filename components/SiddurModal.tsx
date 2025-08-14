

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { siddurData, PrayerCategory, Prayer, Nusach } from '../data/siddurData';
import { CloseIcon, BookIcon, ChevronLeftIcon, SiddurIcon } from './Icon';
import Spinner from './Spinner';
import { fetchWithProxyFallback, normalizeSefariaRefForAPI } from '../services/geminiService';
import { SefariaTextResponse } from '../types/sefaria';
import { TranslationKey } from '../i18n/translations';

interface SiddurModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SiddurView = 'categories' | 'prayers' | 'prayer_text';

const nusachLabelKeys: Record<Nusach, TranslationKey> = {
    'ashkenaz': 'siddurNusachAshkenaz',
    'sefard': 'siddurNusachSefard',
    'edot-hamizrach': 'siddurNusachEdotHamizrach'
};

const SiddurModal: React.FC<SiddurModalProps> = ({ isOpen, onClose }) => {
  const { t, dir } = useLanguage();
  const [view, setView] = useState<SiddurView>('categories');
  const [selectedCategory, setSelectedCategory] = useState<PrayerCategory | null>(null);
  const [selectedPrayer, setSelectedPrayer] = useState<Prayer | null>(null);
  const [selectedNusach, setSelectedNusach] = useState<Nusach>('edot-hamizrach');
  
  const [prayerText, setPrayerText] = useState<string>('');
  const [isLoadingText, setIsLoadingText] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal is closed
      setTimeout(() => {
        setView('categories');
        setSelectedCategory(null);
        setSelectedPrayer(null);
        setPrayerText('');
      }, 300); // delay to allow for exit animation
    }
  }, [isOpen]);

  const handleSelectCategory = (category: PrayerCategory) => {
    setSelectedCategory(category);
    setView('prayers');
  };

  const handleSelectPrayer = (prayer: Prayer) => {
    setSelectedPrayer(prayer);
    fetchPrayerText(prayer, selectedNusach);
    setView('prayer_text');
  };

  const handleSelectNusach = (nusach: Nusach) => {
    setSelectedNusach(nusach);
    if (selectedPrayer) {
      fetchPrayerText(selectedPrayer, nusach);
    }
  };

  const fetchPrayerText = useCallback(async (prayer: Prayer, nusach: Nusach) => {
    setIsLoadingText(true);
    setErrorText(null);
    setPrayerText('');
    const ref = prayer.refs[nusach];
    if (!ref) {
      setErrorText(t('siddurErrorNoRef'));
      setIsLoadingText(false);
      return;
    }
    const normalizedRef = normalizeSefariaRefForAPI(ref);
    const url = `https://www.sefaria.org/api/texts/${normalizedRef}?context=0&commentary=0`;
    try {
      const response = await fetchWithProxyFallback(url);
      const data: SefariaTextResponse = await response.json();
      if (data.error) throw new Error(data.error);
      const text = Array.isArray(data.he) ? data.he.join('\n') : data.he;
      // Basic HTML cleanup from Sefaria
      const cleanedText = text.replace(/<[^>]+>/g, '').replace(/\n/g, '<br />');
      setPrayerText(cleanedText);
    } catch (err) {
      console.error("Error fetching prayer text:", err);
      setErrorText(t('siddurErrorFetch'));
    } finally {
      setIsLoadingText(false);
    }
  }, [t]);

  const handleBack = () => {
    if (view === 'prayer_text') {
      setView('prayers');
      setPrayerText('');
      setSelectedPrayer(null);
    } else if (view === 'prayers') {
      setView('categories');
      setSelectedCategory(null);
    }
  };

  const pageVariants = {
    initial: { opacity: 0, x: dir === 'rtl' ? -50 : 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: dir === 'rtl' ? 50 : -50 },
  };

  const renderContent = () => {
    return (
      <AnimatePresence mode="wait">
        {view === 'categories' && (
          <motion.div key="categories" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="p-6 space-y-4">
            {siddurData.map(category => (
              <button key={category.id} onClick={() => handleSelectCategory(category)} className="w-full text-lg font-semibold p-4 bg-white/50 dark:bg-gray-700/50 rounded-lg text-gray-800 dark:text-gray-200 hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors shadow">
                {t(category.nameKey)}
              </button>
            ))}
          </motion.div>
        )}
        {view === 'prayers' && selectedCategory && (
          <motion.div key="prayers" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="p-6 space-y-4">
            {selectedCategory.prayers.map(prayer => (
              <button key={prayer.id} onClick={() => handleSelectPrayer(prayer)} className="w-full text-lg font-semibold p-4 bg-white/50 dark:bg-gray-700/50 rounded-lg text-gray-800 dark:text-gray-200 hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors shadow">
                {t(prayer.nameKey)}
              </button>
            ))}
          </motion.div>
        )}
        {view === 'prayer_text' && selectedPrayer && (
          <motion.div key="prayer_text" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col h-full">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700/50 flex-shrink-0">
              <h3 className="text-xl font-bold text-center text-primary-600 dark:text-primary-400">{t(selectedPrayer.nameKey)}</h3>
              <div className="flex justify-center gap-2 mt-2" role="radiogroup">
                {(Object.keys(selectedPrayer.refs) as Nusach[]).map(nusach => (
                  <button key={nusach} onClick={() => handleSelectNusach(nusach)} disabled={isLoadingText} className={`px-3 py-1 rounded-full text-sm font-semibold transition-colors ${selectedNusach === nusach ? 'bg-primary-500 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500'}`}>
                    {t(nusachLabelKeys[nusach])}
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-y-auto p-6 flex-1">
              {isLoadingText && <div className="h-full flex items-center justify-center"><Spinner /></div>}
              {errorText && <p className="text-center text-red-500 dark:text-red-400">{errorText}</p>}
              {prayerText && <div className="text-xl/loose text-right text-gray-800 dark:text-gray-200" dangerouslySetInnerHTML={{ __html: prayerText }} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center"
          onClick={onClose}
          role="dialog" aria-modal="true" aria-labelledby="siddur-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl m-4 flex flex-col h-[85vh]"
            onClick={(e) => e.stopPropagation()}
            dir={dir}
          >
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700/50 flex-shrink-0">
              <div className="w-12">
                {view !== 'categories' && (
                  <button onClick={handleBack} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors" aria-label="Back">
                    <ChevronLeftIcon className={`w-6 h-6 text-gray-600 dark:text-gray-300 ${dir === 'rtl' ? 'transform scale-x-[-1]' : ''}`} />
                  </button>
                )}
              </div>
              <h2 id="siddur-title" className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <SiddurIcon className="w-6 h-6" />
                {t('siddurTitle')}
              </h2>
              <div className="w-12 flex justify-end">
                <button onClick={onClose} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors" aria-label="Close siddur">
                  <CloseIcon className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden relative">
              {renderContent()}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SiddurModal;