

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { AdvancedAnalysisData } from '../services/geminiService';
import { CloseIcon, NetworkIcon, TimelineIcon, ZapIcon } from './Icon';
import Spinner from './Spinner';
import ConnectionMap from './ConnectionMap';
import Timeline from './Timeline';
import Flowchart from './Flowchart';


interface AdvancedAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  data: AdvancedAnalysisData | null;
  error: string | null;
}

const AdvancedAnalysisModal: React.FC<AdvancedAnalysisModalProps> = ({ isOpen, onClose, isLoading, data, error }) => {
  const { t, dir } = useLanguage();
  const [activeTab, setActiveTab] = useState<'map' | 'timeline' | 'flowchart'>('map');

  const hasFlowchart = data?.flowchart && data.flowchart.nodes.length > 0;

  useEffect(() => {
    if (isOpen && data) {
      if (activeTab === 'flowchart' && !hasFlowchart) {
        setActiveTab('map');
      }
    }
  }, [isOpen, data, hasFlowchart, activeTab]);

  const renderContent = () => {
    if (isLoading) {
      return <Spinner />;
    }
    if (error) {
       return <p className="text-center text-red-600 dark:text-red-400 py-16">{error}</p>;
    }
    if (!data) {
       return <p className="text-center text-gray-500 dark:text-gray-400 py-16">{t('noAnalysisData')}</p>;
    }

    if (activeTab === 'map') {
      return <ConnectionMap nodes={data.nodes} edges={data.edges} />;
    }
    if (activeTab === 'timeline') {
      return <Timeline events={data.timelineEvents} />;
    }
    if (activeTab === 'flowchart' && hasFlowchart) {
      return <Flowchart data={data.flowchart!} />;
    }
    return null;
  }

  const TabButton = ({ tab, icon: Icon, label }: {tab: 'map' | 'timeline' | 'flowchart', icon: React.ElementType, label: string}) => (
     <button
        onClick={() => setActiveTab(tab)}
        className={`flex-1 flex justify-center items-center gap-2 py-3 px-1 text-center font-semibold border-b-2 transition-colors ${activeTab === tab ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </button>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="analysis-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-4xl m-4 flex flex-col h-[90vh]"
            onClick={(e) => e.stopPropagation()}
            dir={dir}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-white/10 flex-shrink-0 bg-white/80 dark:bg-gray-900/80 rounded-t-2xl">
              <h2 id="analysis-title" className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                {t('advancedAnalysisTitle')}
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors"
                aria-label="Close analysis"
              >
                <CloseIcon className="w-6 h-6" />
              </button>
            </div>
            
            {/* Tabs */}
            <div className="flex items-center border-b border-gray-200 dark:border-white/10 flex-shrink-0 text-sm bg-white/80 dark:bg-gray-900/80">
               <TabButton tab="map" icon={NetworkIcon} label={t('connectionMapTab')} />
               <TabButton tab="timeline" icon={TimelineIcon} label={t('timelineTab')} />
               {hasFlowchart && <TabButton tab="flowchart" icon={ZapIcon} label={t('flowchartTab')} />}
            </div>

            {/* Content */}
            <div className="overflow-auto p-4 flex-1">
                {renderContent()}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AdvancedAnalysisModal;