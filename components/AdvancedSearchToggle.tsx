

import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { BrainIcon } from './Icon';

interface AdvancedSearchToggleProps {
  isEnabled: boolean;
  setIsEnabled: (enabled: boolean) => void;
  disabled: boolean;
}

const AdvancedSearchToggle: React.FC<AdvancedSearchToggleProps> = ({ isEnabled, setIsEnabled, disabled }) => {
  const { t, dir } = useLanguage();

  return (
    <div className={`flex justify-center items-center gap-4 my-5 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`} title={t('advancedSearchSettingDescription')}>
      <label htmlFor="advanced-search-toggle" className="flex items-center cursor-pointer text-gray-700 dark:text-gray-300 font-semibold" aria-disabled={disabled}>
        <BrainIcon className={`w-5 h-5 ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`} />
        <span>{t('advancedSearchSettingLabel')}</span>
      </label>
      <button
        id="advanced-search-toggle"
        role="switch"
        aria-checked={isEnabled}
        onClick={() => setIsEnabled(!isEnabled)}
        disabled={disabled}
        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900 ${
          isEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out ${
            isEnabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
};

export default AdvancedSearchToggle;