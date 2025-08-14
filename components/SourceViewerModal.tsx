import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { HalachicSource, normalizeSefariaRefForAPI, fetchWithProxyFallback } from '../services/geminiService';
import { SefariaTextResponse } from '../types/sefaria';
import { CloseIcon } from './Icon';
import Spinner from './Spinner';

interface SourceViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  source: HalachicSource | null;
}

const SourceViewerModal: React.FC<SourceViewerModalProps> = ({ isOpen, onClose, source }) => {
  const { t, dir } = useLanguage();
  const [content, setContent] = useState<SefariaTextResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && source) {
      const fetchSource = async () => {
        setIsLoading(true);
        setError(null);
        setContent(null);
        try {
          const normalizedRef = normalizeSefariaRefForAPI(source.sefariaRef);
          const url = `https://www.sefaria.org/api/texts/${normalizedRef}?context=1`;
          const response = await fetchWithProxyFallback(url);
          
          const data: SefariaTextResponse = await response.json();
           if (data.error) {
            console.error(`Sefaria API returned an error. Ref: ${source.sefariaRef}, Normalized: ${normalizedRef}`, data.error);
            throw new Error(data.error);
          }
          setContent(data);
        } catch (err) {
          console.error("Error processing Sefaria API fetch:", err);
          setError(t('errorLoadingSource'));
        } finally {
          setIsLoading(false);
        }
      };
      fetchSource();
    }
  }, [isOpen, source, t]);

  const highlightedText = useMemo(() => {
    if (!content || !source) return '';

    const rawSefariaText = Array.isArray(content.he) ? content.he.join('\n') : String(content.he);
    const quoteFromAI = source.quote;

    const textToFind = quoteFromAI.replace(/<b>|<\/b>/gi, '');

    const highlightClass = "bg-blue-800/60 text-blue-100 px-1 rounded";
    const replacementText = quoteFromAI.replace(/<b>/gi, `<mark class="${highlightClass}">`).replace(/<\/b>/gi, '</mark>');

    // Primary strategy: Replace the exact substring. This is the ideal case.
    if (rawSefariaText.includes(textToFind)) {
        return rawSefariaText.replace(textToFind, replacementText);
    } 
    
    // Fallback strategy: If exact match fails, normalize both texts heavily and try again.
    // This is destructive to Sefaria's formatting but is better than no highlight.
    console.warn("Could not find exact quote substring. Falling back to aggressive normalization for highlighting.");
    
    const normalizeForSearch = (str: string) => {
        if (!str) return '';
        return str
            .replace(/[\u0591-\u05C7]/g, '') // Strip Hebrew nikud (vowel points)
            .replace(/<[^>]+>/g, '') // Strip all HTML tags
            .replace(/[.,:;()"'־-]/g, ' ') // Replace punctuation with space
            .replace(/\s+/g, ' ') // Normalize all whitespace to single spaces
            .trim();
    };

    const searchableSefariaText = normalizeForSearch(rawSefariaText);
    const searchableQuote = normalizeForSearch(quoteFromAI);
    
    const index = searchableSefariaText.indexOf(searchableQuote);

    if (index !== -1) {
        console.warn("Fallback highlighting successful.");
        // Since we stripped Sefaria's formatting, we can't restore it.
        // We display the stripped text with our highlight.
        const before = searchableSefariaText.substring(0, index);
        // The highlighted part should be the text that was found, but with styling.
        const highlighted = `<mark class="${highlightClass}">${searchableQuote}</mark>`;
        const after = searchableSefariaText.substring(index + searchableQuote.length);
        return `${before}${highlighted}${after}`;
    }

    // Last resort: If even the aggressive fallback fails, Gemini likely modified the text.
    console.error("Complete failure to highlight text. Displaying unhighlighted text. Gemini may have altered the source quote.");
    return rawSefariaText;
    
}, [content, source]);
  
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center animate-fade-in-fast"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="source-viewer-title"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl m-4 flex flex-col h-[80vh]"
        onClick={(e) => e.stopPropagation()}
        dir={dir}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 id="source-viewer-title" className="text-xl font-bold text-gray-800 dark:text-gray-100 truncate">
            {content?.heRef || source?.source || '...'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
            aria-label="Close source viewer"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 flex-1">
          {isLoading && <Spinner />}
          {error && <p className="text-center text-red-600 dark:text-red-400">{error}</p>}
          {content && (
            <div className="prose max-w-none">
              <p 
                className="text-xl/loose text-justify text-gray-700 dark:text-gray-300"
                dangerouslySetInnerHTML={{ __html: highlightedText }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SourceViewerModal;