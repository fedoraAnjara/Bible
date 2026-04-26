import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  StatusBar,
  Animated,
} from 'react-native';
import { useRouter, useFocusEffect, useNavigation } from 'expo-router';
import { useBible } from '../../context/BibleContext';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { loadLastPosition, loadFavorites } from '../../services/storageService';
import type { LastPosition, Favorite } from '../../services/storageService';
import Ionicons from '@expo/vector-icons/Ionicons';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const TOPBAR_HEIGHT = 108;
const CARD_HEIGHT = SCREEN_HEIGHT - TOPBAR_HEIGHT - (StatusBar.currentHeight ?? 44);

const P = {
  parchment: '#F5EDD8',
  parchmentDk: '#EDE0C0',
  parchmentLt: '#FAF4E6',
  ink: '#2C1F0E',
  inkLight: '#5C4020',
  inkFaint: '#A08060',
  sepia: '#8B6540',
  rubriq: '#7A2010',
  rubriqLt: '#B04030',
  verdeGris: '#3A5030',
  azur: '#1A3050',
};

const T = {
  fr: {
    verseTag: 'Verset du jour',
    parabolTag: 'Parabole',
    miracleTag: 'Miracle',
    favoriTag: 'Favori',
    lirePassage: 'Lire le passage',
    lireChapter: 'Lire le chapitre',
    lireBible: 'Lire la Bible',
    reprendre: 'Reprendre',
    swipeHint: 'Faites glisser pour parcourir',
    parametres: 'Paramètres',
    meditation: 'Une parole pour méditer maintenant',
  },
  en: {
    verseTag: 'Verse of the day',
    parabolTag: 'Parable',
    miracleTag: 'Miracle',
    favoriTag: 'Favourite',
    lirePassage: 'Read passage',
    lireChapter: 'Read chapter',
    lireBible: 'Read the Bible',
    reprendre: 'Resume',
    swipeHint: 'Swipe to explore',
    parametres: 'Settings',
    meditation: 'A word to meditate on now',
  },
};

