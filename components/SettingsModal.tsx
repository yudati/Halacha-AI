import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { useSettings, SettingsState, primaryColors, SearchMode, SearchProvider } from '../contexts/SettingsContext';
import { CheckIcon, CloseIcon } from './Icon';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { t, dir } = useLanguage();
  const { settings, setSetting, resetSettings } = useSettings();

  const [localSettings, setLocalSettings] = useState<SettingsState>(settings);
  
  useEffect(() => {
      if(isOpen) {
          setLocalSettings(settings);
      }
  }, [isOpen, settings]);

  const handleReset = () => {
    if (window.confirm(t('resetConfirmation'))) {
      resetSettings();
      alert(t('resetSuccessMessage'));
      window.location.reload();
    }
  };

  const handleSave = () => {
    Object.keys(localSettings).forEach(keyStr => {
      const key = keyStr as keyof SettingsState;
      if (settings[key] !== localSettings[key]) {
        setSetting(key, localSettings[key] as any);
      }
    });
    
    alert(t('changesSaved'));
    onClose();
  };
  
  const handleLocalSettingChange = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };
  
  const renderOption = <T extends string>(
    currentValue: T,
    value: T,
    label: string,
    setter: () => void
  ) => (
    <button
      onClick={setter}
      className={`flex-1 p-2 rounded-lg text-center transition-colors text-sm font-semibold ${
        currentValue === value
          ? 'bg-primary-500 text-white shadow'
          : 'bg-black/10 dark:bg-black/20 text-gray-700 dark:text-gray-200 hover:bg-black/20 dark:hover:bg-white/10'
      }`}
      role="menuitemradio"
      aria-checked={currentValue === value}
    >
      {label}
    </button>
  );

  const renderSearchModeOption = (
    mode: SearchMode,
    label: string,
    description: string
  ) => (
     <button
      onClick={() => handleLocalSettingChange('searchMode', mode)}
      className={`text-left p-3 rounded-lg flex-1 transition-colors border-2 ${localSettings.searchMode === mode ? 'bg-primary-500/10 border-primary-500' : 'bg-black/5 dark:bg-white/5 border-transparent hover:bg-black/10 dark:hover:bg-white/10'}`}
      role="radio"
      aria-checked={localSettings.searchMode === mode}
    >
      <span className="font-semibold text-gray-800 dark:text-gray-100">{label}</span>
      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{description}</p>
    </button>
  )
  
  const Section: React.FC<{title: string, children: React.ReactNode}> = ({title, children}) => (
    <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-primary-600 dark:text-primary-400">{title}</h3>
        {children}
    </div>
  );

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
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-sm m-4 flex flex-col"
            onClick={(e) => e.stopPropagation()}
            dir={dir}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 pb-4">
              <h2 id="settings-title" className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('settingsTitle')}
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                aria-label="Close settings"
              >
                <CloseIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto px-6 pb-4 flex-grow" style={{maxHeight: 'calc(80vh - 150px)'}}>
                <div className="flex flex-col gap-6 text-gray-800 dark:text-gray-200">
                    
                    <Section title={t('themeLabel')}>
                      <div className="flex items-center gap-2 p-1 bg-gray-200 dark:bg-black/20 rounded-xl">
                         {renderOption(localSettings.theme, 'light', t('themeLight'), () => handleLocalSettingChange('theme', 'light'))}
                         {renderOption(localSettings.theme, 'dark', t('themeDark'), () => handleLocalSettingChange('theme', 'dark'))}
                      </div>
                    </Section>
                    
                    <Section title={t('primaryColorLabel')}>
                        <div className="flex justify-around items-center p-1 bg-gray-200 dark:bg-black/20 rounded-xl">
                            {primaryColors.map(color => (
                                <button key={color.name} onClick={() => handleLocalSettingChange('primaryColor', color.name)} className="w-8 h-8 rounded-full transition-all duration-200" style={{backgroundColor: color.hex}} aria-label={color.a11yName}>
                                    {localSettings.primaryColor === color.name && (
                                        <motion.div initial={{scale:0}} animate={{scale:1}} className="w-full h-full flex items-center justify-center rounded-full bg-black/30">
                                            <CheckIcon className="w-5 h-5 text-white"/>
                                        </motion.div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </Section>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <Section title={t('headingFontLabel')}>
                          <div className="flex items-center gap-2 p-1 bg-gray-200 dark:bg-black/20 rounded-xl">
                             {renderOption(localSettings.headingFont, 'sans', t('fontSans'), () => handleLocalSettingChange('headingFont', 'sans'))}
                             {renderOption(localSettings.headingFont, 'serif', t('fontSerif'), () => handleLocalSettingChange('headingFont', 'serif'))}
                          </div>
                        </Section>
                         <Section title={t('fontLabel')}>
                          <div className="flex items-center gap-2 p-1 bg-gray-200 dark:bg-black/20 rounded-xl">
                             {renderOption(localSettings.font, 'sans', t('fontSans'), () => handleLocalSettingChange('font', 'sans'))}
                             {renderOption(localSettings.font, 'serif', t('fontSerif'), () => handleLocalSettingChange('font', 'serif'))}
                          </div>
                        </Section>
                    </div>

                    <Section title={t('textSizeLabel')}>
                      <div className="flex items-center gap-2 p-1 bg-gray-200 dark:bg-black/20 rounded-xl">
                         {renderOption(localSettings.textSize, 'sm', t('textSizeSmall'), () => handleLocalSettingChange('textSize', 'sm'))}
                         {renderOption(localSettings.textSize, 'base', t('textSizeMedium'), () => handleLocalSettingChange('textSize', 'base'))}
                         {renderOption(localSettings.textSize, 'lg', t('textSizeLarge'), () => handleLocalSettingChange('textSize', 'lg'))}
                      </div>
                    </Section>
                    
                    <Section title={t('searchModeTitle')}>
                      <div className="flex flex-col gap-2" role="radiogroup">
                        {renderSearchModeOption('precise', t('searchModePrecise'), t('searchModePreciseDescription'))}
                        {renderSearchModeOption('advanced', t('searchModeAdvanced'), t('searchModeAdvancedDescription'))}
                        {renderSearchModeOption('broad', t('searchModeBroad'), t('searchModeBroadDescription'))}
                      </div>
                    </Section>

                    <div className="space-y-4 border-t border-gray-300 dark:border-white/10 pt-6 mt-2">
                        <Section title={t('defaultSearchSettingsTitle')}>
                           <div className="space-y-3">
                                <div>
                                    <label htmlFor="default-search-provider" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                      {t('defaultSearchProviderLabel')}
                                    </label>
                                    <div className="flex items-center gap-2 p-1 bg-gray-200 dark:bg-black/20 rounded-xl">
                                      {renderOption(localSettings.defaultSearchProvider, 'sefaria', t('sefariaLabel'), () => handleLocalSettingChange('defaultSearchProvider', 'sefaria'))}
                                      {renderOption(localSettings.defaultSearchProvider, 'google', t('googleLabel'), () => handleLocalSettingChange('defaultSearchProvider', 'google'))}
                                    </div>
                               </div>
                               <div>
                                    <label htmlFor="default-book-select" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                        {t('defaultBookLabel')}
                                    </label>
                                    <select
                                        id="default-book-select"
                                        value={localSettings.defaultSearchBook}
                                        onChange={(e) => handleLocalSettingChange('defaultSearchBook', e.target.value)}
                                        className="w-full p-2 bg-white/80 dark:bg-white/10 text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    >
                                        {t('bookCategories').map((category: any) => (
                                            <optgroup key={category.category} label={category.category} className="bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-300">
                                                {category.books.map((book: any) => (
                                                    <option key={book.value} value={book.value} className="bg-white dark:bg-gray-800">
                                                        {book.label}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="default-limit-select" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                        {t('defaultLimitLabel')}
                                    </label>
                                    <select
                                        id="default-limit-select"
                                        value={localSettings.defaultResultLimit}
                                        onChange={(e) => handleLocalSettingChange('defaultResultLimit', e.target.value)}
                                         className="w-full p-2 bg-white/80 dark:bg-white/10 text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    >
                                        {t('limitOptions').map((option: any) => (
                                            <option key={option.value} value={option.value} className="bg-white dark:bg-gray-800">
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </Section>
                    </div>
                </div>
            </div>
            
            {/* Actions Footer */}
            <div className="flex flex-col gap-3 p-6 pt-4 border-t border-gray-300 dark:border-white/10 flex-shrink-0">
                <button
                    onClick={handleSave}
                    className="w-full text-center py-3 px-4 rounded-lg font-bold text-white bg-primary-500 hover:bg-primary-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-900 shadow-lg"
                >
                    {t('saveChangesButton')}
                </button>
                <button
                    onClick={handleReset}
                    className="w-full text-center text-sm font-medium text-red-500 hover:text-red-400 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                >
                    {t('resetAppSettings')}
                </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SettingsModal;