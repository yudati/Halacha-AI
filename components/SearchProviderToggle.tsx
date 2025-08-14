import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { SearchProvider } from '../contexts/SettingsContext';
import { BookIcon, GlobeAltIcon, ChatBubbleLeftIcon } from './Icon';

interface SearchProviderToggleProps {
  provider: SearchProvider;
  setProvider: (provider: SearchProvider) => void;
  disabled: boolean;
}

const SearchProviderToggle: React.FC<SearchProviderToggleProps> = ({ provider, setProvider, disabled }) => {
  const { t } = useLanguage();

  const buttonClass = (isActive: boolean) => 
    `flex-1 py-3 px-4 text-sm font-bold rounded-xl transition-all duration-300 transform focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50 flex items-center justify-center gap-2
    ${isActive 
      ? 'bg-primary-500 text-white shadow-lg' 
      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
    }
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`;

  return (
    <div className="mb-6 flex flex-col items-center">
      <label className="text-sm font-medium text-primary-600 dark:text-primary-400 mb-2">{t('searchProviderLabel')}</label>
      <div className="flex w-full max-w-md p-1.5 bg-gray-100 dark:bg-gray-800/50 rounded-2xl space-x-2 border border-gray-200 dark:border-white/10" role="radiogroup">
        <button
          onClick={() => setProvider('sefaria')}
          disabled={disabled}
          className={buttonClass(provider === 'sefaria')}
          role="radio"
          aria-checked={provider === 'sefaria'}
        >
          <BookIcon className="w-5 h-5" />
          <span>{t('sefariaLabel')}</span>
        </button>
        <button
          onClick={() => setProvider('google')}
          disabled={disabled}
          className={buttonClass(provider === 'google')}
          role="radio"
          aria-checked={provider === 'google'}
        >
          <GlobeAltIcon className="w-5 h-5" />
          <span>{t('googleLabel')}</span>
        </button>
        <button
          onClick={() => setProvider('rabbi-chat')}
          disabled={disabled}
          className={buttonClass(provider === 'rabbi-chat')}
          role="radio"
          aria-checked={provider === 'rabbi-chat'}
        >
          <ChatBubbleLeftIcon className="w-5 h-5" />
          <span>{t('rabbiChatLabel')}</span>
        </button>
      </div>
    </div>
  );
};

export default SearchProviderToggle;