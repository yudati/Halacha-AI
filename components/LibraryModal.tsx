
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { useUserLibrary, HistoryItem, RabbiChatSession } from '../contexts/UserLibraryContext';
import { CloseIcon, HistoryIcon, TrashIcon, ExpandIcon, HeartIcon, ChatBubbleLeftIcon } from './Icon';
import { HalachicSource } from '../services/geminiService';

interface LibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadSearch: (item: HistoryItem) => void;
  onViewSource: (source: HalachicSource) => void;
  onLoadRabbiChat: (sessionId: string) => void;
}

type ActiveTab = 'history' | 'loved' | 'rabbi';

const LibraryModal: React.FC<LibraryModalProps> = ({ isOpen, onClose, onLoadSearch, onViewSource, onLoadRabbiChat }) => {
  const { t, dir, language } = useLanguage();
  const { history, lovedSources, rabbiChatSessions, removeHistoryItem, removeLovedSource, removeRabbiChatSession } = useUserLibrary();
  const [activeTab, setActiveTab] = useState<ActiveTab>('history');

  const handleDelete = (id: string, type: ActiveTab) => {
       if(window.confirm(t('deleteConfirmation'))) {
          if (type === 'history') removeHistoryItem(id);
          else if (type === 'loved') removeLovedSource(id);
          else if (type === 'rabbi') removeRabbiChatSession(id);
      }
  };
  
  const bookCategories: {category: string, books: {value: string, label: string}[]}[] = t('bookCategories');

  const findBookLabel = (bookValue: string): string => {
      for (const category of bookCategories) {
          for (const book of category.books) {
              if (book.value === bookValue) {
                  return book.label;
              }
          }
      }
      return bookValue;
  };

  const renderItem = (item: any, type: ActiveTab) => {
    let title: string, subtitle: string, loadIcon: React.ReactNode, loadAction: () => void;
    let ariaLabel = '';

    switch(type) {
        case 'loved':
            title = item.source;
            const cleanQuote = item.quote.replace(/<[^>]+>/g, '');
            subtitle = cleanQuote.substring(0, 50) + (cleanQuote.length > 50 ? '...' : '');
            loadIcon = <ExpandIcon className="w-5 h-5" />;
            loadAction = () => onViewSource(item);
            ariaLabel = t('viewSource');
            break;
        case 'rabbi':
            title = item.title;
            subtitle = new Date(item.timestamp).toLocaleDateString(language, { day: 'numeric', month: 'long', year: 'numeric' });
            loadIcon = <ChatBubbleLeftIcon className="w-5 h-5" />;
            loadAction = () => onLoadRabbiChat(item.id);
            ariaLabel = t('loadChat');
            break;
        case 'history':
        default:
            title = item.query;
            const bookLabel = findBookLabel(item.book);
            const dateString = new Date(item.timestamp).toLocaleDateString(language, { day: 'numeric', month: 'long' });
            subtitle = `${bookLabel} • ${dateString}`;
            loadIcon = <HistoryIcon className="w-5 h-5" />;
            loadAction = () => onLoadSearch(item);
            ariaLabel = t('loadSearch');
            break;
    }

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        className="p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg flex items-center justify-between gap-4"
      >
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 dark:text-gray-200 truncate">{title}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{subtitle}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={loadAction} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/50 rounded-full transition-colors" aria-label={ariaLabel}>
            {loadIcon}
          </button>
          <button onClick={() => handleDelete(item.id, type)} className="p-2 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full transition-colors" aria-label={t('deleteItem')}>
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    );
  };

  const TabButton = ({ tab, label, count }: {tab: ActiveTab, label: string, count: number}) => (
    <button onClick={() => setActiveTab(tab)} className={`relative flex-1 py-3 px-1 text-center font-semibold transition-colors text-sm sm:text-base ${activeTab === tab ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400 hover:text-primary-500/80 dark:hover:text-primary-400/80'}`}>
      {label} ({count})
      {activeTab === tab && <motion.div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" layoutId="libraryTab" />}
    </button>
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
          aria-labelledby="library-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-lg m-4 flex flex-col h-[70vh]"
            onClick={(e) => e.stopPropagation()}
            dir={dir}
          >
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700/50 flex-shrink-0">
              <h2 id="library-title" className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                {t('libraryTitle')}
              </h2>
              <button onClick={onClose} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors" aria-label="Close library">
                <CloseIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex items-center border-b border-gray-200 dark:border-gray-700/50 flex-shrink-0">
              <TabButton tab="history" label={t('historyTab')} count={history.length} />
              <TabButton tab="loved" label={t('lovedSourcesTab')} count={lovedSources.length} />
              <TabButton tab="rabbi" label={t('rabbiChatsTab')} count={rabbiChatSessions.length} />
            </div>

            <div className="overflow-y-auto p-4 flex-1">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                  >
                      {activeTab === 'history' && (history.length === 0 ? <p className="text-center text-gray-500 dark:text-gray-400 py-8">{t('emptyHistory')}</p> : history.map(item => renderItem(item, 'history')))}
                      {activeTab === 'loved' && (lovedSources.length === 0 ? <p className="text-center text-gray-500 dark:text-gray-400 py-8">{t('emptyLoved')}</p> : lovedSources.map(item => renderItem(item, 'loved')))}
                      {activeTab === 'rabbi' && (rabbiChatSessions.length === 0 ? <p className="text-center text-gray-500 dark:text-gray-400 py-8">{t('emptyRabbiChats')}</p> : rabbiChatSessions.map(item => renderItem(item, 'rabbi')))}
                  </motion.div>
                </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LibraryModal;
