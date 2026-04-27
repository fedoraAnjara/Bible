import React, { createContext, useContext, useEffect, useState } from 'react';
import { loadLanguage, saveLanguage } from '../services/storageService';
import type { Language } from '../services/bibleService';


type BibleContextType = {
  lang: Language;
  setLang: (l: Language) => Promise<void>;
  fontSize: number;
  setFontSize: (size: number) => void;
};

const BibleContext = createContext<BibleContextType>({
  lang: 'fr',
  setLang: async () => {},
  fontSize: 17,
  setFontSize: () => {},
});

export function BibleProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('fr');
  const [fontSize, setFontSize] = useState(17);

  useEffect(() => {
    loadLanguage().then(setLangState);
  }, []);

  const setLang = async (l: Language) => {
    setLangState(l);
    await saveLanguage(l);
  };

  return (
    <BibleContext.Provider value={{ lang, setLang, fontSize, setFontSize }}>
      {children}
    </BibleContext.Provider>
  );
}

export function useBible() {
  return useContext(BibleContext);
}