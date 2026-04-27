import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, StatusBar,
} from 'react-native';
import { useRouter, Stack, useFocusEffect } from 'expo-router';
import { useBible } from '../../context/BibleContext';
import { useCallback, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { READING_PLANS } from '../../services/readingPlans';
import type { ReadingPlan } from '../../services/readingPlans';
import {
  loadAllPlanProgress, startPlan, resetPlan,
} from '../../services/storageService';
import type { PlanProgress } from '../../services/storageService';

const P = {
  parchment:   '#F5EDD8',
  parchmentDk: '#EDE0C0',
  parchmentLt: '#FAF4E6',
  ink:         '#2C1F0E',
  inkLight:    '#5C4020',
  inkFaint:    '#A08060',
  sepia:       '#8B6540',
  rubriq:      '#7A2010',
  verdeGris:   '#3A5030',
  azur:        '#1A3050',
};

const T = {
  fr: {
    title:       'Plans de lecture',
    active:      'En cours',
    available:   'Plans disponibles',
    dayOf:       'Jour',
    on:          'sur',
    start:       'Commencer',
    resume:      'Reprendre le jour',
    reset:       'Recommencer',
    completed:   'Terminé',
    progress:    'de progression',
    confirmReset:'Recommencer ce plan ?',
  },
  en: {
    title:       'Reading Plans',
    active:      'In progress',
    available:   'Available plans',
    dayOf:       'Day',
    on:          'of',
    start:       'Start',
    resume:      'Continue day',
    reset:       'Restart',
    completed:   'Completed',
    progress:    'progress',
    confirmReset:'Restart this plan?',
  },
    mg: {
    title:       'Lahatra vakiteny',
    active:      'Andalana',
    available:   'lahatra azo atao',
    dayOf:       'Andro',
    on:          'Ny',
    start:       'Fiantombohany',
    resume:      'Andro manaraka',
    reset:       'Averina',
    completed:   'Vita',
    progress:    'Andalana',
    confirmReset:'Tianao averina ve?',
  },
};

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${Math.min(value * 100, 100)}%`, backgroundColor: color }]} />
    </View>
  );
}

function PlanCard({
  plan, progress, lang, onStart, onResume, onReset,
}: {
  plan: ReadingPlan;
  progress: PlanProgress | null;
  lang: 'fr' | 'en' | 'mg';
  onStart: () => void;
  onResume: () => void;
  onReset: () => void;
}) {
  const t = T[lang];
  const isStarted   = !!progress;
  const isCompleted = isStarted && progress!.currentDay > plan.totalDays;
  const pct         = isStarted ? progress!.completedDays.length / plan.totalDays : 0;
  const color       = plan.id === 'bible-1-an'   ? P.rubriq
                    : plan.id === 'nt-90'         ? P.azur
                    : plan.id === 'psaumes-30'    ? P.verdeGris
                    : plan.id === 'proverbes-31'  ? '#7A5C10'
                    : '#5C3A6A';

  return (
    <View style={[styles.planCard, { borderLeftColor: color, borderLeftWidth: 3 }]}>
      <View style={styles.planCardTop}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.planTitle, { color: P.ink }]}>{plan.title[lang]}</Text>
          <Text style={styles.planDesc}>{plan.description[lang]}</Text>
        </View>
        {isStarted && !isCompleted && (
          <View style={[styles.dayBadge, { backgroundColor: color + '18' }]}>
            <Text style={[styles.dayBadgeText, { color }]}>
              {t.dayOf} {progress!.currentDay}/{plan.totalDays}
            </Text>
          </View>
        )}
        {isCompleted && (
          <View style={[styles.dayBadge, { backgroundColor: color + '18' }]}>
            <Text style={[styles.dayBadgeText, { color }]}>{t.completed} ✓</Text>
          </View>
        )}
      </View>

      {isStarted && (
        <View style={styles.progressRow}>
          <ProgressBar value={pct} color={color} />
          <Text style={styles.progressPct}>{Math.round(pct * 100)}%</Text>
        </View>
      )}

      <View style={styles.planCardActions}>
        {!isStarted ? (
          <TouchableOpacity style={[styles.btnAction, { backgroundColor: color }]} onPress={onStart} activeOpacity={0.75}>
            <Text style={styles.btnActionText}>{t.start}</Text>
          </TouchableOpacity>
        ) : (
          <>
            {!isCompleted && (
              <TouchableOpacity style={[styles.btnAction, { backgroundColor: color }]} onPress={onResume} activeOpacity={0.75}>
                <Text style={styles.btnActionText}>{t.resume} {progress!.currentDay}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.btnReset} onPress={onReset} activeOpacity={0.75}>
              <Ionicons name="refresh-outline" size={13} color={P.inkFaint} />
              <Text style={styles.btnResetText}>{t.reset}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

export default function PlansScreen() {
  const { lang }   = useBible();
  const t          = T[lang];
  const router     = useRouter();
  const [allProgress, setAllProgress] = useState<PlanProgress[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadAllPlanProgress().then(setAllProgress);
    }, [])
  );

  const getProgress = (planId: string) =>
    allProgress.find((p) => p.planId === planId) ?? null;

  const handleStart = async (planId: string) => {
    await startPlan(planId);
    const updated = await loadAllPlanProgress();
    setAllProgress(updated);
    // Navigue vers l'écran de détail
    router.push({ pathname: '/plans/[id]', params: { id: planId } });
  };

  const handleResume = (planId: string) => {
    router.push({ pathname: '/plans/[id]', params: { id: planId } });
  };

  const handleReset = async (planId: string) => {
    await resetPlan(planId);
    const updated = await loadAllPlanProgress();
    setAllProgress(updated);
  };

  const activePlans   = READING_PLANS.filter((p) => getProgress(p.id));
  const availablePlans = READING_PLANS.filter((p) => !getProgress(p.id));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={P.parchmentDk} />
      <Stack.Screen options={{ title: t.title, headerStyle: { backgroundColor: P.parchmentDk }, headerTintColor: P.ink }} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {activePlans.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>{t.active}</Text>
            {activePlans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                progress={getProgress(plan.id)}
                lang={lang}
                onStart={() => handleStart(plan.id)}
                onResume={() => handleResume(plan.id)}
                onReset={() => handleReset(plan.id)}
              />
            ))}
          </>
        )}

        <Text style={styles.sectionLabel}>{t.available}</Text>
        {availablePlans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            progress={null}
            lang={lang}
            onStart={() => handleStart(plan.id)}
            onResume={() => handleResume(plan.id)}
            onReset={() => handleReset(plan.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5EDD8' },
  scroll:    { padding: 16, paddingBottom: 40 },

  sectionLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 3,
    textTransform: 'uppercase', color: '#8B6540',
    marginTop: 20, marginBottom: 12,
  },

  planCard: {
    backgroundColor: '#FAF4E6',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D4C4A0',
  },
  planCardTop:  { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  planTitle:    { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  planDesc:     { fontSize: 13, color: '#5C4020', lineHeight: 19 },

  dayBadge:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  dayBadgeText: { fontSize: 11, fontWeight: '700' },

  progressRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  progressTrack:{ flex: 1, height: 4, backgroundColor: '#D4C4A0', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  progressPct:  { fontSize: 11, color: '#8B6540', minWidth: 32, textAlign: 'right' },

  planCardActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  btnAction: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 7, alignItems: 'center',
  },
  btnActionText: { color: '#FAF4E6', fontSize: 13, fontWeight: '700' },

  btnReset: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 8 },
  btnResetText: { fontSize: 12, color: '#A08060' },
});