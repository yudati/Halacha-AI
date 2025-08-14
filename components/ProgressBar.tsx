import React from 'react';

interface ProgressBarProps {
  progress?: number; // Prop is not really used, but keeping it for signature consistency
  message: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ message }) => {
  return (
    <div className="w-full max-w-lg mx-auto my-8 p-6 bg-white/50 dark:bg-gray-800/20 rounded-2xl shadow-lg border border-gray-200 dark:border-white/10 animate-fade-in">
      <div className="flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-lg font-semibold text-primary-700 dark:text-primary-300">{message}</p>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mt-4 overflow-hidden">
            <div className="bg-primary-600 h-2.5 rounded-full w-full animate-progress-indeterminate"></div>
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;