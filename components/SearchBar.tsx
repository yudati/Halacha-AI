import React, { useState, useEffect } from 'react';
import { SearchIcon } from './Icon';
import { useLanguage } from '../contexts/LanguageContext';

interface SearchBarProps {
  query: string;
  setQuery: (query: string) => void;
  onSearch: () => void;
  isLoading: boolean;
  placeholders: string[];
}

const SearchBar: React.FC<SearchBarProps> = ({ query, setQuery, onSearch, isLoading, placeholders }) => {
  const { t } = useLanguage();
  const [currentPlaceholder, setCurrentPlaceholder] = useState(placeholders[0]);

  useEffect(() => {
    // Ensure placeholders is a non-empty array before starting
    if (!placeholders || placeholders.length === 0) return;
    
    // Reset placeholder if the list changes
    setCurrentPlaceholder(placeholders[0]);

    const intervalId = setInterval(() => {
      setCurrentPlaceholder(prev => {
        const currentIndex = placeholders.indexOf(prev);
        const nextIndex = (currentIndex + 1) % placeholders.length;
        return placeholders[nextIndex];
      });
    }, 4000); // Change placeholder every 4 seconds

    return () => clearInterval(intervalId);
  }, [placeholders]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3 w-full bg-white/50 dark:bg-gray-800/20 rounded-2xl shadow-lg border border-gray-200 dark:border-white/10 p-2 focus-within:ring-2 focus-within:ring-primary-500 transition-all">
      <div className="relative w-full flex-grow">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={currentPlaceholder}
          className="w-full p-3 bg-transparent text-gray-900 dark:text-white rounded-lg focus:outline-none placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-300"
          disabled={isLoading}
        />
      </div>
      <button
        type="submit"
        className="flex-shrink-0 flex items-center justify-center gap-2 bg-primary-500 text-white font-bold py-3 px-6 rounded-xl hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-900 transition-all transform hover:scale-105 shadow-lg disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:text-gray-600 dark:disabled:text-gray-400 disabled:scale-100 disabled:cursor-not-allowed"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>{t('searchingButton')}</span>
          </>
        ) : (
          <>
            <SearchIcon className="w-5 h-5" />
            <span>{t('searchButton')}</span>
          </>
        )}
      </button>
    </form>
  );
};

export default SearchBar;