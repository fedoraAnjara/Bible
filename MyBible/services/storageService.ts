// services/storageService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Language } from './bibleService';

// --- Clés de stockage (toutes centralisées ici) ---
const KEYS = {
  LANGUAGE: 'mybible:language',
  FAVORITES: 'mybible:favorites',
  LAST_POSITION: 'mybible:lastPosition',
};

// --- Types ---
export type Favorite = {
  id: string;           // ex: "1-1-1" (book-chapter-verse)
  book: number;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
  addedAt: number;      // timestamp
};

export type LastPosition = {
  book: number;
  bookName: string;
  chapter: number;
};

// =========== LANGUE ===========

export async function saveLanguage(lang: Language): Promise<void> {
  await AsyncStorage.setItem(KEYS.LANGUAGE, lang);
}

export async function loadLanguage(): Promise<Language> {
  const lang = await AsyncStorage.getItem(KEYS.LANGUAGE);
  return (lang as Language) ?? 'fr'; // français par défaut
}

// =========== FAVORIS ===========

export async function loadFavorites(): Promise<Favorite[]> {
  const raw = await AsyncStorage.getItem(KEYS.FAVORITES);
  if (!raw) return [];
  return JSON.parse(raw) as Favorite[];
}

export async function addFavorite(fav: Omit<Favorite, 'id' | 'addedAt'>): Promise<void> {
  const favs = await loadFavorites();
  const id = `${fav.book}-${fav.chapter}-${fav.verse}`;
  
  // Évite les doublons
  if (favs.some((f) => f.id === id)) return;
  
  const newFav: Favorite = { ...fav, id, addedAt: Date.now() };
  await AsyncStorage.setItem(KEYS.FAVORITES, JSON.stringify([newFav, ...favs]));
}

export async function removeFavorite(id: string): Promise<void> {
  const favs = await loadFavorites();
  const updated = favs.filter((f) => f.id !== id);
  await AsyncStorage.setItem(KEYS.FAVORITES, JSON.stringify(updated));
}

export async function isFavorite(book: number, chapter: number, verse: number): Promise<boolean> {
  const id = `${book}-${chapter}-${verse}`;
  const favs = await loadFavorites();
  return favs.some((f) => f.id === id);
}

// =========== DERNIÈRE POSITION ===========

export async function saveLastPosition(pos: LastPosition): Promise<void> {
  await AsyncStorage.setItem(KEYS.LAST_POSITION, JSON.stringify(pos));
}

export async function loadLastPosition(): Promise<LastPosition | null> {
  const raw = await AsyncStorage.getItem(KEYS.LAST_POSITION);
  return raw ? JSON.parse(raw) : null;
}