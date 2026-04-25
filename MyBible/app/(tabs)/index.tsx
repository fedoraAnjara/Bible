import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, FlatList, StatusBar,
} from 'react-native';
import { useRouter, Stack, useFocusEffect } from 'expo-router';
import { useBible } from '../../context/BibleContext';
import { useCallback, useState, useMemo, useRef } from 'react';
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

const VERSE_DU_JOUR = [
  { ref: 'Jean 3:16', text: "Car Dieu a tant aimé le monde qu'il a donné son Fils unique, afin que quiconque croit en lui ne périsse point, mais qu'il ait la vie éternelle." },
  { ref: 'Philippiens 4:13', text: 'Je puis tout par celui qui me fortifie.' },
  { ref: 'Psaumes 23:1', text: "L'Éternel est mon berger : je ne manquerai de rien." },
  { ref: 'Romains 8:28', text: 'Toutes choses concourent au bien de ceux qui aiment Dieu.' },
  { ref: 'Josué 1:9', text: "Sois fort et courageux. Ne t'effraie point, car l'Éternel, ton Dieu, est avec toi." },
  { ref: 'Matthieu 11:28', text: 'Venez à moi, vous tous qui êtes fatigués et chargés, et je vous donnerai du repos.' },
  { ref: 'Ésaïe 40:31', text: "Ceux qui se confient en l'Éternel renouvellent leur force. Ils prennent le vol comme les aigles." },
];

const PARABOLES = [
  {
    titre: 'Le Fils prodigue',
    ref: 'Luc 15:11-32',
    resume: "Un père accueille avec joie son fils perdu qui revient repentant. Image de la grâce infinie de Dieu.",
    book: 42,
    chapter: 15,
    startVerse: 11,
    endVerse: 32,
  },
  {
    titre: 'Le Bon Samaritain',
    ref: 'Luc 10:25-37',
    resume: "Un étranger secourt un blessé ignoré par les religieux. Jésus redéfinit qui est notre prochain.",
    book: 42,
    chapter: 10,
    startVerse: 25,
    endVerse: 37,
  },
  {
    titre: 'Le Semeur',
    ref: 'Matthieu 13:1-23',
    resume: "La Parole de Dieu tombe sur différents types de cœurs. Certains portent du fruit, d'autres non.",
    book: 40,
    chapter: 13,
    startVerse: 1,
    endVerse: 23,
  },
  {
    titre: 'Les Talents',
    ref: 'Matthieu 25:14-30',
    resume: "Trois serviteurs reçoivent des talents. Fidélité dans le peu mène à la récompense.",
    book: 40,
    chapter: 25,
    startVerse: 14,
    endVerse: 30,
  },
  {
    titre: 'La Brebis Perdue',
    ref: 'Luc 15:1-7',
    resume: "Le berger quitte les 99 pour chercher la brebis perdue. Dieu se réjouit pour chaque pécheur repentant.",
    book: 42,
    chapter: 15,
    startVerse: 1,
    endVerse: 7,
  },
  {
    titre: 'Le Pharisien et le Péager',
    ref: 'Luc 18:9-14',
    resume: "L'humilité du péager est exaltée, l'orgueil du pharisien est condamné.",
    book: 42,
    chapter: 18,
    startVerse: 9,
    endVerse: 14,
  },
  {
    titre: 'Les Dix Vierges',
    ref: 'Matthieu 25:1-13',
    resume: "Cinq vierges sages préparent leurs lampes, cinq insensées sont exclues. Soyez prêts.",
    book: 40,
    chapter: 25,
    startVerse: 1,
    endVerse: 13,
  },
  {
    titre: 'Le Grain de Sénevé',
    ref: 'Matthieu 13:31-32',
    resume: "Le royaume de Dieu commence petit comme une graine mais devient grand comme un arbre.",
    book: 40,
    chapter: 13,
    startVerse: 31,
    endVerse: 32,
  },
];

