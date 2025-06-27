
"use client";

import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { translationsEn } from '@/locales/en';
import { translationsAr } from '@/locales/ar';

type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

const translations = {
  en: translationsEn,
  ar: translationsAr,
};

// Helper function to navigate nested object with dot notation
const getNestedTranslation = (language: Language, key: string): string | undefined => {
    return key.split('.').reduce((obj: any, k: string) => {
        return obj && obj[k] !== 'undefined' ? obj[k] : undefined;
    }, translations[language]);
};

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_LS_KEY = 'scoreverse-language';

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const savedLanguage = localStorage.getItem(LANGUAGE_LS_KEY) as Language | null;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ar')) {
        setLanguageState(savedLanguage);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_LS_KEY, lang);
  };
  
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const t = useCallback((key: string, replacements?: Record<string, string | number>): string => {
    let translation = getNestedTranslation(language, key);

    if (translation === undefined) {
      // Fallback to English if translation is missing
      translation = getNestedTranslation('en', key);
      if(translation === undefined) {
        console.warn(`Translation key "${key}" not found in English or the selected language.`);
        return key; // Return the key itself as a fallback
      }
    }

    if (replacements) {
      Object.keys(replacements).forEach(rKey => {
        const value = replacements[rKey];
        translation = translation!.replace(new RegExp(`{{${rKey}}}`, 'g'), String(value));
      });
    }

    return translation;
  }, [language]);
  

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
