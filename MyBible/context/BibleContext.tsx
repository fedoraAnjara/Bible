// context/BibleContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { loadLanguage, saveLanguage } from '../services/storageService';
import type { Language } from '../services/bibleService';

type BibleContextType = {
  lang: Language;
  setLang: (l: Language) => Promise<void>;
};

const BibleContext = createContext<BibleContextType>({
  lang: 'fr',
  setLang: async () => {},
});

// Provider : enveloppe toute l'app
export function BibleProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('fr');

  // Au démarrage, on charge la langue sauvegardée
  useEffect(() => {
    loadLanguage().then(setLangState);
  }, []);

  const setLang = async (l: Language) => {
    setLangState(l);
    await saveLanguage(l);
  };

  return (
    <BibleContext.Provider value={{ lang, setLang }}>
      {children}
    </BibleContext.Provider>
  );
}

// Hook personnalisé pour utiliser le contexte
export function useBible() {
  return useContext(BibleContext);
}