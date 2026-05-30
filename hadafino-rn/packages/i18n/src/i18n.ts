import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager, Platform } from 'react-native';
import { fa } from './translations/fa';
import { en } from './translations/en';
import type { Language } from '@hadafino/core';

export const RTL_LANGUAGES: Language[] = ['fa'];

export function isRTLLanguage(lang: Language): boolean {
  return RTL_LANGUAGES.includes(lang);
}

export function configureRTL(language: Language): void {
  const shouldBeRTL = isRTLLanguage(language);
  if (I18nManager.isRTL !== shouldBeRTL) {
    I18nManager.allowRTL(shouldBeRTL);
    I18nManager.forceRTL(shouldBeRTL);
  }
}

export async function initI18n(language: Language = 'fa'): Promise<void> {
  if (i18n.isInitialized) {
    await i18n.changeLanguage(language);
    configureRTL(language);
    return;
  }

  await i18n.use(initReactI18next).init({
    compatibilityJSON: 'v4',
    lng: language,
    fallbackLng: 'fa',
    resources: { fa, en },
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });

  configureRTL(language);
}

export async function changeLanguage(language: Language): Promise<void> {
  await i18n.changeLanguage(language);
  configureRTL(language);
}

export { i18n };
export { useTranslation } from 'react-i18next';
