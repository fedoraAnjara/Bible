// services/storageService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Language } from './bibleService';

const KEYS = {
  LANGUAGE:       'mybible:language',
  FAVORITES:      'mybible:favorites',
  LAST_POSITION:  'mybible:lastPosition',
  PLAN_PROGRESS:  'mybible:planProgress',
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
};

export type LastPosition = {
  book: number;
  bookName: string;
  chapter: number;
};

export type PlanProgress = {
  planId: string;
  startedAt: number;   // timestamp du jour 1
  currentDay: number;  // jour actuel (1-based)
  completedDays: number[]; // jours marqués comme lus
};

// =========== LANGUE ===========

export async function saveLanguage(lang: Language): Promise<void> {
  await AsyncStorage.setItem(KEYS.LANGUAGE, lang);
}

export async function loadLanguage(): Promise<Language> {
  const lang = await AsyncStorage.getItem(KEYS.LANGUAGE);
  return (lang as Language) ?? 'fr';
}

// =========== FAVORIS ===========

export async function loadFavorites(): Promise<Favorite[]> {
  const raw = await AsyncStorage.getItem(KEYS.FAVORITES);
  if (!raw) return [];
  return JSON.parse(raw) as Favorite[];
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

// =========== DERNIÈRE POSITION ===========

export async function saveLastPosition(pos: LastPosition): Promise<void> {
  await AsyncStorage.setItem(KEYS.LAST_POSITION, JSON.stringify(pos));
}

export async function loadLastPosition(): Promise<LastPosition | null> {
  const raw = await AsyncStorage.getItem(KEYS.LAST_POSITION);
  return raw ? JSON.parse(raw) : null;
}

// =========== PLANS DE LECTURE ===========

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
  await AsyncStorage.setItem(
    KEYS.PLAN_PROGRESS,
    JSON.stringify([...all, newProgress])
  );
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