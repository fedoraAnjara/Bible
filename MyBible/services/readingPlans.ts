// services/readingPlans.ts

export type PlanDay = {
  day: number;
  book: number;
  chapter: number;
  label?: string; // ex: "Genèse 1"
};

export type ReadingPlan = {
  id: string;
  title: { fr: string; en: string };
  description: { fr: string; en: string };
  totalDays: number;
  days: PlanDay[];
};

// Génère une séquence de chapitres pour un range de livres
function chaptersRange(
  segments: { book: number; chaptersCount: number }[]
): { book: number; chapter: number }[] {
  const result: { book: number; chapter: number }[] = [];
  for (const seg of segments) {
    for (let c = 1; c <= seg.chaptersCount; c++) {
      result.push({ book: seg.book, chapter: c });
    }
  }
  return result;
}

// ─── Bible en 1 an (365 jours) ───────────────────────────────
// ~3-4 chapitres par jour, AT + NT entrelacés
const BIBLE_1_AN_SEGMENTS = [
  { book: 1, chaptersCount: 50 }, { book: 2, chaptersCount: 40 },
  { book: 3, chaptersCount: 27 }, { book: 4, chaptersCount: 36 },
  { book: 5, chaptersCount: 34 }, { book: 6, chaptersCount: 24 },
  { book: 7, chaptersCount: 21 }, { book: 8, chaptersCount: 4 },
  { book: 9, chaptersCount: 31 }, { book: 10, chaptersCount: 24 },
  { book: 11, chaptersCount: 22 }, { book: 12, chaptersCount: 25 },
  { book: 13, chaptersCount: 29 }, { book: 14, chaptersCount: 36 },
  { book: 15, chaptersCount: 10 }, { book: 16, chaptersCount: 13 },
  { book: 17, chaptersCount: 10 }, { book: 18, chaptersCount: 42 },
  { book: 19, chaptersCount: 150 }, { book: 20, chaptersCount: 31 },
  { book: 21, chaptersCount: 12 }, { book: 22, chaptersCount: 8 },
  { book: 23, chaptersCount: 66 }, { book: 24, chaptersCount: 52 },
  { book: 25, chaptersCount: 5 }, { book: 26, chaptersCount: 48 },
  { book: 27, chaptersCount: 12 }, { book: 28, chaptersCount: 14 },
  { book: 29, chaptersCount: 3 }, { book: 30, chaptersCount: 9 },
  { book: 31, chaptersCount: 1 }, { book: 32, chaptersCount: 4 },
  { book: 33, chaptersCount: 7 }, { book: 34, chaptersCount: 3 },
  { book: 35, chaptersCount: 3 }, { book: 36, chaptersCount: 3 },
  { book: 37, chaptersCount: 2 }, { book: 38, chaptersCount: 14 },
  { book: 39, chaptersCount: 4 },
  { book: 40, chaptersCount: 28 }, { book: 41, chaptersCount: 16 },
  { book: 42, chaptersCount: 24 }, { book: 43, chaptersCount: 21 },
  { book: 44, chaptersCount: 28 }, { book: 45, chaptersCount: 16 },
  { book: 46, chaptersCount: 16 }, { book: 47, chaptersCount: 13 },
  { book: 48, chaptersCount: 6 }, { book: 49, chaptersCount: 6 },
  { book: 50, chaptersCount: 4 }, { book: 51, chaptersCount: 4 },
  { book: 52, chaptersCount: 5 }, { book: 53, chaptersCount: 3 },
  { book: 54, chaptersCount: 6 }, { book: 55, chaptersCount: 4 },
  { book: 56, chaptersCount: 3 }, { book: 57, chaptersCount: 1 },
  { book: 58, chaptersCount: 13 }, { book: 59, chaptersCount: 5 },
  { book: 60, chaptersCount: 5 }, { book: 61, chaptersCount: 3 },
  { book: 62, chaptersCount: 5 }, { book: 63, chaptersCount: 1 },
  { book: 64, chaptersCount: 1 }, { book: 65, chaptersCount: 1 },
  { book: 66, chaptersCount: 22 },
];

function buildBible1An(): PlanDay[] {
  const all = chaptersRange(BIBLE_1_AN_SEGMENTS);
  // On distribue les 1189 chapitres en 365 jours (~3-4 chap/jour)
  // On prend le premier chapitre de chaque groupe comme référence de navigation
  const days: PlanDay[] = [];
  const total = all.length; // ~1189
  for (let d = 0; d < 365; d++) {
    const start = Math.floor((d * total) / 365);
    const item = all[start];
    days.push({ day: d + 1, book: item.book, chapter: item.chapter });
  }
  return days;
}

