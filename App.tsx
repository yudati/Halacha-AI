




import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import ResultCard from './components/ResultCard';
import ProgressBar from './components/ProgressBar';
import SearchOptions from './components/SearchOptions';
import ResultLimitOptions from './components/ResultLimitOptions';
import Disclaimer from './components/Disclaimer';
import { getHalachicResponse, HalachicSource, CustomBook, Dispute, AdvancedAnalysisData, QuestionType, getHalachicResponseFromCustomBook, getAdvancedAnalysis, HalachicResponse, AdvancedHalachicResponse, getFollowUpAnswer, GoogleGroundedResult, getGoogleGroundedResponse, createRabbiChatSession, ChatMessage } from './services/geminiService';
import { NetworkIcon, DocumentDuplicateIcon, ChatBubbleLeftIcon } from './components/Icon';
import { useLanguage } from './contexts/LanguageContext';
import { useSettings, colorPalettes, SearchProvider } from './contexts/SettingsContext';
import SettingsModal from './components/SettingsModal';
import MyBooksModal from './components/MyBooksModal';
import LibraryModal from './components/LibraryModal';
import { useUserLibrary, HistoryItem, RabbiChatSession } from './contexts/UserLibraryContext';
import SourceViewerModal from './components/SourceViewerModal';
import FollowUpQuestions from './components/FollowUpQuestions';
import AiSummaryCard from './components/AiSummaryCard';
import { PACKAGED_BOOKS_DATA } from './data/packagedBooks';
import DisputeCard from './components/DisputeCard';
import AdvancedAnalysisModal from './components/AdvancedAnalysisModal';
import QuestionTypeBadge from './components/QuestionTypeBadge';
import ExportModal from './components/ExportModal';
import WelcomeScreen from './components/WelcomeScreen';
import SearchProviderToggle from './components/SearchProviderToggle';
import GoogleResultCard from './components/GoogleResultCard';
import RabbiChatMessage from './components/RabbiChatMessage';
import { Chat } from '@google/genai';
import HebrewCalendarModal from './components/HebrewCalendarModal';

const welcomeContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.2,
      staggerChildren: 0.1,
    },
  },
};

const welcomeItemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 100 },
  },
};

