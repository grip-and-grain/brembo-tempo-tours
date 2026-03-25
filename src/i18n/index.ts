import { sv } from './sv';
import { en } from './en';

export function useTranslations(lang: 'sv' | 'en') {
  return lang === 'en' ? en : sv;
}

export type { Translations } from './sv';
