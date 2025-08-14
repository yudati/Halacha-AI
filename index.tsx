import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { LanguageProvider } from './contexts/LanguageContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { UserLibraryProvider } from './contexts/UserLibraryContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <SettingsProvider>
      <LanguageProvider>
        <UserLibraryProvider>
          <App />
        </UserLibraryProvider>
      </LanguageProvider>
    </SettingsProvider>
  </React.StrictMode>
);