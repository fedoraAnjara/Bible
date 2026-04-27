import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, StatusBar,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useBible } from '../../context/BibleContext';
import { useState, useEffect } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { READING_PLANS } from '../../services/readingPlans';
import { loadPlanProgress, markDayComplete } from '../../services/storageService';
import type { PlanProgress } from '../../services/storageService';

const P = {
  parchment:   '#F5EDD8',
  parchmentDk: '#EDE0C0',
  parchmentLt: '#FAF4E6',
  ink:         '#2C1F0E',
  inkLight:    '#5C4020',
  inkFaint:    '#A08060',
  sepia:       '#8B6540',
};

const T = {
  fr: {
    day:       'Jour',
    read:      'Lire',
    done:      'Lu',
    markDone:  'Marquer comme lu',
    todayHint: "Aujourd'hui",
  },
  en: {
    day:       'Day',
    read:      'Read',
    done:      'Done',
    markDone:  'Mark as read',
    todayHint: 'Today',
  },
   mg: {
    day:       'Andro',
    read:      'Vakio',
    done:      'Vita',
    markDone:  'Voavaky',
    todayHint: 'Anio',
  },
};

// Noms courts des livres (pour l'affichage)
const BOOK_NAMES_FR: Record<number, string> = {
  1:'Gn', 2:'Ex', 3:'Lv', 4:'Nb', 5:'Dt', 6:'Jos', 7:'Jg', 8:'Rt',
  9:'1S', 10:'2S', 11:'1R', 12:'2R', 13:'1Ch', 14:'2Ch', 15:'Esd',
  16:'Né', 17:'Est', 18:'Jb', 19:'Ps', 20:'Pr', 21:'Ec', 22:'Ct',
  23:'És', 24:'Jr', 25:'Lm', 26:'Éz', 27:'Dn', 28:'Os', 29:'Joël',
  30:'Am', 31:'Ab', 32:'Jon', 33:'Mi', 34:'Na', 35:'Ha', 36:'So',
  37:'Ag', 38:'Za', 39:'Ml', 40:'Mt', 41:'Mc', 42:'Lc', 43:'Jn',
  44:'Ac', 45:'Rm', 46:'1Co', 47:'2Co', 48:'Ga', 49:'Ep', 50:'Ph',
  51:'Col', 52:'1Th', 53:'2Th', 54:'1Tm', 55:'2Tm', 56:'Tt', 57:'Phm',
  58:'Hé', 59:'Jc', 60:'1P', 61:'2P', 62:'1Jn', 63:'2Jn', 64:'3Jn',
  65:'Jude', 66:'Ap',
};
const BOOK_NAMES_EN: Record<number, string> = {
  1:'Gen', 2:'Ex', 3:'Lev', 4:'Num', 5:'Deut', 6:'Josh', 7:'Judg', 8:'Ruth',
  9:'1Sam', 10:'2Sam', 11:'1Kgs', 12:'2Kgs', 13:'1Chr', 14:'2Chr', 15:'Ezra',
  16:'Neh', 17:'Esth', 18:'Job', 19:'Ps', 20:'Prov', 21:'Eccl', 22:'Song',
  23:'Isa', 24:'Jer', 25:'Lam', 26:'Ezek', 27:'Dan', 28:'Hos', 29:'Joel',
  30:'Amos', 31:'Obad', 32:'Jonah', 33:'Mic', 34:'Nah', 35:'Hab', 36:'Zeph',
  37:'Hag', 38:'Zech', 39:'Mal', 40:'Matt', 41:'Mark', 42:'Luke', 43:'John',
  44:'Acts', 45:'Rom', 46:'1Cor', 47:'2Cor', 48:'Gal', 49:'Eph', 50:'Phil',
  51:'Col', 52:'1Thess', 53:'2Thess', 54:'1Tim', 55:'2Tim', 56:'Titus', 57:'Phlm',
  58:'Heb', 59:'Jas', 60:'1Pet', 61:'2Pet', 62:'1Jn', 63:'2Jn', 64:'3Jn',
  65:'Jude', 66:'Rev',
};

