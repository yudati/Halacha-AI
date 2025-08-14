import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { HalachicSource } from '../services/geminiService';
import { CloseIcon, DocumentDuplicateIcon } from './Icon';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  sources: HalachicSource[];
  aiSummary: string;
  query: string;
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, sources, aiSummary, query }) => {
  const { t, dir } = useLanguage();
  const [activeTab, setActiveTab] = useState<'bibliography' | 'export'>('bibliography');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) {
    return null;
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const generateChicagoCitation = (source: HalachicSource) => {
    // A simplified Chicago-style citation for web resources
    const book = source.hebrewBookName;
    const title = source.source;
    return `${book}. "${title}". Sefaria.org. Accessed ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}. ${source.link || '(No link available)'}`;
  };

  const generateFullExportText = () => {
    const header = `Query: ${query}\n\n`;
    const summarySection = `${t('aiSummaryExportLabel')}:\n${aiSummary.replace(/<[^>]+>/g, '')}\n\n`;
    const sourcesSection = `${t('sourcesExportLabel')}:\n` +
      sources.map(s => `• ${s.source}: "${s.quote.replace(/<[^>]+>/g, '')}"`).join('\n') +
      `\n\n${t('bibliographyTitle')}:\n` +
      sources.map(s => `• ${generateChicagoCitation(s)}`).join('\n');
    return header + summarySection + sourcesSection;
  };

  const renderBibliography = () => (
    <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{t('bibliographyTitle')}</h3>
        <ul className="space-y-3">
            {sources.map(source => {
                const citation = generateChicagoCitation(source);
                return (
                    <li key={source.id} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                        <span className="flex-grow">{citation}</span>
                        <button
                          onClick={() => handleCopy(citation, source.id)}
                          className="relative flex-shrink-0 p-1 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
                          title={t('copyCitationButton')}
                        >
                          <DocumentDuplicateIcon className="w-4 h-4" />
                          {copiedId === source.id && <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs bg-black text-white px-2 py-1 rounded">{t('copiedTooltip')}</span>}
                        </button>
                    </li>
                );
            })}
        </ul>
    </div>
  );

  const renderExportContent = () => (
    <div className="space-y-4">
       <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{t('exportContentTab')}</h3>
        <button
          onClick={() => handleCopy(generateFullExportText(), 'all-content')}
          className="relative flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
        >
          <DocumentDuplicateIcon className="w-4 h-4" />
          <span>{t('copyAllButton')}</span>
          {copiedId === 'all-content' && <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 text-xs bg-black text-white px-2 py-1 rounded">{t('copiedTooltip')}</span>}
        </button>
      </div>
      <div className="p-3 bg-gray-100 dark:bg-gray-900/50 rounded-lg max-h-80 overflow-y-auto text-sm">
        <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">{generateFullExportText()}</p>
      </div>
    </div>
  );

  const TabButton = ({ tab, label }: {tab: 'bibliography' | 'export', label: string}) => (
     <button
        onClick={() => setActiveTab(tab)}
        className={`flex-1 py-3 px-1 text-center font-semibold border-b-2 transition-colors ${activeTab === tab ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}
    >
      {label}
    </button>
  );

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center animate-fade-in-fast"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-title"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl m-4 flex flex-col"
        onClick={(e) => e.stopPropagation()}
        dir={dir}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 id="export-title" className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t('exportModalTitle')}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex items-center border-b border-gray-200 dark:border-gray-700 flex-shrink-0 text-sm">
          <TabButton tab="bibliography" label={t('bibliographyTab')} />
          <TabButton tab="export" label={t('exportContentTab')} />
        </div>

        <div className="overflow-y-auto p-6 flex-grow" style={{maxHeight: 'calc(80vh - 150px)'}}>
            {activeTab === 'bibliography' ? renderBibliography() : renderExportContent()}
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
