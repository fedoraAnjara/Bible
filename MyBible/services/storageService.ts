import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Language } from './bibleService';

const KEYS = {
  LANGUAGE:       'mybible:language',
  FAVORITES:      'mybible:favorites',
  LAST_POSITION:  'mybible:lastPosition',
  PLAN_PROGRESS:  'mybible:planProgress',
  NOTES:          'mybible:notes',
};

export type Favorite = {
  id: string;
  book: number;
  bookName: string;
  chapter: number;
  verse: number;
  endVerse?: number;
  text: string;
  addedAt: number;
  category?: string;
  categories?: string[];
};

export type LastPosition = {
  book: number;
  bookName: string;
  chapter: number;
};

export type PlanProgress = {
  planId: string;
  startedAt: number;
  currentDay: number;
  completedDays: number[];
};

export type NoteTag = 'priere' | 'etude' | 'meditation' | 'promesse' | 'temoignage' | 'question';

export type Note = {
  id: string;
  book: number;
  bookName: string;
  chapter: number;
  verse: number;
  endVerse?: number;
  verseText: string;
  content: string;
  tags: NoteTag[];
  createdAt: number;
  updatedAt: number;
};

// LANGUE

export async function saveLanguage(lang: Language): Promise<void> {
  await AsyncStorage.setItem(KEYS.LANGUAGE, lang);
}

export async function loadLanguage(): Promise<Language> {
  const lang = await AsyncStorage.getItem(KEYS.LANGUAGE);
  return (lang as Language) ?? 'fr';
}

// FAVORIS

export async function loadFavorites(): Promise<Favorite[]> {
  const raw = await AsyncStorage.getItem(KEYS.FAVORITES);
  if (!raw) return [];
  return JSON.parse(raw) as Favorite[];
}

async function saveFavorites(favorites: Favorite[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.FAVORITES, JSON.stringify(favorites));
}

export async function setFavoriteCategory(id: string, category: string): Promise<void> {
  const favs = await loadFavorites();
  const updated = favs.map(f => f.id === id ? { ...f, category } : f);
  await saveFavorites(updated);
}

export async function addFavorite(fav: Omit<Favorite, 'id' | 'addedAt'>): Promise<void> {
  const favs = await loadFavorites();
  const id = fav.endVerse
    ? `${fav.book}-${fav.chapter}-${fav.verse}-${fav.endVerse}`
    : `${fav.book}-${fav.chapter}-${fav.verse}`;
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

export async function setFavoriteCategories(id: string, categories: string[]) {
  const favorites = await loadFavorites();
  const updated = favorites.map((fav) =>
    fav.id === id ? { ...fav, categories, category: categories[0] ?? '' } : fav
  );
  await saveFavorites(updated);
}

// DERNIÈRE POSITION

export async function saveLastPosition(pos: LastPosition): Promise<void> {
  await AsyncStorage.setItem(KEYS.LAST_POSITION, JSON.stringify(pos));
}

export async function loadLastPosition(): Promise<LastPosition | null> {
  const raw = await AsyncStorage.getItem(KEYS.LAST_POSITION);
  return raw ? JSON.parse(raw) : null;
}

// PLANS DE LECTURE

export async function loadAllPlanProgress(): Promise<PlanProgress[]> {
  const raw = await AsyncStorage.getItem(KEYS.PLAN_PROGRESS);
  if (!raw) return [];
  return JSON.parse(raw) as PlanProgress[];
}

export async function loadPlanProgress(planId: string): Promise<PlanProgress | null> {
  const all = await loadAllPlanProgress();
  return all.find((p) => p.planId === planId) ?? null;
}

export async function startPlan(planId: string): Promise<PlanProgress> {
  const all = await loadAllPlanProgress();
  const existing = all.find((p) => p.planId === planId);
  if (existing) return existing;
  const newProgress: PlanProgress = {
    planId,
    startedAt: Date.now(),
    currentDay: 1,
    completedDays: [],
  };
  await AsyncStorage.setItem(KEYS.PLAN_PROGRESS, JSON.stringify([...all, newProgress]));
  return newProgress;
}

export async function markDayComplete(planId: string, day: number): Promise<void> {
  const all = await loadAllPlanProgress();
  const updated = all.map((p) => {
    if (p.planId !== planId) return p;
    const completedDays = p.completedDays.includes(day)
      ? p.completedDays
      : [...p.completedDays, day];
    const currentDay = Math.min(day + 1, p.currentDay > day ? p.currentDay : day + 1);
    return { ...p, completedDays, currentDay };
  });
  await AsyncStorage.setItem(KEYS.PLAN_PROGRESS, JSON.stringify(updated));
}

export async function resetPlan(planId: string): Promise<void> {
  const all = await loadAllPlanProgress();
  const updated = all.filter((p) => p.planId !== planId);
  await AsyncStorage.setItem(KEYS.PLAN_PROGRESS, JSON.stringify(updated));
}

// NOTES

export async function loadAllNotes(): Promise<Note[]> {
  const raw = await AsyncStorage.getItem(KEYS.NOTES);
  if (!raw) return [];
  return JSON.parse(raw) as Note[];
}

async function saveAllNotes(notes: Note[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.NOTES, JSON.stringify(notes));
}

// L'id inclut maintenant le endVerse si présent
export async function loadNote(
  book: number, chapter: number, verse: number, endVerse?: number
): Promise<Note | null> {
  const id = endVerse
    ? `${book}-${chapter}-${verse}-${endVerse}`
    : `${book}-${chapter}-${verse}`;
  const notes = await loadAllNotes();
  return notes.find((n) => n.id === id) ?? null;
}

export async function saveNote(
  data: Omit<Note, 'id' | 'createdAt' | 'updatedAt'> & { createdAt?: number }
): Promise<Note> {
  const id = data.endVerse
    ? `${data.book}-${data.chapter}-${data.verse}-${data.endVerse}`
    : `${data.book}-${data.chapter}-${data.verse}`;
  const notes = await loadAllNotes();
  const existing = notes.find((n) => n.id === id);
  const now = Date.now();

  const updated: Note = {
    ...data,
    id,
    createdAt: existing?.createdAt ?? data.createdAt ?? now,
    updatedAt: now,
  };

  const newList = existing
    ? notes.map((n) => (n.id === id ? updated : n))
    : [updated, ...notes];

  await saveAllNotes(newList);
  return updated;
}

export async function deleteNote(
  book: number, chapter: number, verse: number, endVerse?: number
): Promise<void> {
  const id = endVerse
    ? `${book}-${chapter}-${verse}-${endVerse}`
    : `${book}-${chapter}-${verse}`;
  const notes = await loadAllNotes();
  await saveAllNotes(notes.filter((n) => n.id !== id));
}

export async function hasNote(
  book: number, chapter: number, verse: number
): Promise<boolean> {
  const notes = await loadAllNotes();
  // Vérifie si un verset appartient à un passage noté
  return notes.some((n) =>
    n.book === book &&
    n.chapter === chapter &&
    n.verse <= verse &&
    (n.endVerse ?? n.verse) >= verse
  );
}