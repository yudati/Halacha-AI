import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { BookIcon } from './Icon';
import { useUserLibrary, CustomBook } from '../contexts/UserLibraryContext';


interface Book {
  value: string;
  label: string;
}

interface BookCategory {
  category: string;
  books: Book[];
}

interface SearchOptionsProps {
  categories: BookCategory[];
  packagedBooks: CustomBook[];
  selectedBook: string;
  setSelectedBook: (book: string) => void;
  isLoading: boolean;
}

function SearchOptions({ categories, packagedBooks, selectedBook, setSelectedBook, isLoading }: SearchOptionsProps) {
  const { t } = useLanguage();
  const { customBooks } = useUserLibrary();

  return (
    <div className="w-full">
      <label htmlFor="book-select" className="flex items-center gap-2 text-sm font-medium text-primary-600 dark:text-primary-400 mb-1">
        <BookIcon className="w-4 h-4" />
        {t('searchInBookLabel')}
      </label>
      <select
        id="book-select"
        value={selectedBook}
        onChange={(e) => setSelectedBook(e.target.value)}
        disabled={isLoading}
        className="w-full p-3 bg-white/50 dark:bg-gray-800/20 text-gray-900 dark:text-white rounded-xl border border-gray-300 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
      >
        {categories.map(category => (
          <optgroup key={category.category} label={category.category} className="bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-300 font-bold">
            {category.books.map(book => (
              <option key={book.value} value={book.value} className="bg-white dark:bg-gray-800 font-normal">
                {book.label}
              </option>
            ))}
          </optgroup>
        ))}
        {packagedBooks.length > 0 && (
          <optgroup label={t('packagedBookCategory')} className="bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-300 font-bold">
            {packagedBooks.map(book => (
              <option key={book.id} value={`packaged:${book.id}`} className="bg-white dark:bg-gray-800 font-normal">
                {book.name}
              </option>
            ))}
          </optgroup>
        )}
        {customBooks.length > 0 && (
          <optgroup label={t('customBookCategory')} className="bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-300 font-bold">
            {customBooks.map(book => (
              <option key={book.id} value={`custom:${book.id}`} className="bg-white dark:bg-gray-800 font-normal">
                {book.name}
              </option>
            ))}
          </optgroup>
        )}
      </select>
    </div>
  );
}

export default SearchOptions;