const MIRACLES = [
  {
    titre: 'Les Noces de Cana',
    ref: 'Jean 2:1-11',
    resume: "Jésus transforme l'eau en vin. Son premier miracle révèle sa gloire divine.",
    book: 43,
    chapter: 2,
    startVerse: 1,
    endVerse: 11,
  },
  {
    titre: 'Multiplication des Pains',
    ref: 'Jean 6:1-14',
    resume: "5 pains et 2 poissons nourrissent 5000 hommes. Jésus, pain de vie, subvient à tout besoin.",
    book: 43,
    chapter: 6,
    startVerse: 1,
    endVerse: 14,
  },
  {
    titre: 'Résurrection de Lazare',
    ref: 'Jean 11:1-44',
    resume: 'Lazare mort depuis 4 jours ressuscite. Jésus déclare : "Je suis la résurrection et la vie."',
    book: 43,
    chapter: 11,
    startVerse: 1,
    endVerse: 44,
  },
  {
    titre: 'La Tempête Apaisée',
    ref: 'Marc 4:35-41',
    resume: 'Jésus commande aux vents et à la mer. Les disciples s\'écrient : "Qui est-il donc ?"',
    book: 41,
    chapter: 4,
    startVerse: 35,
    endVerse: 41,
  },
  {
    titre: 'La Marche sur les Eaux',
    ref: 'Matthieu 14:22-33',
    resume: 'Jésus marche sur la mer et saisit Pierre qui coule. "Homme de peu de foi, pourquoi as-tu douté ?"',
    book: 40,
    chapter: 14,
    startVerse: 22,
    endVerse: 33,
  },
  {
    titre: 'Les Dix Lépreux Guéris',
    ref: 'Luc 17:11-19',
    resume: "Dix lépreux sont guéris mais un seul revient remercier. La gratitude est rare et précieuse.",
    book: 42,
    chapter: 17,
    startVerse: 11,
    endVerse: 19,
  },
  {
    titre: "L'Aveugle de Naissance",
    ref: 'Jean 9:1-41',
    resume: 'Jésus guérit un aveugle de naissance avec de la boue. "Je suis la lumière du monde."',
    book: 43,
    chapter: 9,
    startVerse: 1,
    endVerse: 41,
  },
  {
    titre: 'La Pêche Miraculeuse',
    ref: 'Luc 5:1-11',
    resume: "Après une nuit sans rien, les filets débordent sur la parole de Jésus. Pierre tombe à genoux.",
    book: 42,
    chapter: 5,
    startVerse: 1,
    endVerse: 11,
  },
];

type PassageData = {
  titre: string;
  ref: string;
  resume: string;
  book: number;
  chapter: number;
  startVerse: number;
  endVerse: number;
};

type CardData =
  | { type: 'verse'; data: typeof VERSE_DU_JOUR[0] }
  | { type: 'parabole'; data: PassageData }
  | { type: 'miracle'; data: PassageData }
  | { type: 'favori'; data: Favorite };

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

function VerseCard({ data }: { data: typeof VERSE_DU_JOUR[0] }) {
  const firstLetter = data.text[0];
  const rest = data.text.slice(1);

  return (
    <View style={[styles.card, { backgroundColor: P.parchmentLt }]}>
      <View style={[styles.pageEdge, styles.pageEdgeLeft, { backgroundColor: P.parchmentDk }]} />
      <View style={[styles.pageEdge, styles.pageEdgeRight, { backgroundColor: P.parchmentDk }]} />

      <View style={styles.cardInner}>
        <Text style={[styles.categoryTag, { color: P.rubriq }]}>Verset du jour</Text>
        <Rule />

        <View style={styles.verseBodyRow}>
          <Dropcap letter={firstLetter} color={P.rubriq} />
          <Text style={styles.verseBodyText}>{rest}</Text>
        </View>

        <Rule />
        <Text style={styles.verseRef}>{data.ref}</Text>
      </View>
    </View>
  );
}

