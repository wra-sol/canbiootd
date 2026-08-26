import { I18n } from 'i18n-js';
import type { BioLang } from './types';

const translations = {
  en: {
    tabs: {
      today: 'Today',
      archive: 'Archive',
      search: 'Search',
      saved: 'Saved',
      settings: 'Settings',
    },
    today: {
      title: 'Biography of the day',
      empty: 'No biographies loaded yet.',
      readFull: 'Read full biography',
    },
    reader: {
      source: 'Source',
      readOnDcb: 'Read on biographi.ca',
      bibliography: 'Bibliography',
      saved: 'Saved',
      save: 'Save',
      share: 'Share',
      author: 'Author',
      volume: 'Volume',
    },
    archive: {
      title: 'Past days',
      empty: 'Come back tomorrow for more history.',
    },
    search: {
      placeholder: 'Search names and text…',
      empty: 'Try a name, place, or keyword.',
      noResults: 'No matches.',
    },
    saved: {
      title: 'Saved biographies',
      empty: 'Tap the bookmark on a biography to save it here.',
    },
    settings: {
      title: 'Settings',
      language: 'Biography language',
      uiLanguage: 'App language',
      english: 'English',
      french: 'Français',
      appearance: 'Appearance',
      themeSystem: 'System',
      themeLight: 'Light',
      themeDark: 'Dark',
      fontSize: 'Text size',
      notifications: 'Daily reminder',
      notifyOn: 'Remind me each day',
      notifyTime: 'Reminder time',
      about: 'About & attribution',
      aboutBody:
        'CanBIO-OTD is a free, non-commercial reader. Biographies are reproduced unmodified from the Dictionary of Canadian Biography / Dictionnaire biographique du Canada (University of Toronto / Université Laval), under their Terms of Use for personal and public non-commercial electronic use. Always credit the DCB/DBC as the source.',
      terms: 'DCB Terms of Use',
      donate: 'Donate to the DCB',
      website: 'biographi.ca',
    },
    common: {
      loading: 'Loading…',
      error: 'Something went wrong.',
      retry: 'Try again',
      preparing: 'Preparing your library…',
    },
  },
  fr: {
    tabs: {
      today: 'Aujourd’hui',
      archive: 'Archives',
      search: 'Recherche',
      saved: 'Enregistrés',
      settings: 'Réglages',
    },
    today: {
      title: 'Biographie du jour',
      empty: 'Aucune biographie chargée.',
      readFull: 'Lire la biographie',
    },
    reader: {
      source: 'Source',
      readOnDcb: 'Lire sur biographi.ca',
      bibliography: 'Bibliographie',
      saved: 'Enregistré',
      save: 'Enregistrer',
      share: 'Partager',
      author: 'Auteur',
      volume: 'Volume',
    },
    archive: {
      title: 'Jours passés',
      empty: 'Revenez demain pour plus d’histoire.',
    },
    search: {
      placeholder: 'Chercher noms et texte…',
      empty: 'Essayez un nom, un lieu ou un mot-clé.',
      noResults: 'Aucun résultat.',
    },
    saved: {
      title: 'Biographies enregistrées',
      empty: 'Appuyez sur le signet d’une biographie pour l’enregistrer ici.',
    },
    settings: {
      title: 'Réglages',
      language: 'Langue des biographies',
      uiLanguage: 'Langue de l’app',
      english: 'English',
      french: 'Français',
      appearance: 'Apparence',
      themeSystem: 'Système',
      themeLight: 'Clair',
      themeDark: 'Sombre',
      fontSize: 'Taille du texte',
      notifications: 'Rappel quotidien',
      notifyOn: 'Me rappeler chaque jour',
      notifyTime: 'Heure du rappel',
      about: 'À propos et attribution',
      aboutBody:
        'CanBIO-OTD est une application gratuite et non commerciale. Les biographies sont reproduites sans modification à partir du Dictionnaire biographique du Canada / Dictionary of Canadian Biography (Université Laval / University of Toronto), conformément à leurs conditions d’utilisation pour un usage électronique personnel et public non commercial. Toujours indiquer le DBC/DCB comme source.',
      terms: 'Conditions d’utilisation du DBC',
      donate: 'Faire un don au DBC',
      website: 'biographi.ca',
    },
    common: {
      loading: 'Chargement…',
      error: 'Une erreur s’est produite.',
      retry: 'Réessayer',
      preparing: 'Préparation de votre bibliothèque…',
    },
  },
} as const;

const i18n = new I18n(translations);
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

export function setUiLocale(lang: BioLang) {
  i18n.locale = lang;
}

export function t(key: string): string {
  return i18n.t(key);
}

export function bioName(bio: { name_en: string; name_fr: string }, lang: BioLang) {
  return lang === 'fr' ? bio.name_fr || bio.name_en : bio.name_en;
}

export function bioTeaser(
  bio: { teaser_en: string | null; teaser_fr: string | null },
  lang: BioLang
) {
  return lang === 'fr'
    ? bio.teaser_fr || bio.teaser_en || ''
    : bio.teaser_en || bio.teaser_fr || '';
}

export function bioHtml(
  bio: { html_en: string; html_fr: string },
  lang: BioLang
) {
  return lang === 'fr' ? bio.html_fr || bio.html_en : bio.html_en;
}

export function bioUrl(
  bio: { url_en: string; url_fr: string },
  lang: BioLang
) {
  return lang === 'fr' ? bio.url_fr || bio.url_en : bio.url_en;
}

export function bioBiblio(
  bio: { biblio_en: string | null; biblio_fr: string | null },
  lang: BioLang
) {
  return lang === 'fr'
    ? bio.biblio_fr || bio.biblio_en
    : bio.biblio_en || bio.biblio_fr;
}

export default i18n;
