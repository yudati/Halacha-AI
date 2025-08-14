
import React from 'react';
import { BookIcon, BookmarkIcon, CogIcon, CalendarDaysIcon } from './Icon';
import { useLanguage } from '../contexts/LanguageContext';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenLibrary: () => void;
  onOpenMyBooks: () => void;
  onOpenCalendar: () => void;
  headingClass: string;
  subtitle: string;
}

function Header({ onOpenSettings, onOpenLibrary, onOpenMyBooks, onOpenCalendar, headingClass, subtitle }: HeaderProps) {
  const { t } = useLanguage();

  const iconButtonClass = "p-2 rounded-full text-gray-600 dark:text-gray-300 hover:text-primary-500 dark:hover:text-primary-300 hover:bg-primary-500/10 dark:hover:bg-primary-500/10 transition-colors";

  return (
    <header className="mb-8">
      <div className="flex justify-end items-center gap-2 mb-4 h-12">
        <button
          onClick={onOpenCalendar}
          className={iconButtonClass}
          aria-label={t('calendarModalTitle')}
          title={t('calendarButtonTooltip')}
        >
          <CalendarDaysIcon className="w-6 h-6" />
        </button>
        
        <button
          onClick={onOpenLibrary}
          className={iconButtonClass}
          aria-label={t('libraryTitle')}
        >
          <BookmarkIcon className="w-6 h-6" />
        </button>
        
        <button
          onClick={onOpenMyBooks}
          className={iconButtonClass}
          aria-label={t('myBooksModalTitle')}
        >
          <BookIcon className="w-6 h-6" />
        </button>

        <button
          onClick={onOpenSettings}
          className={iconButtonClass}
          aria-label={t('settingsTitle')}
        >
          <CogIcon className="w-6 h-6" />
        </button>
      </div>

      <div className="text-center">
        <h1 className={`text-5xl sm:text-7xl font-extrabold text-gray-900 dark:text-white drop-shadow-lg ${headingClass} tracking-tight`}>
          {t('appTitle')}
        </h1>
        <p className="mt-3 text-md sm:text-lg text-primary-600 dark:text-primary-400 h-7">
          {subtitle}
        </p>
      </div>
    </header>
  );
}

export default Header;
