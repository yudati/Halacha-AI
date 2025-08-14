import React, { useState, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useUserLibrary } from '../contexts/UserLibraryContext';
import { CloseIcon, TrashIcon } from './Icon';

interface MyBooksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MyBooksModal: React.FC<MyBooksModalProps> = ({ isOpen, onClose }) => {
  const { t, dir } = useLanguage();
  const { customBooks, addCustomBook, removeCustomBook } = useUserLibrary();

  const [newBookName, setNewBookName] = useState('');
  const [newBookFile, setNewBookFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'reading'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newBookUrl, setNewBookUrl] = useState('');
  const [urlUploadStatus, setUrlUploadStatus] = useState<'idle' | 'fetching'>('idle');


  const handleCustomBookUpload = async () => {
    if (!newBookFile || !newBookName.trim() || uploadStatus !== 'idle') return;

    try {
        setUploadStatus('reading');
        const bookContent = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target?.result as string);
            reader.onerror = (err) => reject(err);
            reader.readAsText(newBookFile);
        });
        
        addCustomBook(newBookName.trim(), bookContent);
        
        setNewBookName('');
        setNewBookFile(null);
        if(fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        alert(t('bookAddedSuccess'));

    } catch(e: any) {
        console.error("Upload Error:", e);
        if (e.message === 'LOCAL_STORAGE_FULL') {
            alert(t('errorStorageFull'));
        } else {
            alert(t('errorReadingFile'));
        }
    } finally {
        setUploadStatus('idle');
    }
  };
  
  const handleCustomBookFromUrl = async () => {
    if (!newBookUrl.trim() || !newBookName.trim() || urlUploadStatus !== 'idle') return;

    try {
        new URL(newBookUrl);
    } catch (_) {
        alert(t('errorInvalidUrl'));
        return;
    }

    setUrlUploadStatus('fetching');
    try {
        const response = await fetch(newBookUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const bookContent = await response.text();
        addCustomBook(newBookName.trim(), bookContent);

        setNewBookName('');
        setNewBookUrl('');
        alert(t('bookAddedFromUrlSuccess'));

    } catch (e: any) {
        console.error("Fetch Error:", e);
        if (e.message === 'LOCAL_STORAGE_FULL') {
            alert(t('errorStorageFull'));
        } else {
            alert(t('errorFetchingBook'));
        }
    } finally {
        setUrlUploadStatus('idle');
    }
  };

  const handleRemoveCustomBook = (id: string) => {
      if (window.confirm(t('confirmDeleteBook'))) {
          removeCustomBook(id);
      }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center animate-fade-in-fast"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="my-books-title"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md m-4 flex flex-col"
        onClick={(e) => e.stopPropagation()}
        dir={dir}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <h2 id="my-books-title" className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            {t('myBooksModalTitle')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700/50 transition-colors"
            aria-label="Close my books"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 flex-grow" style={{maxHeight: 'calc(80vh - 150px)'}}>
          <div className="space-y-6">
            
             {/* Shared Name Input */}
            <div>
              <label htmlFor="custom-book-name-modal" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('customBookNameLabel')}
              </label>
              <input
                type="text"
                id="custom-book-name-modal"
                value={newBookName}
                onChange={e => setNewBookName(e.target.value)}
                placeholder={t('customBookNamePlaceholder')}
                className="mt-1 w-full p-2 border border-gray-300 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-500"
              />
            </div>

            {/* Upload from File Section */}
            <div className="p-4 bg-gray-100 dark:bg-gray-900/50 rounded-lg space-y-3">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200">{t('uploadBookLabel')}</h3>
               <p className="text-xs text-gray-500 dark:text-gray-400">{t('uploadInstructions')}</p>
              <input
                type="file"
                id="custom-book-file-modal"
                ref={fileInputRef}
                accept=".txt"
                onChange={e => e.target.files && setNewBookFile(e.target.files[0])}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:text-gray-400 dark:file:bg-blue-900/50 dark:file:text-blue-300 dark:hover:file:bg-blue-900"
              />
              <button onClick={handleCustomBookUpload} disabled={!newBookFile || !newBookName.trim() || uploadStatus !== 'idle'} className="w-full flex justify-center items-center gap-2 text-center py-2 px-4 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed">
                {uploadStatus === 'reading' ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{t('loadingMoreButton')}</span>
                  </>
                ) : (
                  t('uploadButton')
                )}
              </button>
            </div>
            
            {/* Add from URL Section */}
            <div className="p-4 bg-gray-100 dark:bg-gray-900/50 rounded-lg space-y-3">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200">{t('addFromUrlTitle')}</h3>
              <label htmlFor="custom-book-url-modal" className="sr-only">
                {t('bookUrlLabel')}
              </label>
              <input
                type="url"
                id="custom-book-url-modal"
                value={newBookUrl}
                onChange={e => setNewBookUrl(e.target.value)}
                placeholder={t('bookUrlPlaceholder')}
                className="w-full p-2 border border-gray-300 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-500"
              />
               <button onClick={handleCustomBookFromUrl} disabled={!newBookUrl.trim() || !newBookName.trim() || urlUploadStatus !== 'idle'} className="w-full flex justify-center items-center gap-2 text-center py-2 px-4 rounded-lg font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed">
                {urlUploadStatus === 'fetching' ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{t('addingBook')}</span>
                  </>
                ) : (
                  t('addBookButton')
                )}
              </button>
            </div>

            {/* List of Custom Books */}
            <div className="pt-2">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">{t('customBooksTitle')}</h3>
                 <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                    {customBooks.length > 0 ? customBooks.map(book => (
                        <div key={book.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md">
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{book.name}</span>
                        <button onClick={() => handleRemoveCustomBook(book.id)} aria-label={`Delete ${book.name}`}>
                            <TrashIcon className="w-5 h-5 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"/>
                        </button>
                        </div>
                    )) : (
                        <p className="text-sm text-center text-gray-500 dark:text-gray-400 py-4">{t('noCustomBooks')}</p>
                    )}
                </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default MyBooksModal;