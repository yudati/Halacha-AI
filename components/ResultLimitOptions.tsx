import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { ListIcon } from './Icon';


interface ResultLimitOption {
  value: string;
  label: string;
}

interface ResultLimitOptionsProps {
  limitOptions: ResultLimitOption[];
  selectedLimit: string;
  setSelectedLimit: (limit: string) => void;
  isLoading: boolean;
}

function ResultLimitOptions({ limitOptions, selectedLimit, setSelectedLimit, isLoading }: ResultLimitOptionsProps) {
  const { t } = useLanguage();
  return (
    <div>
      <label htmlFor="limit-select" className="flex items-center gap-2 text-sm font-medium text-primary-600 dark:text-primary-400 mb-1">
        <ListIcon className="w-4 h-4" />
        {t('resultsLimitLabel')}
      </label>
      <select
        id="limit-select"
        value={selectedLimit}
        onChange={(e) => setSelectedLimit(e.target.value)}
        disabled={isLoading}
        className="w-full p-3 bg-white/50 dark:bg-gray-800/20 text-gray-900 dark:text-white rounded-xl border border-gray-300 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
      >
        {limitOptions.map(option => (
          <option key={option.value} value={option.value} className="bg-white dark:bg-gray-800">
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default ResultLimitOptions;