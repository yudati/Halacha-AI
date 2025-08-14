
import React, { createContext, useState, useEffect, useContext, useMemo, useCallback } from 'react';

// Define the shape of our settings
export type TextSize = 'sm' | 'base' | 'lg';
export type Theme = 'light' | 'dark';
export type Font = 'sans' | 'serif' | 'mono';
export type SearchMode = 'precise' | 'advanced' | 'broad';
export type SearchProvider = 'sefaria' | 'google' | 'rabbi-chat';

export interface SettingsState {
  theme: Theme;
  font: Font; // Body font
  headingFont: Font;
  textSize: TextSize;
  primaryColor: string;
  defaultSearchBook: string;
  defaultResultLimit: string;
  searchMode: SearchMode;
  defaultSearchProvider: SearchProvider;
}

// ---- DYNAMIC THEME DATA ----
export const primaryColors = [
    { name: 'cyan', a11yName: 'Cyan', hex: '#06b6d4' },
    { name: 'rose', a11yName: 'Rose', hex: '#f43f5e' },
    { name: 'emerald', a11yName: 'Emerald', hex: '#10b981' },
    { name: 'amber', a11yName: 'Amber', hex: '#f59e0b' },
    { name: 'violet', a11yName: 'Violet', hex: '#8b5cf6' },
] as const;

export const colorPalettes: Record<string, Record<number, string>> = {
  cyan: {50:"180 86% 96%",100:"180 84% 91%",200:"180 85% 81%",300:"180 83% 70%",400:"180 82% 59%",500:"180 85% 47%",600:"180 75% 40%",700:"180 71% 34%",800:"180 65% 28%",900:"180 62% 23%",950:"180 70% 15%"},
  rose: {50:"347 100% 97%",100:"347 100% 94%",200:"347 95% 88%",300:"347 92% 79%",400:"346 89% 68%",500:"347 89% 61%",600:"347 80% 51%",700:"347 77% 42%",800:"347 72% 35%",900:"347 67% 30%",950:"347 73% 18%"},
  emerald: {50:"145 74% 95%",100:"145 70% 89%",200:"145 66% 79%",300:"145 59% 67%",400:"145 56% 54%",500:"145 63% 42%",600:"145 75% 33%",700:"145 77% 27%",800:"145 75% 22%",900:"145 73% 18%",950:"145 81% 11%"},
  amber: {50:"45 100% 95%",100:"45 96% 89%",200:"45 95% 78%",300:"45 95% 67%",400:"45 94% 57%",500:"45 93% 47%",600:"45 90% 40%",700:"45 83% 32%",800:"45 78% 26%",900:"45 73% 22%",950:"45 81% 13%"},
  violet: {50:"257 95% 96%",100:"257 100% 93%",200:"258 100% 88%",300:"259 98% 81%",400:"260 95% 72%",500:"262 91% 65%",600:"262 82% 56%",700:"263 74% 47%",800:"264 69% 39%",900:"264 63% 33%",950:"265 67% 21%"}
};


// Define the shape of our context
interface SettingsContextType {
  settings: SettingsState;
  setSetting: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void;
  resetSettings: () => void;
}

// Default settings
const defaultSettings: SettingsState = {
  theme: 'dark',
  font: 'sans',
  headingFont: 'serif',
  textSize: 'base',
  primaryColor: 'cyan',
  defaultSearchBook: 'All',
  defaultResultLimit: 'unlimited',
  searchMode: 'precise',
  defaultSearchProvider: 'sefaria',
};

// Create the context
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Helper to get settings from localStorage
const getInitialState = (): SettingsState => {
  if (typeof window === 'undefined') {
    return defaultSettings;
  }
  try {
    const item = window.localStorage.getItem('app-settings');
    const savedSettings = item ? JSON.parse(item) : {};
    
    // BACKWARD COMPATIBILITY
    // Map old `useAdvancedSearch` to new `searchMode`
    if (typeof savedSettings.useAdvancedSearch !== 'undefined') {
      savedSettings.searchMode = savedSettings.useAdvancedSearch ? 'advanced' : 'precise';
      delete savedSettings.useAdvancedSearch;
    }
    // Map `fontSize` to `textSize`
    if (savedSettings.fontSize && !savedSettings.textSize) {
        savedSettings.textSize = savedSettings.fontSize;
        delete savedSettings.fontSize;
    }
    // Remove deprecated halachicPreference
    if ('halachicPreference' in savedSettings) {
      delete savedSettings.halachicPreference;
    }
    
    return { ...defaultSettings, ...savedSettings };
  } catch (error) {
    console.warn('Error reading settings from localStorage', error);
    return defaultSettings;
  }
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SettingsState>(getInitialState);

  // Persist settings to localStorage whenever they change
  useEffect(() => {
    try {
      window.localStorage.setItem('app-settings', JSON.stringify(settings));
    } catch (error) {
      console.warn('Error saving settings to localStorage', error);
    }
  }, [settings]);

  // Function to update a specific setting
  const setSetting = useCallback(<K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Function to reset all settings to default
  const resetSettings = useCallback(() => {
    if (typeof window !== 'undefined') {
        const keysToRemove: string[] = [];
        for (let i = 0; i < window.localStorage.length; i++) {
            const key = window.localStorage.key(i);
            // Remove app settings and all library data (history, loved, books)
            if (key && (key.startsWith('user-library-') || key === 'app-settings')) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => window.localStorage.removeItem(key));
    }
    setSettings(defaultSettings);
  }, []);
  
  const value = useMemo(() => ({ settings, setSetting, resetSettings }), [settings, setSetting, resetSettings]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

// Custom hook to use the settings context
export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