// ─── Nouveau Testament en 90 jours ───────────────────────────
const NT_SEGMENTS = [
  { book: 40, chaptersCount: 28 }, { book: 41, chaptersCount: 16 },
  { book: 42, chaptersCount: 24 }, { book: 43, chaptersCount: 21 },
  { book: 44, chaptersCount: 28 }, { book: 45, chaptersCount: 16 },
  { book: 46, chaptersCount: 16 }, { book: 47, chaptersCount: 13 },
  { book: 48, chaptersCount: 6 },  { book: 49, chaptersCount: 6 },
  { book: 50, chaptersCount: 4 },  { book: 51, chaptersCount: 4 },
  { book: 52, chaptersCount: 5 },  { book: 53, chaptersCount: 3 },
  { book: 54, chaptersCount: 6 },  { book: 55, chaptersCount: 4 },
  { book: 56, chaptersCount: 3 },  { book: 57, chaptersCount: 1 },
  { book: 58, chaptersCount: 13 }, { book: 59, chaptersCount: 5 },
  { book: 60, chaptersCount: 5 },  { book: 61, chaptersCount: 3 },
  { book: 62, chaptersCount: 5 },  { book: 63, chaptersCount: 1 },
  { book: 64, chaptersCount: 1 },  { book: 65, chaptersCount: 1 },
  { book: 66, chaptersCount: 22 },
];

function buildNT90(): PlanDay[] {
  const all = chaptersRange(NT_SEGMENTS);
  const days: PlanDay[] = [];
  const total = all.length;
  for (let d = 0; d < 90; d++) {
    const start = Math.floor((d * total) / 90);
    const item = all[start];
    days.push({ day: d + 1, book: item.book, chapter: item.chapter });
  }
  return days;
}

// ─── Psaumes en 30 jours ─────────────────────────────────────
function buildPsaumes30(): PlanDay[] {
  const days: PlanDay[] = [];
  for (let d = 0; d < 30; d++) {
    // 5 psaumes par jour (150 / 30 = 5)
    const chapter = d * 5 + 1;
    days.push({ day: d + 1, book: 19, chapter });
  }
  return days;
}

// ─── Proverbes en 31 jours ───────────────────────────────────
function buildProverbes31(): PlanDay[] {
  return Array.from({ length: 31 }, (_, i) => ({
    day: i + 1,
    book: 20,
    chapter: i + 1,
  }));
}

// ─── Évangiles en 40 jours ───────────────────────────────────
const EVANGILES_SEGMENTS = [
  { book: 40, chaptersCount: 28 },
  { book: 41, chaptersCount: 16 },
  { book: 42, chaptersCount: 24 },
  { book: 43, chaptersCount: 21 },
];

function buildEvangiles40(): PlanDay[] {
  const all = chaptersRange(EVANGILES_SEGMENTS);
  const days: PlanDay[] = [];
  const total = all.length; // 89 chapitres
  for (let d = 0; d < 40; d++) {
    const start = Math.floor((d * total) / 40);
    const item = all[start];
    days.push({ day: d + 1, book: item.book, chapter: item.chapter });
  }
  return days;
}

// ─── Export ───────────────────────────────────────────────────
export const READING_PLANS: ReadingPlan[] = [
  {
    id: 'bible-1-an',
    title: { fr: 'Bible en 1 an', en: 'Bible in 1 year' },
    description: {
      fr: 'Lisez toute la Bible en 365 jours, de la Genèse à l\'Apocalypse.',
      en: 'Read the entire Bible in 365 days, from Genesis to Revelation.',
    },
    totalDays: 365,
    days: buildBible1An(),
  },
  {
    id: 'nt-90',
    title: { fr: 'Nouveau Testament en 90 jours', en: 'New Testament in 90 days' },
    description: {
      fr: 'Parcourez les 27 livres du Nouveau Testament en 3 mois.',
      en: 'Journey through all 27 books of the New Testament in 3 months.',
    },
    totalDays: 90,
    days: buildNT90(),
  },
  {
    id: 'psaumes-30',
    title: { fr: 'Psaumes en 30 jours', en: 'Psalms in 30 days' },
    description: {
      fr: '5 psaumes par jour pour un mois de louange et de méditation.',
      en: '5 psalms a day for a month of praise and meditation.',
    },
    totalDays: 30,
    days: buildPsaumes30(),
  },
  {
    id: 'proverbes-31',
    title: { fr: 'Proverbes en 31 jours', en: 'Proverbs in 31 days' },
    description: {
      fr: 'Un chapitre de Proverbes par jour pour un mois de sagesse.',
      en: 'One chapter of Proverbs a day for a month of wisdom.',
    },
    totalDays: 31,
    days: buildProverbes31(),
  },
  {
    id: 'evangiles-40',
    title: { fr: 'Évangiles en 40 jours', en: 'Gospels in 40 days' },
    description: {
      fr: 'Matthieu, Marc, Luc et Jean en 40 jours de méditation.',
      en: 'Matthew, Mark, Luke and John in 40 days of meditation.',
    },
    totalDays: 40,
    days: buildEvangiles40(),
  },
];