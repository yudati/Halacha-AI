import React from 'react';
import { BookIcon } from './Icon';
import { useLanguage } from '../contexts/LanguageContext';

interface SuggestedSourcesProps {
    sources: string[];
}

const SuggestedSources: React.FC<SuggestedSourcesProps> = ({ sources }) => {
    const { t } = useLanguage();

    if (sources.length === 0) {
        return null;
    }

    const handleSourceClick = (sourceText: string) => {
        const sefariaSearchUrl = `https://www.sefaria.org/search?q=${encodeURIComponent(sourceText)}`;
        window.open(sefariaSearchUrl, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="mt-8 p-6 bg-purple-50/50 dark:bg-purple-900/20 rounded-xl border border-purple-200/50 dark:border-purple-800/30 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
                <BookIcon className="w-6 h-6 text-purple-500 dark:text-purple-400" />
                <h3 className="text-lg font-bold text-purple-700 dark:text-purple-300">{t('suggestedSourcesTitle')}</h3>
            </div>
            <div className="flex flex-wrap gap-2">
                {sources.map((s, index) => {
                    return (
                        <button
                            key={index}
                            onClick={() => handleSourceClick(s)}
                            className="px-3 py-2 text-sm font-medium bg-white text-purple-700 rounded-full border border-purple-200 hover:bg-purple-100 hover:border-purple-300 dark:bg-purple-900/30 dark:text-purple-200 dark:border-purple-700 dark:hover:bg-purple-900/60 transition-all shadow-sm"
                        >
                            {s}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default SuggestedSources;