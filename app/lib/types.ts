export type Bio = {
  id: number;
  slug: string;
  url_en: string;
  url_fr: string;
  name_en: string;
  name_fr: string;
  birth_text: string | null;
  death_text: string | null;
  birth_year: number | null;
  death_year: number | null;
  volume: number | null;
  author: string | null;
  teaser_en: string | null;
  teaser_fr: string | null;
  html_en: string;
  html_fr: string;
  biblio_en: string | null;
  biblio_fr: string | null;
  plain_en: string;
  plain_fr: string;
  citation: string | null;
};

export type BioLang = 'en' | 'fr';

export type AppSettings = {
  bioLang: BioLang;
  uiLang: BioLang;
  fontScale: number;
  theme: 'system' | 'light' | 'dark';
  notifyEnabled: boolean;
  notifyHour: number;
  notifyMinute: number;
};

export const DEFAULT_SETTINGS: AppSettings = {
  bioLang: 'en',
  uiLang: 'en',
  fontScale: 1,
  theme: 'system',
  notifyEnabled: false,
  notifyHour: 8,
  notifyMinute: 0,
};