function App() {
  const { t, language } = useLanguage();
  const { settings } = useSettings();
  const { addSearchToHistory, addLovedSource, removeLovedSource, isSourceLoved, customBooks, rabbiChatSessions, startNewRabbiChatSession, addMessagesToRabbiChat, updateRabbiChatMessage } = useUserLibrary();
  
  const [query, setQuery] = useState<string>('');
  const [lastSuccessfulQuery, setLastSuccessfulQuery] = useState<string>('');
  const [selectedBook, setSelectedBook] = useState<string>(() => settings.defaultSearchBook);
  const [resultLimit, setResultLimit] = useState<string>(() => settings.defaultResultLimit);
  const [results, setResults] = useState<HalachicSource[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMyBooksOpen, setIsMyBooksOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isSourceViewerOpen, setIsSourceViewerOpen] = useState(false);
  const [sourceToView, setSourceToView] = useState<HalachicSource | null>(null);
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [packagedBooks, setPackagedBooks] = useState<CustomBook[]>([]);
  const [disputeResults, setDisputeResults] = useState<Dispute[] | null>(null);
  const [overallSummary, setOverallSummary] = useState<string>('');
  
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState<AdvancedAnalysisData | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const [questionType, setQuestionType] = useState<QuestionType | null>(null);
  
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  
  const [followUpAnswers, setFollowUpAnswers] = useState<Record<string, { answer: string; isLoading: boolean }>>({});

  const [searchProvider, setSearchProvider] = useState<SearchProvider>(() => settings.defaultSearchProvider);
  const [googleResult, setGoogleResult] = useState<GoogleGroundedResult | null>(null);

  // State for Rabbi Chat
  const [activeRabbiChatSessionId, setActiveRabbiChatSessionId] = useState<string | null>(null);
  const [rabbiChatSession, setRabbiChatSession] = useState<Chat | null>(null);
  const [isRabbiTyping, setIsRabbiTyping] = useState<boolean>(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  const activeChatHistory = useMemo(() => {
    if (!activeRabbiChatSessionId) return [];
    const session = rabbiChatSessions.find(s => s.id === activeRabbiChatSessionId);
    return session?.chatHistory || [];
  }, [activeRabbiChatSessionId, rabbiChatSessions]);


  useEffect(() => {
    // Scroll to top when new rabbi chat messages are added
    if (searchProvider === 'rabbi-chat' && activeChatHistory.length > 0) {
      chatContainerRef.current?.scrollTo(0, 0);
    }
  }, [activeChatHistory, searchProvider]);


  const bookCategories = t('bookCategories');
  const limitOptions = t('limitOptions');
  
  useEffect(() => {
    setPackagedBooks(PACKAGED_BOOKS_DATA);
  }, []);

  // Clear active chat session if user switches away from rabbi chat
  useEffect(() => {
    if (searchProvider !== 'rabbi-chat') {
        setActiveRabbiChatSessionId(null);
        setRabbiChatSession(null);
    }
  }, [searchProvider]);
  
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(settings.theme);

    const colorPalette = colorPalettes[settings.primaryColor] || colorPalettes.cyan;
    Object.entries(colorPalette).forEach(([shade, hslValue]) => {
      root.style.setProperty(`--color-primary-${shade}`, hslValue);
    });

  }, [settings.theme, settings.primaryColor]);

  useEffect(() => {
    setSelectedBook(settings.defaultSearchBook);
    setResultLimit(settings.defaultResultLimit);
    setSearchProvider(settings.defaultSearchProvider);
  }, [settings.defaultSearchBook, settings.defaultResultLimit, settings.defaultSearchProvider]);

  const resetSearchState = () => {
    setIsLoading(true);
    setError(null);
    setResults(null);
    setDisputeResults(null);
    setGoogleResult(null);
    setAiSummary('');
    setOverallSummary('');
    setFollowUpQuestions([]);
    setQuestionType(null);
    setAnalysisData(null);
    setIsLoadingMore(false);
    setFollowUpAnswers({});
  };

  const handleSearch = useCallback(async (searchParams?: {query: string, book: string, limit: string, provider: SearchProvider}) => {
    const currentQuery = searchParams?.query ?? query;
    const currentBook = searchParams?.book ?? selectedBook;
    const currentLimit = searchParams?.limit ?? resultLimit;
    const currentProvider = searchParams?.provider ?? searchProvider;

    if (!currentQuery.trim()) {
      setError(t('errorRequiredQuery'));
      return;
    }

    resetSearchState();
    
    addSearchToHistory({
      query: currentQuery,
      book: currentProvider === 'sefaria' ? currentBook : 'Google',
      limit: currentLimit
    });
    setLastSuccessfulQuery(currentQuery);

    try {
      if (currentProvider === 'google') {
        const response = await getGoogleGroundedResponse(currentQuery, language);
        setGoogleResult(response);
        // For now, Google search won't return follow-up questions or question type.
        setFollowUpQuestions([]);
        setQuestionType(null);
      } else { // Sefaria provider
        const isCustom = currentBook.startsWith('custom:');
        const isPackaged = currentBook.startsWith('packaged:');

        // Custom/Packaged books use a non-streaming method
        if (isCustom || isPackaged) {
            const bookId = currentBook.replace(isCustom ? 'custom:' : 'packaged:', '');
            const bookToSearch = isCustom
              ? customBooks.find(b => b.id === bookId)
              : packagedBooks.find(b => b.id === bookId);
            
            if (!bookToSearch) throw new Error("Book not found");
            
            const response = await getHalachicResponseFromCustomBook(currentQuery, bookToSearch, currentLimit, language, () => {});
            if (response.sources.length === 0) {
                setError(t('errorNoSourcesInCustomBook'));
            } else {
                setResults(response.sources);
            }
            setAiSummary(response.aiSummary);
            setFollowUpQuestions(response.followUpQuestions);
            setQuestionType(response.questionType);
            setIsLoading(false);
            return;
        }

        // Main Sefaria search now uses the new non-streaming method
        const response = await getHalachicResponse(currentQuery, currentBook, currentLimit, language, settings.searchMode);
        
        const isAdvancedResponse = (res: HalachicResponse | AdvancedHalachicResponse): res is AdvancedHalachicResponse => 'disputes' in res;

        if(settings.searchMode === 'advanced' && isAdvancedResponse(response)) {
          setDisputeResults(response.disputes);
          setOverallSummary(response.overallSummary);
        } else if (!isAdvancedResponse(response)) {
          setResults(response.sources);
          setAiSummary(response.aiSummary);
        } else {
          // Handle case where advanced mode was expected but not received
          setError(t('errorApi')); 
        }

        setFollowUpQuestions(response.followUpQuestions);
        setQuestionType(response.questionType);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || t('errorApi'));
    } finally {
      setIsLoading(false);
    }
  }, [query, selectedBook, resultLimit, language, t, addSearchToHistory, customBooks, packagedBooks, settings.searchMode, searchProvider]);
  
  const handleSendChatMessage = async (message?: string) => {
    const messageToSend = typeof message === 'string' ? message : query;
    if (!messageToSend.trim() || isRabbiTyping) return;

    // Always start a new chat session for each question.
    const newSessionId = startNewRabbiChatSession(messageToSend);
    setActiveRabbiChatSessionId(newSessionId);
    
    const chatForApi = createRabbiChatSession();
    setRabbiChatSession(chatForApi);

    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', text: messageToSend };
    const modelMessageId = crypto.randomUUID();
    const modelPlaceholder: ChatMessage = { id: modelMessageId, role: 'model', text: '', isLoading: true };
    
    if (typeof message !== 'string') {
        setQuery('');
    }
    
    setIsRabbiTyping(true);
    setError(null);
    // Add placeholder and then user message to ensure placeholder appears at the bottom.
    addMessagesToRabbiChat(newSessionId, [modelPlaceholder, userMessage]);

    try {
        const response = await chatForApi.sendMessage({ message: messageToSend });
        const fullResponseText = response.text;
        updateRabbiChatMessage(newSessionId, modelMessageId, { text: fullResponseText, isLoading: false });
    } catch (err: any) {
        console.error("Error sending chat message:", err);
        const errorMessage = err.message || t('errorApi');
        updateRabbiChatMessage(newSessionId, modelMessageId, { text: `שגיאה: ${errorMessage}`, isLoading: false });
        setError(errorMessage);
    } finally {
        setIsRabbiTyping(false);
    }
  };

  const handleLoadMore = async () => {
    if (isLoading || isLoadingMore || !results || !lastSuccessfulQuery || selectedBook.startsWith('custom:') || selectedBook.startsWith('packaged:') || disputeResults || (settings.searchMode !== 'precise' && settings.searchMode !== 'broad') || searchProvider === 'google') {
        return;
    }
    
    setIsLoadingMore(true);
    setError(null);
    
    const newLimit = results.length + 10;

    try {
        const response = await getHalachicResponse(lastSuccessfulQuery, selectedBook, newLimit.toString(), language, settings.searchMode);
        
        if ('disputes' in response) {
            throw new Error("Received dispute response when loading more simple results.");
        }

        setResults(response.sources);
        setAiSummary(response.aiSummary);
        setFollowUpQuestions(response.followUpQuestions);
        setQuestionType(response.questionType);

    } catch (err: any) {
      console.error(err);
      setError(err.message || t('errorApi'));
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleFollowUpClick = async (question: string) => {
    if (followUpAnswers[question]) return;

    const summaryForContext = disputeResults ? overallSummary : aiSummary;
    if (!lastSuccessfulQuery || !summaryForContext) return;

    setFollowUpAnswers(prev => ({ ...prev, [question]: { answer: '', isLoading: true } }));

    try {
      const answer = await getFollowUpAnswer(question, lastSuccessfulQuery, summaryForContext, language);
      setFollowUpAnswers(prev => ({ ...prev, [question]: { answer, isLoading: false } }));
    } catch (err) {
      console.error("Error fetching follow-up answer:", err);
      const errorMessage = (err as Error).message || t('errorApi');
      setFollowUpAnswers(prev => ({ ...prev, [question]: { answer: errorMessage, isLoading: false } }));
    }
  };

  const handleSelectSampleQuestion = (question: string) => {
    setQuery(question);
    const providerToUse = searchProvider === 'rabbi-chat' ? 'sefaria' : searchProvider;
    setTimeout(() => handleSearch({ query: question, book: 'All', limit: '10', provider: providerToUse }), 0);
  };
  
  const handleSelectRabbiChatQuestion = (question: string) => {
    setQuery(question);
    handleSendChatMessage(question);
  };

  const handleOpenSourceViewer = (source: HalachicSource) => {
    if (!source.link) return;
    setSourceToView(source);
    setIsSourceViewerOpen(true);
  };

  const handleOpenSourceViewerFromLibrary = useCallback((source: HalachicSource) => {
    if (!source.link) return;
    setIsLibraryOpen(false);
    setSourceToView(source);
    setIsSourceViewerOpen(true);
  }, []);

  const handleLoadSearch = useCallback((item: HistoryItem) => {
      setIsLibraryOpen(false);
      setQuery(item.query);
      if (item.book === 'Google') {
        setSearchProvider('google');
        setTimeout(() => handleSearch({ query: item.query, book: item.book, limit: item.limit, provider: 'google' }), 0);
      } else {
        setSearchProvider('sefaria');
        setSelectedBook(item.book);
        setResultLimit(item.limit);
        setTimeout(() => handleSearch({ query: item.query, book: item.book, limit: item.limit, provider: 'sefaria' }), 0);
      }
  }, [handleSearch]);
  
  const handleLoadRabbiChat = useCallback((sessionId: string) => {
    const sessionToLoad = rabbiChatSessions.find(s => s.id === sessionId);
    if (!sessionToLoad) return;
    
    // When loading a chat, just display it. Any new question will start a new chat.
    setActiveRabbiChatSessionId(sessionId);
    setSearchProvider('rabbi-chat');
    setIsLibraryOpen(false);
    
    // We don't need to re-create the chat session for API calls,
    // as any new message will start a fresh session.
    setRabbiChatSession(null); 

  }, [rabbiChatSessions]);

  const handleAnalyzeResults = async () => {
    const sourcesForAnalysis = disputeResults?.flatMap(d => d.opinions.flatMap(o => o.sources)) ?? results ?? [];

    if (sourcesForAnalysis.length === 0 || !lastSuccessfulQuery) return;

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisData(null);
    setIsAnalysisModalOpen(true);

    try {
        const data = await getAdvancedAnalysis(lastSuccessfulQuery, sourcesForAnalysis, language);
        if (!data || data.nodes.length === 0) {
          setAnalysisError(t('noAnalysisData'));
        } else {
          setAnalysisData(data);
        }
    } catch (err) {
        console.error("Error during advanced analysis:", err);
        setAnalysisError(t('errorAnalysis'));
    } finally {
        setIsAnalyzing(false);
    }
  };

  const showAnalysisButton = (results && results.length > 0) || (disputeResults && disputeResults.length > 0);
  const sourcesForExport = disputeResults?.flatMap(d => d.opinions.flatMap(o => o.sources)) ?? results ?? [];

  const bodyFontClass = {
    sans: 'font-sans',
    serif: 'font-serif',
    mono: 'font-mono',
  }[settings.font];

  const headingFontClass = {
    sans: 'font-heading-sans',
    serif: 'font-heading-serif',
    mono: 'font-mono', // fallback for mono
  }[settings.headingFont];

  const textSizeClass = {
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
  }[settings.textSize];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };
  
  const sampleRabbiQuestions = useMemo(() => {
    const allQuestions: string[] = t('sampleQuestionsRabbiChat');
    if (!Array.isArray(allQuestions) || allQuestions.length === 0) return [];
    return [...allQuestions].sort(() => 0.5 - Math.random()).slice(0, 3);
  }, [t]);

  const showLoadMoreButton = !isLoading && results && results.length > 0 && !disputeResults && (settings.searchMode === 'precise' || settings.searchMode === 'broad');

  const showSefariaResults = (results || disputeResults) && !isLoading && searchProvider === 'sefaria';
  const showGoogleResults = googleResult && !isLoading && searchProvider === 'google';
  
  const headerSubtitle = searchProvider === 'google' ? t('appSubtitleGoogle') : t('appSubtitle');
  const welcomeSubtitle = searchProvider === 'google' ? t('appSubtitleGoogle') : t('welcomeSubtitle');
  
  const searchPlaceholders = searchProvider === 'rabbi-chat' ? t('rabbiChatPlaceholders') : t('searchPlaceholders');

  return (
    <div
      className={`min-h-screen w-full transition-colors duration-500 ${bodyFontClass} ${textSizeClass} ${
        settings.theme === 'light'
          ? 'text-gray-800 bg-gray-100'
          : 'text-gray-200 bg-gray-900'
      }`}
    >
      <div className={`fixed inset-0 -z-10 h-full w-full bg-gradient-to-br transition-colors duration-500 ${
        settings.theme === 'light'
          ? 'from-blue-100 via-purple-100 to-indigo-100'
          : 'from-gray-900 via-blue-900/40 to-indigo-900/50'
      }`} />
      
      <div className="w-full max-w-4xl mx-auto p-4 sm:p-8">
        <Header 
            headingClass={headingFontClass}
            subtitle={headerSubtitle}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenLibrary={() => setIsLibraryOpen(true)}
            onOpenMyBooks={() => setIsMyBooksOpen(true)}
            onOpenCalendar={() => setIsCalendarOpen(true)}
        />
        <main>
          <SearchProviderToggle
            provider={searchProvider}
            setProvider={setSearchProvider}
            disabled={isLoading || isRabbiTyping}
          />

          <AnimatePresence>
            {searchProvider === 'sefaria' && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 overflow-hidden"
              >
                <SearchOptions
                  categories={bookCategories}
                  packagedBooks={packagedBooks}
                  selectedBook={selectedBook}
                  setSelectedBook={setSelectedBook}
                  isLoading={isLoading}
                />
                <ResultLimitOptions
                  limitOptions={limitOptions}
                  selectedLimit={resultLimit}
                  setSelectedLimit={setResultLimit}
                  isLoading={isLoading}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <SearchBar
            query={query}
            setQuery={setQuery}
            onSearch={searchProvider === 'rabbi-chat' ? handleSendChatMessage : () => handleSearch()}
            isLoading={isLoading || isRabbiTyping}
            placeholders={searchPlaceholders}
          />
          
          <div className="my-5"></div>
          <Disclaimer headingClass={headingFontClass} />

          <div className="mt-8">
            <AnimatePresence>
              {isLoading && <ProgressBar progress={10} message={t('progressFindingRefs')} />}
              
              {error && !isLoading && !isRabbiTyping && (
                 <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-center p-4 bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-200 rounded-2xl border border-red-300 dark:border-red-500/30">
                  {error}
                 </motion.div>
              )}
            </AnimatePresence>
            
            <AnimatePresence>
            {showSefariaResults && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
              <div className="flex justify-between items-center pb-2 mb-4 border-b border-black/10 dark:border-white/20">
                <div className="flex items-center gap-4">
                  <h2 className={`text-xl font-bold text-gray-800 dark:text-gray-100 ${headingFontClass}`}>
                      {disputeResults ? t('disputeAnalysisTitle') : t('foundSourcesTitle')}
                  </h2>
                  {showAnalysisButton && (
                    <div className="flex items-center gap-2">
                      <button onClick={handleAnalyzeResults} disabled={isAnalyzing} className="flex items-center gap-2 text-xs px-3 py-1 rounded-full bg-black/5 dark:bg-white/10 text-primary-700 dark:text-primary-300 border border-black/10 dark:border-white/20 hover:bg-black/10 dark:hover:bg-white/20 transition-colors disabled:opacity-50">
                        <NetworkIcon className="w-4 h-4" />
                        {isAnalyzing ? t('analyzingButton') : t('analyzeResultsButton')}
                      </button>
                      <button onClick={() => setIsExportModalOpen(true)} className="flex items-center gap-2 text-xs px-3 py-1 rounded-full bg-black/5 dark:bg-white/10 text-primary-700 dark:text-primary-300 border border-black/10 dark:border-white/20 hover:bg-black/10 dark:hover:bg-white/20 transition-colors">
                        <DocumentDuplicateIcon className="w-4 h-4" />
                        {t('exportAndCiteButton')}
                      </button>
                    </div>
                  )}
                </div>
                {questionType && <QuestionTypeBadge type={questionType} />}
              </div>
              </motion.div>
            )}
            </AnimatePresence>

            <AnimatePresence>
              {showGoogleResults && <GoogleResultCard result={googleResult} headingClass={headingFontClass} />}
            </AnimatePresence>
            
            {searchProvider === 'rabbi-chat' && (
              <div className="w-full max-w-3xl mx-auto">
                {activeChatHistory.length === 0 && !isRabbiTyping ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      className="text-center text-gray-500 dark:text-gray-400 mt-8 sm:mt-12 flex flex-col items-center"
                    >
                      <ChatBubbleLeftIcon className="w-24 h-24 mb-6 text-primary-500 drop-shadow-lg" />
                      <h2 className={`text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white ${headingFontClass}`}>{t('rabbiChatWelcomeTitle')}</h2>
                      <p className="mt-2 text-lg text-primary-600 dark:text-primary-400">{t('rabbiChatWelcomeSubtitle')}</p>
                      
                      {sampleRabbiQuestions.length > 0 && (
                          <div className="w-full max-w-2xl mt-12">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">{t('trySampleQuestion')}</h3>
                            <motion.div
                                variants={welcomeContainerVariants}
                                initial="hidden"
                                animate="visible"
                                className="grid grid-cols-1 md:grid-cols-3 gap-4"
                            >
                                {sampleRabbiQuestions.map((q, i) => (
                                    <motion.button
                                        key={i}
                                        variants={welcomeItemVariants}
                                        whileHover={{ y: -5, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleSelectRabbiChatQuestion(q)}
                                        className="text-center p-4 bg-white/50 dark:bg-gray-800/20 rounded-2xl shadow-lg border border-gray-200 dark:border-white/10 w-full h-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 flex items-center justify-center"
                                    >
                                        <p className="font-semibold text-gray-700 dark:text-gray-200">{q}</p>
                                    </motion.button>
                                ))}
                            </motion.div>
                        </div>
                      )}
                    </motion.div>
                ) : (
                    <div ref={chatContainerRef} className="flex flex-col-reverse space-y-6 space-y-reverse overflow-y-auto max-h-[60vh] p-1">
                        <AnimatePresence>
                            {activeChatHistory.map((msg) => (
                                <RabbiChatMessage key={msg.id} message={msg} isLoading={msg.isLoading} />
                            ))}
                        </AnimatePresence>
                    </div>
                )}
              </div>
            )}


            <AnimatePresence>
            {disputeResults && disputeResults.length > 0 && showSefariaResults && (
                <motion.div 
                    className="space-y-6"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                >
                    <AiSummaryCard isStreaming={false} summary={overallSummary} title={t('overallSummaryTitle')} headingClass={headingFontClass} />
                    
                    {disputeResults.map((dispute, index) => (
                        <DisputeCard
                            key={index}
                            dispute={dispute}
                            onExpandSource={handleOpenSourceViewer}
                            isSourceLoved={isSourceLoved}
                            onToggleLove={(source) => isSourceLoved(source.id) ? removeLovedSource(source.id) : addLovedSource(source)}
                            headingClass={headingFontClass}
                        />
                    ))}
                </motion.div>
            )}
            </AnimatePresence>

            <AnimatePresence>
            {results && results.length > 0 && showSefariaResults && (
                <motion.div 
                    className="space-y-4"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                >
                    <AiSummaryCard isStreaming={false} summary={aiSummary} headingClass={headingFontClass}/>

                    {results.map((source) => {
                        return (
                          <ResultCard
                              key={source.id}
                              source={source}
                              onExpand={handleOpenSourceViewer}
                              isLoved={isSourceLoved(source.id)}
                              onToggleLove={() => isSourceLoved(source.id) ? removeLovedSource(source.id) : addLovedSource(source)}
                              headingClass={headingFontClass}
                          />
                        );
                    })}
                </motion.div>
            )}
            </AnimatePresence>

            <AnimatePresence>
                {showLoadMoreButton && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 flex justify-center">
                        <button
                            onClick={handleLoadMore}
                            disabled={isLoadingMore}
                            className="flex items-center justify-center gap-2 bg-primary-500 text-white font-bold py-3 px-8 rounded-full hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-900 transition-all transform hover:scale-105 shadow-lg disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:scale-100 disabled:cursor-not-allowed"
                        >
                            {isLoadingMore ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>{t('loadingMoreButton')}</span>
                                </>
                            ) : (
                                <span>{t('loadMoreButton')}</span>
                            )}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
            
            {!isLoading && showSefariaResults && (
              <>
                {followUpQuestions.length > 0 && (
                    <FollowUpQuestions 
                        questions={followUpQuestions} 
                        onQuestionClick={handleFollowUpClick}
                        answers={followUpAnswers}
                    />
                )}
              </>
            )}
            
            {!isLoading && !results && !disputeResults && !error && !googleResult && searchProvider !== 'rabbi-chat' && (
              <WelcomeScreen
                headingClass={headingFontClass}
                onSelectSampleQuestion={handleSelectSampleQuestion}
                onLoadSearch={handleLoadSearch}
                subtitleText={welcomeSubtitle}
                provider={searchProvider}
              />
            )}
          </div>
        </main>
      </div>
      <AnimatePresence>
        {isSettingsOpen && <SettingsModal 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)} 
        />}
        {isMyBooksOpen && <MyBooksModal
          isOpen={isMyBooksOpen}
          onClose={() => setIsMyBooksOpen(false)}
        />}
        {isLibraryOpen && <LibraryModal
          isOpen={isLibraryOpen}
          onClose={() => setIsLibraryOpen(false)}
          onLoadSearch={handleLoadSearch}
          onViewSource={handleOpenSourceViewerFromLibrary}
          onLoadRabbiChat={handleLoadRabbiChat}
        />}
        {isCalendarOpen && <HebrewCalendarModal
          isOpen={isCalendarOpen}
          onClose={() => setIsCalendarOpen(false)}
        />}
        {isSourceViewerOpen && <SourceViewerModal
          isOpen={isSourceViewerOpen}
          onClose={() => setIsSourceViewerOpen(false)}
          source={sourceToView}
        />}
        {isAnalysisModalOpen && <AdvancedAnalysisModal
          isOpen={isAnalysisModalOpen}
          onClose={() => setIsAnalysisModalOpen(false)}
          isLoading={isAnalyzing}
          data={analysisData}
          error={analysisError}
        />}
        {isExportModalOpen && <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          sources={sourcesForExport}
          aiSummary={disputeResults ? overallSummary : aiSummary}
          query={lastSuccessfulQuery}
        />}
       </AnimatePresence>
    </div>
  );
};

export default App;