function ParaboleCard({ data, onRead }: { data: PassageData; onRead: () => void }) {
  return (
    <View style={[styles.card, { backgroundColor: P.parchment }]}>
      <View style={[styles.pageEdge, styles.pageEdgeLeft, { backgroundColor: '#E4D4A8' }]} />
      <View style={[styles.pageEdge, styles.pageEdgeRight, { backgroundColor: '#E4D4A8' }]} />

      <View style={styles.cardInner}>
        <Text style={[styles.categoryTag, { color: P.verdeGris }]}>Parabole</Text>
        <Rule color={P.sepia + '50'} />

        <Text style={styles.passageTitle}>{data.titre}</Text>
        <Text style={[styles.passageRef, { color: P.verdeGris }]}>{data.ref}</Text>

        <View style={[styles.marginNote, { borderLeftColor: P.verdeGris + '60' }]}>
          <Text style={[styles.marginText, { color: P.inkLight }]}>{data.resume}</Text>
        </View>

        <Rule color={P.sepia + '40'} />

        <TouchableOpacity onPress={onRead} activeOpacity={0.6} style={styles.lireLink}>
          <Text style={[styles.lireLinkText, { color: P.verdeGris }]}>Lire le passage</Text>
          <Ionicons name="arrow-forward" size={12} color={P.verdeGris} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function MiracleCard({ data, onRead }: { data: PassageData; onRead: () => void }) {
  return (
    <View style={[styles.card, { backgroundColor: P.parchment }]}>
      <View style={[styles.pageEdge, styles.pageEdgeLeft, { backgroundColor: '#DDD0B0' }]} />
      <View style={[styles.pageEdge, styles.pageEdgeRight, { backgroundColor: '#DDD0B0' }]} />

      <View style={styles.cardInner}>
        <Text style={[styles.categoryTag, { color: P.azur }]}>Miracle</Text>
        <Rule color={P.sepia + '50'} />

        <Text style={styles.passageTitle}>{data.titre}</Text>
        <Text style={[styles.passageRef, { color: P.azur }]}>{data.ref}</Text>

        <View style={[styles.marginNote, { borderLeftColor: P.azur + '60' }]}>
          <Text style={[styles.marginText, { color: P.inkLight }]}>{data.resume}</Text>
        </View>

        <Rule color={P.sepia + '40'} />

        <TouchableOpacity onPress={onRead} activeOpacity={0.6} style={styles.lireLink}>
          <Text style={[styles.lireLinkText, { color: P.azur }]}>Lire le passage</Text>
          <Ionicons name="arrow-forward" size={12} color={P.azur} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function FavoriCard({ data, onRead }: { data: Favorite; onRead: () => void }) {
  return (
    <View style={[styles.card, { backgroundColor: P.parchmentLt }]}>
      <View style={[styles.pageEdge, styles.pageEdgeLeft, { backgroundColor: P.parchmentDk }]} />
      <View style={[styles.pageEdge, styles.pageEdgeRight, { backgroundColor: P.parchmentDk }]} />

      <View style={styles.cardInner}>
        <Text style={[styles.categoryTag, { color: P.rubriqLt }]}>Favori</Text>
        <Rule />

        <Text style={[styles.passageTitle, { fontWeight: '400', fontSize: 16 }]}>
          {data.bookName} {data.chapter}:{data.verse}
        </Text>

        <View style={styles.verseBodyRow}>
          <Text style={[styles.verseBodyText, { fontSize: 17, lineHeight: 28 }]}>
            {data.text}
          </Text>
        </View>

        <Rule />

        <TouchableOpacity onPress={onRead} activeOpacity={0.6} style={styles.lireLink}>
          <Text style={[styles.lireLinkText, { color: P.rubriqLt }]}>Lire le chapitre</Text>
          <Ionicons name="arrow-forward" size={12} color={P.rubriqLt} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function AccueilScreen() {
  const router = useRouter();
  const [lastPos, setLastPos] = useState<LastPosition | null>(null);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const listRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadLastPosition().then(setLastPos);
      loadFavorites().then(setFavorites);
    }, [])
  );

  const verseOfDay = useMemo(() => {
    const day = Math.floor(Date.now() / 86400000);
    return VERSE_DU_JOUR[day % VERSE_DU_JOUR.length];
  }, []);

  const baseCards: CardData[] = useMemo(() => {
    const feed: CardData[] = [];

    feed.push({ type: 'verse', data: verseOfDay });

    const maxItems = Math.max(PARABOLES.length, MIRACLES.length);

    for (let i = 0; i < maxItems; i++) {
      if (i < PARABOLES.length) {
        feed.push({ type: 'parabole', data: PARABOLES[i] });
      }

      if (i < MIRACLES.length) {
        feed.push({ type: 'miracle', data: MIRACLES[i] });
      }
    }

    favorites.slice(0, 3).forEach((f) => {
      feed.push({ type: 'favori', data: f });
    });

    return feed;
  }, [verseOfDay, favorites]);

  const cards = useMemo(() => [...baseCards, ...baseCards, ...baseCards], [baseCards]);
  const LOOP_OFFSET = baseCards.length;

  const onLayout = useCallback(() => {
    if (LOOP_OFFSET > 0) {
      listRef.current?.scrollToIndex({ index: LOOP_OFFSET, animated: false });
      setCurrentIndex(LOOP_OFFSET);
    }
  }, [LOOP_OFFSET]);

  const onMomentumScrollEnd = useCallback((e: any) => {
    const index = Math.round(e.nativeEvent.contentOffset.y / CARD_HEIGHT);
    setCurrentIndex(index);

    if (index <= 2) {
      listRef.current?.scrollToIndex({
        index: index + LOOP_OFFSET,
        animated: false,
      });
      setCurrentIndex(index + LOOP_OFFSET);
    } else if (index >= cards.length - 3) {
      listRef.current?.scrollToIndex({
        index: index - LOOP_OFFSET,
        animated: false,
      });
      setCurrentIndex(index - LOOP_OFFSET);
    }
  }, [cards.length, LOOP_OFFSET]);

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
        return <VerseCard data={item.data} />;

      case 'parabole':
        return (
          <ParaboleCard
            data={item.data}
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
          <MiracleCard
            data={item.data}
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={P.parchmentDk} />

      <Stack.Screen
        options={{
          title: 'La Parole de Dieu',
          headerStyle: { backgroundColor: P.parchmentDk },
          headerTintColor: P.ink,
          headerTitleStyle: { fontWeight: '600' },
          headerLeft: () => null,
        }}
      />

      <View style={styles.topBar}>
        <View style={styles.topRow}>
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={() => router.push('/(tabs)/livres')}
            activeOpacity={0.7}
          >
            <Ionicons name="book-outline" size={15} color={P.parchmentLt} />
            <Text style={styles.btnPrimaryText}>Lire la Bible</Text>
          </TouchableOpacity>

          {lastPos ? (
            <TouchableOpacity
              style={styles.btnSecondary}
              onPress={() => goToPassage(lastPos.book, lastPos.chapter)}
              activeOpacity={0.7}
            >
              <Ionicons name="reload-outline" size={14} color={P.inkLight} />
              <Text style={styles.btnSecondaryText} numberOfLines={1}>
                {lastPos.bookName} {lastPos.chapter}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.btnSecondary} activeOpacity={0.7}>
              <Ionicons name="heart-outline" size={14} color={P.inkLight} />
              <Text style={styles.btnSecondaryText}>Favoris</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.swipeHint}>Faites glisser pour parcourir</Text>
      </View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: P.parchment,
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
    letterSpacing: 0.5,
    marginTop: 8,
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
    marginBottom: 4,
  },

  marginText: {
    fontSize: 15,
    lineHeight: 26,
    fontStyle: 'italic',
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