import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { QuestionType } from '../services/geminiService';
import { CheckIcon, FlaskIcon, ScrollIcon } from './Icon';
import { translations } from '../i18n/translations';

interface QuestionTypeBadgeProps {
  type: QuestionType;
}

const typeDetails: { [key in QuestionType]: { icon: React.ElementType, labelKey: keyof typeof translations.he, colors: string } } = {
  practical: {
    icon: CheckIcon,
    labelKey: 'questionTypePractical',
    colors: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200',
  },
  theoretical: {
    icon: FlaskIcon,
    labelKey: 'questionTypeTheoretical',
    colors: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200',
  },
  historical: {
    icon: ScrollIcon,
    labelKey: 'questionTypeHistorical',
    colors: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200',
  },
};

const QuestionTypeBadge: React.FC<QuestionTypeBadgeProps> = ({ type }) => {
  const { t, dir } = useLanguage();
  
  const details = typeDetails[type] || typeDetails.theoretical;
  const Icon = details.icon;

  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${details.colors}`}>
      <Icon className="w-4 h-4" />
      <span className="hidden sm:inline">{t('questionTypeLabel')}</span>
      <span>{t(details.labelKey)}</span>
    </div>
  );
};

export default QuestionTypeBadge;