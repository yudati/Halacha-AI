

import React from 'react';
import { TimelineEvent } from '../services/geminiService';
import { useLanguage } from '../contexts/LanguageContext';

interface TimelineProps {
  events: TimelineEvent[];
}

const Timeline: React.FC<TimelineProps> = ({ events }) => {
  const { dir } = useLanguage();

  const sortedEvents = [...events].sort((a, b) => a.year - b.year);

  return (
    <div className="relative p-10">
      {/* Central line */}
      <div className="absolute top-0 bottom-0 w-1 bg-gradient-to-b from-blue-300 to-indigo-400 dark:from-blue-700 dark:to-indigo-800"
           style={dir === 'rtl' ? { right: '50%', transform: 'translateX(50%)' } : { left: '50%', transform: 'translateX(-50%)' }}>
      </div>
      
      {sortedEvents.map((event, index) => {
        const isLeft = dir === 'rtl' ? index % 2 === 0 : index % 2 !== 0;

        return (
          <div key={index} className={`relative mb-8 flex items-center ${isLeft ? 'justify-start' : 'justify-end'}`}>
            <div className={`w-5/12 ${isLeft ? 'text-right pr-8' : 'text-left pl-8'}`}>
              <div className="bg-white/70 dark:bg-gray-800/70 p-4 rounded-lg shadow-lg border dark:border-gray-700 backdrop-blur-sm">
                <p className="font-bold text-indigo-600 dark:text-indigo-400">{event.era}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{event.year} (approx.)</p>
                <p className="text-gray-800 dark:text-gray-200">{event.summary}</p>
                {event.sourceRefs && event.sourceRefs.length > 0 && (
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                    Sources: {event.sourceRefs.join(', ')}
                  </div>
                )}
              </div>
            </div>
            
            {/* Dot on the timeline */}
            <div className="absolute w-4 h-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full z-10 ring-4 ring-white/50 dark:ring-gray-800/50"
                 style={dir === 'rtl' ? { right: '50%', transform: 'translateX(50%)' } : { left: '50%', transform: 'translateX(-50%)' }}>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Timeline;