const VERSE_DU_JOUR = {
  fr: [
    { ref: 'Jean 3:16', text: 'Car Dieu a tant aimé le monde qu’il a donné son Fils unique, afin que quiconque croit en lui ne périsse point, mais qu’il ait la vie éternelle.', book: 43, chapter: 3, verse: 16 },
    { ref: 'Philippiens 4:13', text: 'Je puis tout par celui qui me fortifie.', book: 50, chapter: 4, verse: 13 },
    { ref: 'Psaumes 23:1', text: 'L’Éternel est mon berger : je ne manquerai de rien.', book: 19, chapter: 23, verse: 1 },
    { ref: 'Romains 8:28', text: 'Toutes choses concourent au bien de ceux qui aiment Dieu.', book: 45, chapter: 8, verse: 28 },
    { ref: 'Josué 1:9', text: 'Sois fort et courageux. Ne t’effraie point, car l’Éternel est avec toi.', book: 6, chapter: 1, verse: 9 },
    { ref: 'Matthieu 11:28', text: 'Venez à moi, vous tous qui êtes fatigués, et je vous donnerai du repos.', book: 40, chapter: 11, verse: 28 },
    { ref: 'Ésaïe 40:31', text: 'Ceux qui se confient en l’Éternel renouvellent leur force.', book: 23, chapter: 40, verse: 31 },
  ],
  en: [
    { ref: 'John 3:16', text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.', book: 43, chapter: 3, verse: 16 },
    { ref: 'Philippians 4:13', text: 'I can do all things through Christ which strengtheneth me.', book: 50, chapter: 4, verse: 13 },
    { ref: 'Psalm 23:1', text: 'The LORD is my shepherd; I shall not want.', book: 19, chapter: 23, verse: 1 },
    { ref: 'Romans 8:28', text: 'All things work together for good to them that love God.', book: 45, chapter: 8, verse: 28 },
    { ref: 'Joshua 1:9', text: 'Be strong and of a good courage; be not afraid, for the LORD thy God is with thee.', book: 6, chapter: 1, verse: 9 },
    { ref: 'Matthew 11:28', text: 'Come unto me, all ye that labour and are heavy laden, and I will give you rest.', book: 40, chapter: 11, verse: 28 },
    { ref: 'Isaiah 40:31', text: 'They that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles.', book: 23, chapter: 40, verse: 31 },
  ],
};

const PARABOLES = {
  fr: [
    { titre: 'Le Fils prodigue', theme: 'Grâce & Pardon', ref: 'Luc 15:11-32', resume: 'Un père court vers son fils égaré qui revient repentant. Cette parabole révèle le cœur du Père céleste.', quote: 'Mon fils que voici était mort, et il est revenu à la vie ; il était perdu, et il est retrouvé.', quoteRef: 'Luc 15:24', book: 42, chapter: 15, startVerse: 11, endVerse: 32 },
    { titre: 'Le Bon Samaritain', theme: 'Amour du Prochain', ref: 'Luc 10:25-37', resume: 'Un étranger méprisé secourt un blessé laissé pour mort. Jésus redéfinit qui est notre prochain.', quote: 'Va, et toi, fais de même.', quoteRef: 'Luc 10:37', book: 42, chapter: 10, startVerse: 25, endVerse: 37 },
    { titre: 'Le Semeur', theme: 'La Parole de Dieu', ref: 'Matthieu 13:1-23', resume: 'Quatre types de terrain, quatre destinées pour la même semence.', quote: 'Celui qui entend la parole et la comprend.', quoteRef: 'Mt 13:23', book: 40, chapter: 13, startVerse: 1, endVerse: 23 },
  ],
  en: [
    { titre: 'The Prodigal Son', theme: 'Grace & Forgiveness', ref: 'Luke 15:11-32', resume: 'A father runs toward his lost son who returns repentant.', quote: 'This my son was dead, and is alive again.', quoteRef: 'Luke 15:24', book: 42, chapter: 15, startVerse: 11, endVerse: 32 },
    { titre: 'The Good Samaritan', theme: 'Love of Neighbour', ref: 'Luke 10:25-37', resume: 'A despised stranger rescues a wounded man left for dead.', quote: 'Go and do thou likewise.', quoteRef: 'Luke 10:37', book: 42, chapter: 10, startVerse: 25, endVerse: 37 },
    { titre: 'The Sower', theme: 'The Word of God', ref: 'Matthew 13:1-23', resume: 'Four types of ground, four destinies for the same seed.', quote: 'He that heareth the word, and understandeth it.', quoteRef: 'Mt 13:23', book: 40, chapter: 13, startVerse: 1, endVerse: 23 },
  ],
};

const MIRACLES = {
  fr: [
    { titre: 'Les Noces de Cana', theme: 'Gloire révélée', ref: 'Jean 2:1-11', resume: 'Jésus transforme l’eau en vin lors d’un festin de noces.', quote: 'Il changea l’eau en vin.', quoteRef: 'Jean 2:11', book: 43, chapter: 2, startVerse: 1, endVerse: 11 },
    { titre: 'La Tempête Apaisée', theme: 'Seigneur des éléments', ref: 'Marc 4:35-41', resume: 'Jésus commande aux vents et à la mer, et la tempête s’apaise.', quote: 'Silence ! Tais-toi !', quoteRef: 'Marc 4:39', book: 41, chapter: 4, startVerse: 35, endVerse: 41 },
    { titre: 'La Marche sur les Eaux', theme: 'Foi & Doute', ref: 'Matthieu 14:22-33', resume: 'Jésus marche sur la mer vers ses disciples au cœur de la nuit.', quote: 'Homme de peu de foi, pourquoi as-tu douté ?', quoteRef: 'Mt 14:31', book: 40, chapter: 14, startVerse: 22, endVerse: 33 },
  ],
  en: [
    { titre: 'Wedding at Cana', theme: 'Glory Revealed', ref: 'John 2:1-11', resume: 'Jesus turns water into wine at a wedding feast.', quote: 'He changed the water into wine.', quoteRef: 'John 2:11', book: 43, chapter: 2, startVerse: 1, endVerse: 11 },
    { titre: 'Calming the Storm', theme: 'Lord of Creation', ref: 'Mark 4:35-41', resume: 'Jesus commands the wind and sea, and there is calm.', quote: 'Peace, be still.', quoteRef: 'Mark 4:39', book: 41, chapter: 4, startVerse: 35, endVerse: 41 },
    { titre: 'Walking on Water', theme: 'Faith & Doubt', ref: 'Matthew 14:22-33', resume: 'Jesus walks on the sea toward the disciples.', quote: 'O thou of little faith, wherefore didst thou doubt?', quoteRef: 'Mt 14:31', book: 40, chapter: 14, startVerse: 22, endVerse: 33 },
  ],
};

type VerseData = {
  ref: string;
  text: string;
  book: number;
  chapter: number;
  verse: number;
};

type PassageData = {
  titre: string;
  theme: string;
  ref: string;
  resume: string;
  quote: string;
  quoteRef: string;
  book: number;
  chapter: number;
  startVerse: number;
  endVerse: number;
};

type Translations = typeof T['fr'];

type CardData =
  | { type: 'verse'; data: VerseData }
  | { type: 'parabole'; data: PassageData }
  | { type: 'miracle'; data: PassageData }
  | { type: 'favori'; data: Favorite };

function getRandomVerseIndex(lang: 'fr' | 'en') {
  return Math.floor(Math.random() * VERSE_DU_JOUR[lang].length);
}

function Rule({ color = '#8B654060' }: { color?: string }) {
  return <View style={[styles.rule, { borderColor: color }]} />;
}

function Dropcap({ letter, color }: { letter: string; color: string }) {
  return (
    <View style={[styles.dropcap, { borderColor: color + '55' }]}>
      <Text style={[styles.dropcapLetter, { color }]}>{letter}</Text>
    </View>
  );
}

function VerseCard({ data, t, onRead }: { data: VerseData; t: Translations; onRead: () => void }) {
  const firstLetter = data.text[0];
  const rest = data.text.slice(1);

  return (
    <View style={[styles.card, { backgroundColor: P.parchmentLt }]}>
      <View style={[styles.pageEdge, styles.pageEdgeLeft, { backgroundColor: P.parchmentDk }]} />
      <View style={[styles.pageEdge, styles.pageEdgeRight, { backgroundColor: P.parchmentDk }]} />

      <View style={styles.verseCardBox}>
        <View style={styles.verseIconCircle}>
          <Ionicons name="book-outline" size={30} color={P.rubriq} />
        </View>

        <Text style={[styles.categoryTag, { color: P.rubriq }]}>{t.verseTag}</Text>
        <Text style={styles.verseTodaySub}>{t.meditation}</Text>

        <Rule />

        <View style={styles.verseBodyRow}>
          <Dropcap letter={firstLetter} color={P.rubriq} />
          <Text style={styles.verseBodyText}>{rest}</Text>
        </View>

        <Rule />

        <Text style={styles.verseRef}>{data.ref}</Text>

        <TouchableOpacity onPress={onRead} activeOpacity={0.75} style={styles.verseMainButton}>
          <Text style={styles.verseMainButtonText}>{t.lirePassage}</Text>
          <Ionicons name="arrow-forward" size={15} color={P.parchmentLt} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function PassageCard({
  data,
  onRead,
  t,
  type,
}: {
  data: PassageData;
  onRead: () => void;
  t: Translations;
  type: 'parabole' | 'miracle';
}) {
  const color = type === 'parabole' ? P.verdeGris : P.azur;
  const tag = type === 'parabole' ? t.parabolTag : t.miracleTag;

  return (
    <View style={[styles.card, { backgroundColor: P.parchment }]}>
      <View style={[styles.pageEdge, styles.pageEdgeLeft, { backgroundColor: P.parchmentDk }]} />
      <View style={[styles.pageEdge, styles.pageEdgeRight, { backgroundColor: P.parchmentDk }]} />

      <View style={styles.cardInner}>
        <Text style={[styles.categoryTag, { color }]}>{tag}</Text>
        <Rule color={P.sepia + '50'} />

        <Text style={[styles.themeLabel, { color: color + 'BB' }]}>
          {data.theme.toUpperCase()}
        </Text>

        <Text style={styles.passageTitle}>{data.titre}</Text>
        <Text style={[styles.passageRef, { color }]}>{data.ref}</Text>

        <View style={[styles.marginNote, { borderLeftColor: color + '60' }]}>
          <Text style={styles.marginText}>{data.resume}</Text>
        </View>

        <View style={[styles.quoteBlock, { borderColor: color + '40', backgroundColor: color + '08' }]}>
          <Text style={[styles.quoteMarks, { color: color + '60' }]}>“</Text>
          <Text style={styles.quoteText}>{data.quote}</Text>
          <Text style={[styles.quoteRef, { color }]}>{data.quoteRef}</Text>
        </View>

        <Rule color={P.sepia + '40'} />

        <TouchableOpacity onPress={onRead} activeOpacity={0.6} style={styles.lireLink}>
          <Text style={[styles.lireLinkText, { color }]}>{t.lirePassage}</Text>
          <Ionicons name="arrow-forward" size={12} color={color} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function FavoriCard({ data, onRead, t }: { data: Favorite; onRead: () => void; t: Translations }) {
  return (
    <View style={[styles.card, { backgroundColor: P.parchmentLt }]}>
      <View style={[styles.pageEdge, styles.pageEdgeLeft, { backgroundColor: P.parchmentDk }]} />
      <View style={[styles.pageEdge, styles.pageEdgeRight, { backgroundColor: P.parchmentDk }]} />

      <View style={styles.cardInner}>
        <Text style={[styles.categoryTag, { color: P.rubriqLt }]}>{t.favoriTag}</Text>
        <Rule />

        <Text style={[styles.passageTitle, { fontWeight: '400', fontSize: 16 }]}>
          {data.bookName} {data.chapter}:{data.verse}
        </Text>

        <Text style={[styles.verseBodyText, { fontSize: 17, lineHeight: 28 }]}>
          {data.text}
        </Text>

        <Rule />

        <TouchableOpacity onPress={onRead} activeOpacity={0.6} style={styles.lireLink}>
          <Text style={[styles.lireLinkText, { color: P.rubriqLt }]}>{t.lireChapter}</Text>
          <Ionicons name="arrow-forward" size={12} color={P.rubriqLt} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function AccueilScreen() {
  const { lang } = useBible();
  const t = T[lang];
  const router = useRouter();
  const navigation = useNavigation<any>();

  const [lastPos, setLastPos] = useState<LastPosition | null>(null);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [verseIndex, setVerseIndex] = useState(() => getRandomVerseIndex(lang));
  const [refreshingVisual, setRefreshingVisual] = useState(false);

  const listRef = useRef<FlatList<CardData>>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const loaderAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setVerseIndex(getRandomVerseIndex(lang));
  }, [lang]);

  const verseOfDay = useMemo(() => {
    return VERSE_DU_JOUR[lang][verseIndex % VERSE_DU_JOUR[lang].length];
  }, [lang, verseIndex]);

  const baseCards: CardData[] = useMemo(() => {
    const feed: CardData[] = [];

    feed.push({ type: 'verse', data: verseOfDay });

    const paraboles = PARABOLES[lang];
    const miracles = MIRACLES[lang];
    const maxItems = Math.max(paraboles.length, miracles.length);

    for (let i = 0; i < maxItems; i++) {
      if (i < paraboles.length) feed.push({ type: 'parabole', data: paraboles[i] });
      if (i < miracles.length) feed.push({ type: 'miracle', data: miracles[i] });
    }

    favorites.slice(0, 3).forEach((f) => feed.push({ type: 'favori', data: f }));

    return feed;
  }, [verseOfDay, favorites, lang]);

  const LOOP_OFFSET = baseCards.length;

  const cards = useMemo(() => {
    return [...baseCards, ...baseCards, ...baseCards];
  }, [baseCards]);

  const refreshAccueil = useCallback(
    (changeVerse = false) => {
      loadLastPosition().then(setLastPos);
      loadFavorites().then(setFavorites);

      if (changeVerse) {
        setVerseIndex(getRandomVerseIndex(lang));
      }

      if (LOOP_OFFSET > 0) {
        setTimeout(() => {
          listRef.current?.scrollToIndex({
            index: LOOP_OFFSET,
            animated: false,
          });
        }, 100);
      }
    },
    [LOOP_OFFSET, lang]
  );

  const animateRefresh = useCallback(() => {
    setRefreshingVisual(true);

    loaderAnim.setValue(0);

    Animated.parallel([
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.35,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(loaderAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setRefreshingVisual(false);
    });

    refreshAccueil(true);
  }, [fadeAnim, loaderAnim, refreshAccueil]);

    useFocusEffect(
      useCallback(() => {
        loadLastPosition().then(setLastPos);
        loadFavorites().then(setFavorites);
      }, [])
    );

    useEffect(() => {
      const unsubscribe = navigation.addListener('tabPress', () => {
        animateRefresh();
      });

      return unsubscribe;
    }, [navigation, animateRefresh]);

  const onLayout = useCallback(() => {
    if (LOOP_OFFSET > 0) {
      listRef.current?.scrollToIndex({
        index: LOOP_OFFSET,
        animated: false,
      });
    }
  }, [LOOP_OFFSET]);

  const onMomentumScrollEnd = useCallback(
    (e: any) => {
      const index = Math.round(e.nativeEvent.contentOffset.y / CARD_HEIGHT);

      if (index <= 2) {
        listRef.current?.scrollToIndex({
          index: index + LOOP_OFFSET,
          animated: false,
        });
      } else if (index >= cards.length - 3) {
        listRef.current?.scrollToIndex({
          index: index - LOOP_OFFSET,
          animated: false,
        });
      }
    },
    [cards.length, LOOP_OFFSET]
  );

  const goToPassage = (
    book: number,
    chapter: number,
    startVerse?: number,
    endVerse?: number
  ) => {
    router.push({
      pathname: '/lecture/[livre]/[chapitre]',
      params: {
        livre: String(book),
        chapitre: String(chapter),
        ...(startVerse ? { start: String(startVerse) } : {}),
        ...(endVerse ? { end: String(endVerse) } : {}),
      },
    });
  };

  const renderCard = ({ item }: { item: CardData }) => {
    switch (item.type) {
      case 'verse':
        return (
          <VerseCard
            data={item.data}
            t={t}
            onRead={() =>
              goToPassage(
                item.data.book,
                item.data.chapter,
                item.data.verse,
                item.data.verse
              )
            }
          />
        );

      case 'parabole':
        return (
          <PassageCard
            type="parabole"
            data={item.data}
            t={t}
            onRead={() =>
              goToPassage(
                item.data.book,
                item.data.chapter,
                item.data.startVerse,
                item.data.endVerse
              )
            }
          />
        );

      case 'miracle':
        return (
          <PassageCard
            type="miracle"
            data={item.data}
            t={t}
            onRead={() =>
              goToPassage(
                item.data.book,
                item.data.chapter,
                item.data.startVerse,
                item.data.endVerse
              )
            }
          />
        );

      case 'favori':
        return (
          <FavoriCard
            data={item.data}
            t={t}
            onRead={() =>
              goToPassage(
                item.data.book,
                item.data.chapter,
                item.data.verse,
                item.data.verse
              )
            }
          />
        );
    }
  };

  const spin = loaderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={P.parchmentDk} />

      <View style={styles.topBar}>
        <View style={styles.topRow}>
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={() => router.push('/parametres')}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={15} color={P.parchmentLt} />
            <Text style={styles.btnPrimaryText}>{t.parametres}</Text>
          </TouchableOpacity>

          {lastPos ? (
            <TouchableOpacity
              style={styles.btnSecondary}
              onPress={() => goToPassage(lastPos.book, lastPos.chapter)}
              activeOpacity={0.7}
            >
              <Ionicons name="reload-outline" size={14} color={P.inkLight} />
              <Text style={styles.btnSecondaryText} numberOfLines={1}>
                {t.reprendre} · {lastPos.bookName} {lastPos.chapter}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.btnSecondary}
              onPress={() => router.push('/(tabs)/livres')}
              activeOpacity={0.7}
            >
              <Ionicons name="book-outline" size={14} color={P.inkLight} />
              <Text style={styles.btnSecondaryText}>{t.lireBible}</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.swipeHint}>{t.swipeHint}</Text>
      </View>

      {refreshingVisual && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.refreshBadge,
            {
              opacity: loaderAnim,
              transform: [{ rotate: spin }],
            },
          ]}
        >
          <Ionicons name="refresh" size={22} color={P.rubriq} />
        </Animated.View>
      )}

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <FlatList
          ref={listRef}
          data={cards}
          keyExtractor={(_, i) => String(i)}
          renderItem={renderCard}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToInterval={CARD_HEIGHT}
          decelerationRate="fast"
          onLayout={onLayout}
          onMomentumScrollEnd={onMomentumScrollEnd}
          getItemLayout={(_, index) => ({
            length: CARD_HEIGHT,
            offset: CARD_HEIGHT * index,
            index,
          })}
          onScrollToIndexFailed={() => {}}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: P.parchment,
  },

  refreshBadge: {
    position: 'absolute',
    top: TOPBAR_HEIGHT + 14,
    alignSelf: 'center',
    zIndex: 50,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFF8EC',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#8B654055',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },

  topBar: {
    height: TOPBAR_HEIGHT,
    backgroundColor: P.parchmentDk,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#8B654070',
    justifyContent: 'space-between',
  },

  topRow: {
    flexDirection: 'row',
    gap: 10,
  },

  btnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: P.ink,
    borderRadius: 5,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },

  btnPrimaryText: {
    color: P.parchmentLt,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  btnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 5,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#8B654090',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },

  btnSecondaryText: {
    textAlign: 'center',
    color: P.inkLight,
    fontSize: 13,
    fontWeight: '500',
  },

  swipeHint: {
    fontSize: 10,
    color: P.inkFaint,
    textAlign: 'center',
    letterSpacing: 0.8,
  },

  card: {
    height: CARD_HEIGHT,
    width: SCREEN_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },

  pageEdge: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 22,
  },

  pageEdgeLeft: {
    left: 0,
  },

  pageEdgeRight: {
    right: 0,
  },

  cardInner: {
    width: SCREEN_WIDTH - 72,
    alignItems: 'stretch',
  },

  verseCardBox: {
    width: SCREEN_WIDTH - 58,
    minHeight: CARD_HEIGHT * 0.72,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 28,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
 
  verseIconCircle: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#7A201055',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    backgroundColor: '#F5EDD8',
  },

  verseTodaySub: {
    textAlign: 'center',
    color: P.inkFaint,
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: -4,
    marginBottom: 8,
  },

  categoryTag: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 3.5,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 12,
  },

  rule: {
    height: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginVertical: 20,
  },

  dropcap: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginBottom: 2,
    alignSelf: 'flex-start',
  },

  dropcapLetter: {
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 34,
  },

  verseBodyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },

  verseBodyText: {
    flex: 1,
    fontSize: 18,
    lineHeight: 30,
    color: P.ink,
    fontStyle: 'italic',
    letterSpacing: 0.15,
  },

  verseRef: {
    fontSize: 12,
    color: P.sepia,
    textAlign: 'right',
    letterSpacing: 1.5,
    fontStyle: 'italic',
  },

  verseMainButton: {
    marginTop: 18,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: P.rubriq,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
  },

  verseMainButtonText: {
    color: P.parchmentLt,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  themeLabel: {
    fontSize: 9,
    letterSpacing: 3,
    color: P.inkFaint,
    textAlign: 'center',
    marginBottom: 6,
  },

  passageTitle: {
    fontSize: 21,
    fontWeight: '300',
    color: P.ink,
    textAlign: 'center',
    letterSpacing: 0.4,
    marginBottom: 4,
  },

  passageRef: {
    fontSize: 10,
    letterSpacing: 2.5,
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: 22,
  },

  marginNote: {
    borderLeftWidth: 2,
    paddingLeft: 14,
    marginBottom: 12,
  },

  marginText: {
    fontSize: 15,
    lineHeight: 26,
    fontStyle: 'italic',
    color: P.inkLight,
  },

  quoteBlock: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 3,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 10,
    marginBottom: 4,
  },

  quoteMarks: {
    fontSize: 32,
    lineHeight: 28,
    fontWeight: '300',
    marginBottom: 2,
  },

  quoteText: {
    fontSize: 14,
    lineHeight: 23,
    fontStyle: 'italic',
    color: P.ink,
    marginBottom: 8,
  },

  quoteRef: {
    fontSize: 10,
    letterSpacing: 1.5,
    textAlign: 'right',
    textTransform: 'uppercase',
  },

  lireLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 5,
    marginTop: 2,
  },

  lireLinkText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});