export default function PlanDetailScreen() {
  const { id }     = useLocalSearchParams<{ id: string }>();
  const { lang }   = useBible();
  const t          = T[lang];
  const router     = useRouter();
  const bookNames  = lang === 'fr' ? BOOK_NAMES_FR : BOOK_NAMES_EN;

  const plan = READING_PLANS.find((p) => p.id === id);
  const [progress, setProgress] = useState<PlanProgress | null>(null);

  useEffect(() => {
    if (id) loadPlanProgress(id).then(setProgress);
  }, [id]);

  if (!plan) return null;

  const completedSet = new Set(progress?.completedDays ?? []);
  const currentDay   = progress?.currentDay ?? 1;

  const color = plan.id === 'bible-1-an'  ? '#7A2010'
              : plan.id === 'nt-90'        ? '#1A3050'
              : plan.id === 'psaumes-30'   ? '#3A5030'
              : plan.id === 'proverbes-31' ? '#7A5C10'
              : '#5C3A6A';

  const handleRead = async (day: number, book: number, chapter: number) => {
    await markDayComplete(plan.id, day);
    loadPlanProgress(plan.id).then(setProgress);
    router.push({
      pathname: '/lecture/[livre]/[chapitre]',
      params: { livre: String(book), chapitre: String(chapter) },
    });
  };

  const pct = completedSet.size / plan.totalDays;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={P.parchmentDk} />
      <Stack.Screen
        options={{
          title: plan.title[lang],
          headerStyle: { backgroundColor: P.parchmentDk },
          headerTintColor: P.ink,
        }}
      />

      {/* ── Header du plan ── */}
      <View style={[styles.planHeader, { borderBottomColor: color + '40' }]}>
        <Text style={styles.planDesc}>{plan.description[lang]}</Text>
        <View style={styles.progressRow}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${pct * 100}%`, backgroundColor: color }]} />
          </View>
          <Text style={styles.progressPct}>{Math.round(pct * 100)}%</Text>
        </View>
      </View>

      {/* ── Liste des jours ── */}
      <FlatList
        data={plan.days}
        keyExtractor={(item) => String(item.day)}
        contentContainerStyle={styles.list}
        getItemLayout={(_, index) => ({ length: 60, offset: 60 * index, index })}
        initialScrollIndex={Math.max(0, currentDay - 2)}
        onScrollToIndexFailed={() => {}}
        renderItem={({ item }) => {
          const isDone    = completedSet.has(item.day);
          const isCurrent = item.day === currentDay && !isDone;
          const bookLabel = `${bookNames[item.book]} ${item.chapter}`;

          return (
            <View style={[
              styles.dayRow,
              isCurrent && { backgroundColor: color + '12' },
            ]}>
              <View style={styles.dayLeft}>
                <Text style={[styles.dayNum, isDone && { color: P.inkFaint }]}>
                  {t.day} {item.day}
                </Text>
                {isCurrent && (
                  <Text style={[styles.todayBadge, { color }]}>{t.todayHint}</Text>
                )}
              </View>

              <Text style={[styles.dayPassage, isDone && { color: P.inkFaint }]}>
                {bookLabel}
              </Text>

              <TouchableOpacity
                style={[
                  styles.dayBtn,
                  isDone
                    ? { backgroundColor: '#D4C4A0' }
                    : { backgroundColor: color },
                ]}
                onPress={() => handleRead(item.day, item.book, item.chapter)}
                activeOpacity={0.75}
              >
                {isDone
                  ? <Ionicons name="checkmark" size={15} color={P.inkFaint} />
                  : <Text style={styles.dayBtnText}>{t.read}</Text>
                }
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5EDD8' },

  planHeader: {
    padding: 16,
    backgroundColor: '#FAF4E6',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  planDesc: { fontSize: 14, color: '#5C4020', lineHeight: 21, marginBottom: 12 },

  progressRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressTrack: { flex: 1, height: 5, backgroundColor: '#D4C4A0', borderRadius: 3, overflow: 'hidden' },
  progressFill:  { height: '100%', borderRadius: 3 },
  progressPct:   { fontSize: 12, color: '#8B6540', minWidth: 36, textAlign: 'right' },

  list: { paddingVertical: 8 },

  dayRow: {
    flexDirection: 'row', alignItems: 'center',
    height: 60, paddingHorizontal: 16, gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#D4C4A088',
  },
  dayLeft:     { width: 72 },
  dayNum:      { fontSize: 13, fontWeight: '600', color: '#2C1F0E' },
  todayBadge:  { fontSize: 9, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 },
  dayPassage:  { flex: 1, fontSize: 14, color: '#2C1F0E' },

  dayBtn: {
    width: 56, height: 32, borderRadius: 7,
    alignItems: 'center', justifyContent: 'center',
  },
  dayBtnText: { color: '#FAF4E6', fontSize: 12, fontWeight: '700' },
});