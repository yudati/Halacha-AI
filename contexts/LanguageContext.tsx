import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { translations } from '../i18n/translations';

export type Language = 'he'; // Hardcoded to Hebrew
type Translations = typeof translations.he;

interface LanguageContextType {
  language: Language;
  t: (key: keyof Translations, fallback?: string) => any;
  dir: 'rtl';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const language: Language = 'he';
  const dir: 'rtl' = 'rtl';

  const t = useCallback((key: keyof Translations, fallback: string = '') => {
    return translations[language][key] || fallback || key;
  }, [language]);
  
  const value = useMemo(() => ({ language, t, dir }), [language, t, dir]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};