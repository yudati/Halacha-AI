

import { TranslationKey } from '../i18n/translations';

export type Nusach = 'ashkenaz' | 'sefard' | 'edot-hamizrach';

export interface Prayer {
  id: string;
  nameKey: TranslationKey;
  refs: {
    [key in Nusach]?: string;
  };
}

export interface PrayerCategory {
  id:string;
  nameKey: TranslationKey;
  prayers: Prayer[];
}

export const siddurData: PrayerCategory[] = [
  {
    id: 'weekdays',
    nameKey: 'siddurWeekdays',
    prayers: [
      {
        id: 'shacharit',
        nameKey: 'siddurShacharit',
        refs: {
          'ashkenaz': 'Siddur Ashkenaz, Weekday, Shacharit',
          'sefard': 'Siddur Sefard, Shacharit for Weekdays',
          'edot-hamizrach': 'Siddur Edot haMizrach, Weekday, Shacharit'
        }
      },
      {
        id: 'mincha',
        nameKey: 'siddurMincha',
        refs: {
          'ashkenaz': 'Siddur Ashkenaz, Weekday, Mincha',
          'sefard': 'Siddur Sefard, Mincha for Weekdays',
          'edot-hamizrach': 'Siddur Edot haMizrach, Weekday, Mincha'
        }
      },
      {
        id: 'maariv',
        nameKey: 'siddurMaariv',
        refs: {
          'ashkenaz': 'Siddur Ashkenaz, Weekday, Maariv',
          'sefard': 'Siddur Sefard, Maariv for Weekdays',
          'edot-hamizrach': 'Siddur Edot haMizrach, Weekday, Maariv'
        }
      }
    ]
  },
  {
    id: 'blessings',
    nameKey: 'siddurBlessings',
    prayers: [
      {
        id: 'birkat-hamazon',
        nameKey: 'siddurBirkatHamazon',
        refs: {
          'ashkenaz': 'Siddur Ashkenaz, Birkat HaMazon',
          'sefard': 'Siddur Sefard, Birkat HaMazon',
          'edot-hamizrach': 'Siddur Edot haMizrach, Birkat HaMazon'
        }
      }
    ]
  }
];