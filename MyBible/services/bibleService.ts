import kjvData from '../assets/bibles/kjv.json';
import segondData from '../assets/bibles/segond_1910.json';
import mg1865Data from '../assets/bibles/mg1865.json';

export type Verse = {
  book_name: string;
  book: number;
  chapter: number;
  verse: number;
  text: string;
};

export type Language = 'fr' | 'en' | 'mg';

const ALL_VERSES: Record<Language, Verse[]> = {
  fr: (segondData as { verses: Verse[] }).verses.map(v => ({
    ...v,
    text: v.text.replace(/¶\s*/g, '').trim()
  })),
  en: (kjvData as { verses: Verse[] }).verses.map(v => ({
    ...v,
    text: v.text.replace(/¶\s*/g, '').trim()
  })),
  mg: (mg1865Data as { verses: Verse[] }).verses.map(v => ({
    ...v,
    text: v.text.replace(/\[.*?\]/g, '').trim()  // nettoie les [titres de section]
  })),
};

// Retourne la liste des livres uniques (dans l'ordre)
export function getBooks(lang: Language): { book: number; name: string; chapters: number }[] {
  const verses = ALL_VERSES[lang];
  const bookMap = new Map<number, { name: string; maxChapter: number }>();

  for (const v of verses) {
    const existing = bookMap.get(v.book);
    if (!existing) {
      bookMap.set(v.book, { name: v.book_name, maxChapter: v.chapter });
    } else if (v.chapter > existing.maxChapter) {
      existing.maxChapter = v.chapter;
    }
  }

  return Array.from(bookMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([book, { name, maxChapter }]) => ({
      book,
      name,
      chapters: maxChapter,
    }));
}

// Retourne les versets d'un chapitre précis
export function getChapter(lang: Language, bookNum: number, chapterNum: number): Verse[] {
  return ALL_VERSES[lang].filter(
    (v) => v.book === bookNum && v.chapter === chapterNum
  );
}

// Retourne un verset spécifique
export function getVerse(lang: Language, bookNum: number, chapterNum: number, verseNum: number): Verse | undefined {
  return ALL_VERSES[lang].find(
    (v) => v.book === bookNum && v.chapter === chapterNum && v.verse === verseNum
  );
}

// Recherche dans le texte
export function searchVerses(lang: Language, query: string): Verse[] {
  if (query.trim().length < 3) return [];
  const lower = query.toLowerCase();
  return ALL_VERSES[lang].filter((v) =>
    v.text.toLowerCase().includes(lower)
  ).slice(0, 50); // limité à 50 résultats
}