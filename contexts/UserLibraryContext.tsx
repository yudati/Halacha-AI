

import React, { createContext, useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { HalachicSource, CustomBook, ChatMessage } from '../services/geminiService';

const MAX_HISTORY_ITEMS = 50;

export interface HistoryItem {
    id: string;
    query: string;
    book: string;
    limit: string;
    timestamp: number;
}

export interface RabbiChatSession {
    id: string;
    title: string;
    timestamp: number;
    chatHistory: ChatMessage[];
}

export type { CustomBook };

interface UserLibraryContextType {
    history: HistoryItem[];
    lovedSources: HalachicSource[];
    customBooks: CustomBook[];
    rabbiChatSessions: RabbiChatSession[];
    addSearchToHistory: (search: Omit<HistoryItem, 'id' | 'timestamp'>) => void;
    removeHistoryItem: (id: string) => void;
    addLovedSource: (source: HalachicSource) => void;
    removeLovedSource: (sourceId: string) => void;
    isSourceLoved: (sourceId: string) => boolean;
    addCustomBook: (name: string, content: string) => void;
    removeCustomBook: (id: string) => void;
    startNewRabbiChatSession: (title: string) => string;
    addMessagesToRabbiChat: (sessionId: string, messages: ChatMessage[]) => void;
    updateRabbiChatMessage: (sessionId: string, messageId: string, updatedMessage: Partial<ChatMessage>) => void;
    removeRabbiChatSession: (sessionId: string) => void;
}

const UserLibraryContext = createContext<UserLibraryContextType | undefined>(undefined);

const historyKey = 'user-library-history';
const lovedSourcesKey = 'user-library-loved';
const customBooksKey = 'user-library-custom-books';
const rabbiChatsKey = 'user-library-rabbi-chats';

const getInitialState = <T,>(key: string, defaultValue: T): T => {
    if (typeof window === 'undefined') {
        return defaultValue;
    }
    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.warn(`Error reading ${key} from localStorage`, error);
        return defaultValue;
    }
};

