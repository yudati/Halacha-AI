
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { fetchWithProxyFallback } from '../services/geminiService';
import { CloseIcon, BookIcon, SunIcon, MoonIcon, ChevronLeftIcon, ChevronRightIcon } from './Icon';
import Spinner from './Spinner';

// Type definitions for Hebcal API response
interface HebcalItem {
    title: string;
    date: string; // "YYYY-MM-DD"
    category: 'hebdate' | 'parashat' | 'holiday' | 'candles' | 'havdalah' | 'mevarchim' | 'roshchodesh';
    subcat?: 'major' | 'minor' | 'fast' | 'modern';
    hdate?: string; // "כ״ה בְּאִיָּר תשפ״ד"
    hebrew?: string; // For parasha
    memo?: string; // For holidays
}

interface HebcalResponse {
    title: string;
    date: string;
    items: HebcalItem[];
}

interface CalendarCell {
    key: string;
    isCurrentMonth: boolean;
    isToday?: boolean;
    gregorianDate?: number;
    hebrewDate?: string;
    events?: { title: string; category: string }[];
}


interface HebrewCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HebrewCalendarModal: React.FC<HebrewCalendarModalProps> = ({ isOpen, onClose }) => {
    const { t, dir } = useLanguage();
    const [calendarData, setCalendarData] = useState<HebcalResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewDate, setViewDate] = useState(new Date());

    // Effect to reset viewDate to current month when modal is opened
    useEffect(() => {
        if (isOpen) {
            setViewDate(new Date());
        }
    }, [isOpen]);

    // Effect to fetch calendar data when view changes
    useEffect(() => {
        if (!isOpen) return;

        const fetchCalendarData = async (lat?: number, lon?: number) => {
            setIsLoading(true);
            setError(null);
            const year = viewDate.getFullYear();
            const month = viewDate.getMonth() + 1;
            const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            
            let url = `https://www.hebcal.com/hebcal?v=1&cfg=json&maj=on&min=on&mod=on&nx=on&mf=on&ss=on&lg=h&year=${year}&month=${month}&yt=g`;

            if (lat && lon) {
                url += `&latitude=${lat}&longitude=${lon}&tzid=${timeZone}`;
            } else {
                url += `&geonameid=281184`;
                setError(t('errorLocation'));
            }

            try {
                const response = await fetchWithProxyFallback(url);
                const data: HebcalResponse = await response.json();
                setCalendarData(data);
            } catch (err) {
                console.error("Error fetching Hebcal data:", err);
                setError(t('errorCalendar'));
                setCalendarData(null);
            } finally {
                setIsLoading(false);
            }
        };

        const getLocation = () => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => fetchCalendarData(position.coords.latitude, position.coords.longitude),
                    (geoErr) => {
                        console.warn(`Geolocation error: ${geoErr.message}`);
                        fetchCalendarData(); // Fetch with fallback
                    }
                );
            } else {
                fetchCalendarData(); // Geolocation not supported, use fallback
            }
        };

        getLocation();
    }, [isOpen, viewDate, t]);

    const handlePrevMonth = () => setViewDate(current => new Date(current.getFullYear(), current.getMonth() - 1, 1));
    const handleNextMonth = () => setViewDate(current => new Date(current.getFullYear(), current.getMonth() + 1, 1));

    const processedData = useMemo(() => {
        if (!calendarData?.items) return null;
        
        const todayISO = new Date().toISOString().split('T')[0];
        const today = new Date(todayISO + 'T00:00:00');

        const todaysHebrewDateItem = calendarData.items.find(item => item.category === 'hebdate' && item.date === todayISO);
        const parashaItem = calendarData.items.find(item => item.category === 'parashat');
        const candleLightingItem = calendarData.items.find(item => item.category === 'candles');
        const havdalahItem = calendarData.items.find(item => item.category === 'havdalah');
        
        const upcomingHolidays = calendarData.items.filter(item => 
            (item.category === 'holiday' || item.category === 'roshchodesh') && new Date(item.date + 'T00:00:00') >= today
        ).slice(0, 5);

        return {
            todaysHebrewDate: todaysHebrewDateItem?.hdate,
            parasha: parashaItem?.hebrew,
            candleLighting: candleLightingItem ? new Date(candleLightingItem.date).toLocaleTimeString(navigator.language, { hour: '2-digit', minute: '2-digit'}) : null,
            candleLightingDate: candleLightingItem?.date,
            havdalah: havdalahItem ? new Date(havdalahItem.date).toLocaleTimeString(navigator.language, { hour: '2-digit', minute: '2-digit'}) : null,
            havdalahDate: havdalahItem?.date,
            upcomingHolidays
        };
    }, [calendarData]);

    const calendarGridData = useMemo(() => {
        if (!calendarData?.items) return { weeks: [], monthName: '', year: '' };
    
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
    
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
    
        const monthName = viewDate.toLocaleString('he-IL', { month: 'long', timeZone: 'UTC' });
        const yearName = viewDate.toLocaleString('he-IL', { year: 'numeric', timeZone: 'UTC' });
    
        const cells: CalendarCell[] = [];
    
        for (let i = 0; i < firstDayOfMonth; i++) {
            cells.push({ key: `prev-${i}`, isCurrentMonth: false });
        }
    
        const today = new Date();
        today.setHours(0, 0, 0, 0);
    
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateString = date.toISOString().split('T')[0];
            
            const itemsForDay = calendarData.items.filter(item => item.date === dateString);
            const hebrewDateItem = itemsForDay.find(item => item.category === 'hebdate');
            const hebrewDate = hebrewDateItem?.hdate?.split(' ')[0] || '';
            
            const events = itemsForDay
                .filter(item => item.category !== 'hebdate')
                .map(item => ({
                    title: item.hebrew || item.title,
                    category: item.category,
                }));
    
            cells.push({
                key: `current-${day}`,
                isCurrentMonth: true,
                isToday: date.getTime() === today.getTime(),
                gregorianDate: day,
                hebrewDate,
                events,
            });
        }
    
        const weeks = [];
        while(cells.length > 0) {
            weeks.push(cells.splice(0, 7));
        }
        
        if (weeks.length > 0) {
            const lastWeek = weeks[weeks.length-1];
            while (lastWeek.length < 7) {
                lastWeek.push({ key: `next-${lastWeek.length}`, isCurrentMonth: false });
            }
        }
    
        return { weeks, monthName, year: yearName };
    }, [calendarData, viewDate]);

    const InfoCard = ({ icon, title, value, subtext }: {icon: React.ReactNode, title: string, value: React.ReactNode, subtext?: string}) => (
        <div className="bg-gray-200/50 dark:bg-gray-900/50 p-4 rounded-xl flex items-center gap-4 h-full">
            <div className="flex-shrink-0 text-primary-500">{icon}</div>
            <div>
                <p className="text-sm font-semibold text-primary-600 dark:text-primary-400">{title}</p>
                <p className="text-xl font-bold text-gray-800 dark:text-gray-200">{value}</p>
                {subtext && <p className="text-xs text-gray-500 dark:text-gray-400">{subtext}</p>}
            </div>
        </div>
    );
    
    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' });

    const getEventStyle = (category: string) => {
        switch(category) {
            case 'holiday': return 'bg-indigo-500 text-white';
            case 'parashat': return 'bg-sky-500 text-white';
            case 'roshchodesh': return 'bg-teal-500 text-white';
            default: return 'bg-gray-400 text-white';
        }
    };

    return (
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/70 z-[60] flex justify-center items-center"
              onClick={onClose}
              role="dialog"
              aria-modal="true"
              aria-labelledby="calendar-title"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl m-4 flex flex-col h-auto max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
                dir={dir}
              >
                <div className="flex justify-between items-center p-6 pb-4 border-b border-gray-200 dark:border-gray-700/50 flex-shrink-0">
                  <h2 id="calendar-title" className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    {t('calendarModalTitle')}
                  </h2>
                  <button onClick={onClose} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors" aria-label="Close calendar">
                    <CloseIcon className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="overflow-y-auto p-6 flex-1">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full p-8">
                            <Spinner />
                            <p className="mt-4 text-primary-600 dark:text-primary-400">{t('loadingCalendar')}</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {error && (
                                <div className="text-center p-3 bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-200 rounded-lg text-sm font-medium">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {processedData?.parasha && <InfoCard icon={<BookIcon className="w-8 h-8"/>} title={t('parashaLabel')} value={processedData.parasha} />}
                                    {processedData?.candleLighting && <InfoCard icon={<SunIcon className="w-8 h-8"/>} title={t('candleLightingLabel')} value={processedData.candleLighting} subtext={processedData.candleLightingDate ? formatDate(processedData.candleLightingDate) : undefined} />}
                                    {processedData?.havdalah && <InfoCard icon={<MoonIcon className="w-8 h-8"/>} title={t('havdalahLabel')} value={processedData.havdalah} subtext={processedData.havdalahDate ? formatDate(processedData.havdalahDate) : undefined}/>}
                                </div>
                            </div>
                            
                            <div className="mt-8 border-t border-gray-200 dark:border-gray-700/50 pt-6">
                                <h3 className="text-xl font-bold text-center text-gray-700 dark:text-gray-300 mb-4">{t('fullCalendarTitle')}</h3>
                                
                                <div className="flex items-center justify-between mb-2">
                                    <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors" aria-label="Previous month">
                                        <ChevronLeftIcon className="w-6 h-6 text-gray-600 dark:text-gray-300"/>
                                    </button>
                                    <div className="text-lg font-bold text-primary-600 dark:text-primary-400">{calendarGridData.monthName} {calendarGridData.year}</div>
                                    <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors" aria-label="Next month">
                                        <ChevronRightIcon className="w-6 h-6 text-gray-600 dark:text-gray-300"/>
                                    </button>
                                </div>
                                
                                <div className="grid grid-cols-7 gap-1 text-center font-semibold text-sm text-gray-600 dark:text-gray-400 mb-1">
                                    {t('daysOfWeekShort').map((day: string) => <div key={day} className="py-1">{day}</div>)}
                                </div>
                                
                                <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700/50 rounded-lg overflow-hidden">
                                    {calendarGridData.weeks.flat().map((day: CalendarCell) => (
                                        <div key={day.key} className={`relative flex flex-col p-1.5 min-h-[7rem] transition-colors duration-200 ${day.isCurrentMonth ? 'bg-white dark:bg-gray-800' : 'bg-gray-100/50 dark:bg-gray-900/30'}`}>
                                            {day.isCurrentMonth && (
                                                <>
                                                    <div className="flex justify-between items-start text-xs">
                                                        <span className={`font-mono flex items-center justify-center w-6 h-6 rounded-full ${day.isToday ? 'bg-primary-500 text-white font-bold' : 'text-gray-500 dark:text-gray-400'}`}>{day.gregorianDate}</span>
                                                        <span className="font-serif font-bold text-gray-600 dark:text-gray-300">{day.hebrewDate}</span>
                                                    </div>
                                                    <div className="flex-grow overflow-y-auto text-xs mt-1 space-y-1">
                                                        {day.events?.slice(0, 2).map((event, i) => (
                                                            <div key={i} title={event.title} className={`px-1 py-0.5 rounded-sm truncate text-white text-[10px] font-semibold ${getEventStyle(event.category)}`}>
                                                                {event.title}
                                                            </div>
                                                        ))}
                                                        {day.events && day.events.length > 2 && (
                                                            <div className="text-gray-500 text-[10px] text-center font-bold">...</div>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      );
};

export default HebrewCalendarModal;