export const UserLibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [history, setHistory] = useState<HistoryItem[]>(() => getInitialState(historyKey, []));
    const [lovedSources, setLovedSources] = useState<HalachicSource[]>(() => getInitialState(lovedSourcesKey, []));
    const [customBooks, setCustomBooks] = useState<CustomBook[]>(() => getInitialState(customBooksKey, []));
    const [rabbiChatSessions, setRabbiChatSessions] = useState<RabbiChatSession[]>(() => getInitialState(rabbiChatsKey, []));
    
    useEffect(() => {
        try {
            window.localStorage.setItem(historyKey, JSON.stringify(history));
        } catch (e) {
            console.warn("Could not save history to localStorage.", e);
        }
    }, [history]);

    useEffect(() => {
        try {
            window.localStorage.setItem(lovedSourcesKey, JSON.stringify(lovedSources));
        } catch (e) {
            console.warn("Could not save loved sources to localStorage.", e);
        }
    }, [lovedSources]);
    
    useEffect(() => {
        try {
            window.localStorage.setItem(customBooksKey, JSON.stringify(customBooks));
        } catch (e) {
             console.warn("Could not save custom books to localStorage.", e);
        }
    }, [customBooks]);
    
    useEffect(() => {
        try {
            window.localStorage.setItem(rabbiChatsKey, JSON.stringify(rabbiChatSessions));
        } catch (e) {
            console.warn("Could not save rabbi chats to localStorage.", e);
        }
    }, [rabbiChatSessions]);

    const addSearchToHistory = useCallback((search: Omit<HistoryItem, 'id' | 'timestamp'>) => {
        setHistory(prev => {
            const newHistoryItem: HistoryItem = { ...search, id: crypto.randomUUID(), timestamp: Date.now() };
            // Prevent duplicate consecutive searches from cluttering history
            const isDuplicate = prev.length > 0 && prev[0].query === newHistoryItem.query && prev[0].book === newHistoryItem.book;
            if (isDuplicate) return prev;
            
            const updatedHistory = [newHistoryItem, ...prev];
            return updatedHistory.slice(0, MAX_HISTORY_ITEMS);
        });
    }, []);
    
    const removeHistoryItem = useCallback((id: string) => {
        setHistory(prevHistory => prevHistory.filter(item => item.id !== id));
    }, []);

    const addLovedSource = useCallback((source: HalachicSource) => {
        setLovedSources(prev => [source, ...prev.filter(s => s.id !== source.id)]);
    }, []);

    const removeLovedSource = useCallback((sourceId: string) => {
        setLovedSources(prevSources => prevSources.filter(s => s.id !== sourceId));
    }, []);

    const isSourceLoved = useCallback((sourceId: string): boolean => {
        return lovedSources.some(s => s.id === sourceId);
    }, [lovedSources]);

    const addCustomBook = useCallback((name: string, content: string) => {
        const newBook: CustomBook = { id: crypto.randomUUID(), name, content };
        setCustomBooks(prev => {
            const updatedBooks = [newBook, ...prev];
            try {
                window.localStorage.setItem(customBooksKey, JSON.stringify(updatedBooks));
            } catch (e) {
                console.error("Failed to add book, likely due to storage quota.", e);
                if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
                     throw new Error("LOCAL_STORAGE_FULL");
                }
                throw e; 
            }
            return updatedBooks;
        });
    }, []);

    const removeCustomBook = useCallback((id: string) => {
        setCustomBooks(prev => prev.filter(book => book.id !== id));
    }, []);
    
    // ----- Rabbi Chat Session Management -----
    const startNewRabbiChatSession = useCallback((title: string): string => {
        const newSession: RabbiChatSession = {
            id: crypto.randomUUID(),
            title: title,
            timestamp: Date.now(),
            chatHistory: [],
        };
        setRabbiChatSessions(prev => [newSession, ...prev]);
        return newSession.id;
    }, []);

    const addMessagesToRabbiChat = useCallback((sessionId: string, messages: ChatMessage[]) => {
        setRabbiChatSessions(prev => prev.map(session =>
            session.id === sessionId
                ? { ...session, chatHistory: [...messages, ...session.chatHistory] }
                : session
        ));
    }, []);

    const updateRabbiChatMessage = useCallback((sessionId: string, messageId: string, updatedMessage: Partial<ChatMessage>) => {
        setRabbiChatSessions(prev => prev.map(session => {
            if (session.id !== sessionId) return session;
            const updatedHistory = session.chatHistory.map(msg =>
                msg.id === messageId ? { ...msg, ...updatedMessage } : msg
            );
            return { ...session, chatHistory: updatedHistory };
        }));
    }, []);

    const removeRabbiChatSession = useCallback((sessionId: string) => {
        setRabbiChatSessions(prev => prev.filter(session => session.id !== sessionId));
    }, []);


    const value = useMemo(() => ({
        history,
        lovedSources,
        customBooks,
        rabbiChatSessions,
        addSearchToHistory,
        removeHistoryItem,
        addLovedSource,
        removeLovedSource,
        isSourceLoved,
        addCustomBook,
        removeCustomBook,
        startNewRabbiChatSession,
        addMessagesToRabbiChat,
        updateRabbiChatMessage,
        removeRabbiChatSession,
    }), [history, lovedSources, customBooks, rabbiChatSessions, addSearchToHistory, removeHistoryItem, addLovedSource, removeLovedSource, isSourceLoved, addCustomBook, removeCustomBook, startNewRabbiChatSession, addMessagesToRabbiChat, updateRabbiChatMessage, removeRabbiChatSession]);

    return (
        <UserLibraryContext.Provider value={value}>
            {children}
        </UserLibraryContext.Provider>
    );
};

export const useUserLibrary = (): UserLibraryContextType => {
    const context = useContext(UserLibraryContext);
    if (context === undefined) {
        throw new Error('useUserLibrary must be used within a UserLibraryProvider');
    }
    return context;
};
