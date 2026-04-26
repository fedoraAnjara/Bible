import {
  FlatList, Text, TouchableOpacity, StyleSheet,
  View, Image, Dimensions, ScrollView, NativeSyntheticEvent,
  NativeScrollEvent, ActivityIndicator,
} from 'react-native';
import { TextInput } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useBible } from '../../context/BibleContext';
import { getBooks, searchVerses, Verse } from '../../services/bibleService';
import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, interpolate, Extrapolation,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const CARD_WIDTH  = (width - 48) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.4;

const BOOK_IMAGES: Record<number, any> = {
  1:  require('../../assets/images/books/1.jpg'),
  2:  require('../../assets/images/books/2.jpg'),
  3:  require('../../assets/images/books/3.jpg'),
  4:  require('../../assets/images/books/4.jpg'),
  5:  require('../../assets/images/books/5.jpg'),
  6:  require('../../assets/images/books/6.jpg'),
  7:  require('../../assets/images/books/7.jpg'),
  8:  require('../../assets/images/books/8.jpg'),
  9:  require('../../assets/images/books/9.jpg'),
  10: require('../../assets/images/books/10.jpg'),
  11: require('../../assets/images/books/11.jpg'),
  12: require('../../assets/images/books/12.jpg'),
  13: require('../../assets/images/books/13.jpg'),
  14: require('../../assets/images/books/14.jpg'),
  15: require('../../assets/images/books/15.jpg'),
  16: require('../../assets/images/books/16.jpg'),
  17: require('../../assets/images/books/17.jpg'),
  18: require('../../assets/images/books/18.jpg'),
  19: require('../../assets/images/books/19.jpg'),
  20: require('../../assets/images/books/20.jpg'),
  21: require('../../assets/images/books/21.jpg'),
  22: require('../../assets/images/books/22.jpg'),
  23: require('../../assets/images/books/23.jpg'),
  24: require('../../assets/images/books/24.jpg'),
  25: require('../../assets/images/books/25.jpg'),
  26: require('../../assets/images/books/26.jpg'),
  27: require('../../assets/images/books/27.jpg'),
  28: require('../../assets/images/books/28.jpg'),
  29: require('../../assets/images/books/29.jpg'),
  30: require('../../assets/images/books/30.jpg'),
  31: require('../../assets/images/books/31.jpg'),
  32: require('../../assets/images/books/32.jpg'),
  33: require('../../assets/images/books/33.jpg'),
  34: require('../../assets/images/books/34.jpg'),
  35: require('../../assets/images/books/35.jpg'),
  36: require('../../assets/images/books/36.jpg'),
  37: require('../../assets/images/books/37.jpg'),
  38: require('../../assets/images/books/38.jpg'),
  39: require('../../assets/images/books/39.jpg'),
  40: require('../../assets/images/books/40.jpg'),
  41: require('../../assets/images/books/41.jpg'),
  42: require('../../assets/images/books/42.jpg'),
  43: require('../../assets/images/books/43.jpg'),
  44: require('../../assets/images/books/44.jpg'),
  45: require('../../assets/images/books/45.jpg'),
  46: require('../../assets/images/books/46.jpg'),
  47: require('../../assets/images/books/47.jpg'),
  48: require('../../assets/images/books/48.jpg'),
  49: require('../../assets/images/books/49.jpg'),
  50: require('../../assets/images/books/50.jpg'),
  51: require('../../assets/images/books/51.jpg'),
  52: require('../../assets/images/books/52.jpg'),
  53: require('../../assets/images/books/53.jpg'),
  54: require('../../assets/images/books/54.jpg'),
  55: require('../../assets/images/books/55.jpg'),
  56: require('../../assets/images/books/56.jpg'),
  57: require('../../assets/images/books/57.jpg'),
  58: require('../../assets/images/books/58.jpg'),
  59: require('../../assets/images/books/59.jpg'),
  60: require('../../assets/images/books/60.jpg'),
  61: require('../../assets/images/books/61.jpg'),
  62: require('../../assets/images/books/62.jpg'),
  63: require('../../assets/images/books/63.jpg'),
  64: require('../../assets/images/books/64.jpg'),
  65: require('../../assets/images/books/65.jpg'),
  66: require('../../assets/images/books/66.jpg'),
};

const BOOK_SUMMARIES: Record<number, { fr: string; en: string }> = {
  1:  { fr: 'La création du monde et l\'histoire des patriarches.', en: 'Creation, the fall, and the patriarchs.' },
  2:  { fr: 'La libération d\'Israël hors d\'Égypte et la loi de Dieu.', en: 'Israel\'s deliverance from Egypt and the covenant at Sinai.' },
  3:  { fr: 'Les lois de sainteté, de sacrifice et de pureté.', en: 'Laws of holiness, sacrifice, and purity.' },
  4:  { fr: 'Le voyage d\'Israël dans le désert et ses rébellions.', en: 'Israel\'s wanderings in the wilderness.' },
  5:  { fr: 'Le discours d\'adieu de Moïse avant l\'entrée en Canaan.', en: 'Moses\' farewell sermons before entering the Promised Land.' },
  6:  { fr: 'La conquête de Canaan sous la conduite de Josué.', en: 'The conquest of Canaan under Joshua\'s leadership.' },
  7:  { fr: 'Les juges d\'Israël dans un cycle de péché et de délivrance.', en: 'Israel\'s cycle of sin, oppression, and deliverance through the judges.' },
  8:  { fr: 'La fidélité de Ruth et sa place dans la lignée de David.', en: 'Ruth\'s faithfulness and her place in the lineage of David.' },
  9:  { fr: 'Samuel, Saül et les débuts de la monarchie en Israël.', en: 'Samuel, Saul, and the rise of Israel\'s monarchy.' },
  10: { fr: 'Le règne de David : gloire, péché et grâce de Dieu.', en: 'David\'s reign: triumph, sin, and God\'s enduring grace.' },
  11: { fr: 'De la sagesse de Salomon à la division du royaume.', en: 'Solomon\'s wisdom and the division of the kingdom.' },
  12: { fr: 'Les rois d\'Israël et de Juda jusqu\'à l\'exil babylonien.', en: 'The kings of Israel and Judah up to the Babylonian exile.' },
  13: { fr: 'L\'histoire d\'Israël depuis Adam jusqu\'à David.', en: 'Israel\'s history from Adam to David through genealogies and events.' },
  14: { fr: 'De la gloire de Salomon à la chute de Jérusalem.', en: 'From Solomon\'s glory to the fall of Jerusalem.' },
  15: { fr: 'Le retour des exilés et la reconstruction du Temple.', en: 'The return from exile and the rebuilding of the Temple.' },
  16: { fr: 'Néhémie reconstruit les murailles de Jérusalem.', en: 'Nehemiah rebuilds the walls of Jerusalem and restores the community.' },
  17: { fr: 'Esther sauve courageusement le peuple juif.', en: 'Esther courageously saves the Jewish people from destruction.' },
  18: { fr: 'Job souffre injustement et rencontre Dieu dans la tempête.', en: 'Job suffers unjustly and encounters God in the whirlwind.' },
  19: { fr: 'Chants de louange, de lamentation et de confiance en Dieu.', en: 'Songs of praise, lament, and trust in God.' },
  20: { fr: 'La sagesse pratique pour une vie juste et honorable.', en: 'Practical wisdom for a righteous and honorable life.' },
  21: { fr: 'La vanité de la vie humaine sans Dieu.', en: 'The vanity of human life apart from God.' },
  22: { fr: 'Un poème d\'amour célébrant la beauté du mariage.', en: 'A poem celebrating the beauty and depth of love and marriage.' },
  23: { fr: 'Jugement sur Israël et promesse du Serviteur souffrant.', en: 'Judgment on Israel and the promise of the Suffering Servant.' },
  24: { fr: 'Jérémie pleure sur Juda et annonce une nouvelle alliance.', en: 'Jeremiah mourns over Judah and announces a new covenant.' },
  25: { fr: 'Les lamentations de Jérémie sur la chute de Jérusalem.', en: 'Jeremiah\'s laments over the fall of Jerusalem.' },
  26: { fr: 'Les visions d\'Ézéchiel sur le jugement et la restauration.', en: 'Ezekiel\'s visions of judgment, exile, and Israel\'s restoration.' },
  27: { fr: 'Daniel reste fidèle à Dieu au cœur de l\'empire babylonien.', en: 'Daniel remains faithful to God in the heart of Babylon.' },
  28: { fr: 'L\'amour d\'Osée pour sa femme infidèle, image de Dieu et Israël.', en: 'Hosea\'s love for his unfaithful wife mirrors God\'s love for Israel.' },
  29: { fr: 'Joël annonce le Jour du Seigneur et l\'effusion de l\'Esprit.', en: 'Joel announces the Day of the Lord and the outpouring of the Spirit.' },
  30: { fr: 'Amos dénonce l\'injustice sociale et appelle à la repentance.', en: 'Amos denounces social injustice and calls Israel to repentance.' },
  31: { fr: 'Abdias prophétise le jugement d\'Édom et la restauration d\'Israël.', en: 'Obadiah prophesies judgment on Edom and restoration for Israel.' },
  32: { fr: 'Jonas fuit Dieu, puis proclame sa grâce aux nations.', en: 'Jonah flees from God, then proclaims His grace to the nations.' },
  33: { fr: 'Michée annonce le jugement et la venue du Messie à Bethléem.', en: 'Micah announces judgment and the Messiah\'s birth in Bethlehem.' },
  34: { fr: 'Nahoum proclame la chute de Ninive et la justice de Dieu.', en: 'Nahum proclaims the fall of Nineveh and God\'s justice.' },
  35: { fr: 'Habacuc questionne Dieu sur le mal et apprend à lui faire confiance.', en: 'Habakkuk questions God about evil and learns to trust His sovereignty.' },
  36: { fr: 'Sophonie annonce le Jour du Seigneur et la restauration du reste.', en: 'Zephaniah announces the Day of the Lord and the restoration of a remnant.' },
  37: { fr: 'Aggée exhorte le peuple à reconstruire le Temple de Dieu.', en: 'Haggai urges the people to rebuild God\'s Temple.' },
  38: { fr: 'Zacharie voit des visions messianiques et la gloire future.', en: 'Zechariah sees messianic visions of the coming King and future glory.' },
  39: { fr: 'Malachie appelle Israël à revenir à Dieu avant le grand Jour.', en: 'Malachi calls Israel back to God before the coming great Day.' },
  40: { fr: 'Jésus, le roi Messie et l\'accomplissement de la loi.', en: 'Jesus, the Messiah King who fulfills the Law and the Prophets.' },
  41: { fr: 'Jésus, le serviteur puissant qui agit avec autorité.', en: 'Jesus, the powerful Servant who acts with authority and urgency.' },
  42: { fr: 'Jésus, le Sauveur compatissant pour tous les marginalisés.', en: 'Jesus, the compassionate Savior for the outcasts and the lost.' },
  43: { fr: 'Jésus, le Verbe de Dieu incarné qui donne la vie éternelle.', en: 'Jesus, the Word of God incarnate who gives eternal life.' },
  44: { fr: 'La naissance de l\'Église par l\'Esprit et la mission aux nations.', en: 'The birth of the Church by the Spirit and the mission to the nations.' },
  45: { fr: 'La justification par la foi seule, expliquée à Rome.', en: 'Justification by faith alone, explained to the church in Rome.' },
  46: { fr: 'Paul corrige les divisions et les désordres de l\'église de Corinthe.', en: 'Paul corrects divisions and disorders in the church of Corinth.' },
  47: { fr: 'Paul défend son ministère et appelle à la réconciliation.', en: 'Paul defends his ministry and calls for reconciliation.' },
  48: { fr: 'La liberté en Christ contre le légalisme des judaisants.', en: 'Freedom in Christ against the legalism of the Judaizers.' },
  49: { fr: 'L\'Église, corps du Christ, revêtue de l\'armure de Dieu.', en: 'The Church as the body of Christ, clothed in God\'s armor.' },
  50: { fr: 'La joie en Christ malgré l\'emprisonnement de Paul.', en: 'Joy in Christ despite Paul\'s imprisonment.' },
  51: { fr: 'La suprématie absolue du Christ sur toute création.', en: 'The absolute supremacy of Christ over all creation.' },
  52: { fr: 'Encouragements pour tenir ferme jusqu\'au retour du Christ.', en: 'Encouragement to stand firm until the return of Christ.' },
  53: { fr: 'Clarifications sur le Jour du Seigneur et l\'homme du péché.', en: 'Clarifications about the Day of the Lord and the man of lawlessness.' },
  54: { fr: 'Conseils à Timothée pour diriger et enseigner l\'Église.', en: 'Guidance for Timothy on leadership and sound doctrine in the Church.' },
  55: { fr: 'Le testament spirituel de Paul à son fils dans la foi.', en: 'Paul\'s spiritual testament to his son in the faith.' },
  56: { fr: 'Instructions à Tite pour établir les anciens dans les Églises.', en: 'Instructions to Titus for appointing elders and teaching sound doctrine.' },
  57: { fr: 'Paul intercède pour l\'esclave fugitif Onésime auprès de Philémon.', en: 'Paul intercedes for the runaway slave Onesimus with Philemon.' },
  58: { fr: 'La supériorité de Christ sur la loi mosaïque et les sacrifices.', en: 'The superiority of Christ over the Mosaic law and sacrifices.' },
  59: { fr: 'Une foi vivante se prouve par des œuvres et une sagesse pratique.', en: 'A living faith is proved by works and practical wisdom.' },
  60: { fr: 'Pierre encourage les croyants persécutés à tenir ferme.', en: 'Peter encourages persecuted believers to stand firm in their faith.' },
  61: { fr: 'Mise en garde contre les faux docteurs et le retour du Christ.', en: 'Warning against false teachers and the certainty of Christ\'s return.' },
  62: { fr: 'Dieu est amour : marcher dans la lumière et aimer les frères.', en: 'God is love: walking in the light and loving one another.' },
  63: { fr: 'Courte lettre appelant à rester dans la vérité de l\'Évangile.', en: 'A brief letter calling to remain in the truth of the Gospel.' },
  64: { fr: 'Encouragements à accueillir les frères itinérants dans la vérité.', en: 'Encouragement to welcome traveling ministers who serve the truth.' },
  65: { fr: 'Jude met en garde contre les faux docteurs infiltrés dans l\'Église.', en: 'Jude warns against false teachers who have crept into the Church.' },
  66: { fr: 'La victoire finale de Christ sur le mal et la gloire éternelle.', en: 'The final victory of Christ over evil and the eternal glory to come.' },
};

//Highlight du mot cherché dans un texte
function HighlightedText({ text, query, style }: { text: string; query: string; style?: object }) {
  if (!query || query.length < 3) return <Text style={style}>{text}</Text>;
  const lower = text.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) return <Text style={style}>{text}</Text>;
  return (
    <Text style={style}>
      {text.slice(0, idx)}
      <Text style={styles.highlight}>{text.slice(idx, idx + query.length)}</Text>
      {text.slice(idx + query.length)}
    </Text>
  );
}

//Carte de résultat verset
function VerseResultCard({ verse, query, onPress }: {
  verse: Verse;
  query: string;
  onPress: () => void;
}) {
  const isOT = verse.book <= 39;
  return (
    <TouchableOpacity style={styles.verseCard} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.verseCardHeader}>
        <View style={[styles.verseRef, isOT ? styles.verseRefOT : styles.verseRefNT]}>
          <Text style={[styles.verseRefText, isOT ? styles.verseRefTextOT : styles.verseRefTextNT]}>
            {verse.book_name} {verse.chapter}:{verse.verse}
          </Text>
        </View>
      </View>
      <HighlightedText text={verse.text} query={query} style={styles.verseText} />
    </TouchableOpacity>
  );
}

//Section Header──────────
function SectionHeader({ label, isOT }: { label: string; isOT: boolean }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionLine, isOT ? styles.lineOT : styles.lineNT]} />
      <Text style={[styles.sectionLabel, isOT ? styles.labelOT : styles.labelNT]}>{label}</Text>
      <View style={[styles.sectionLine, isOT ? styles.lineOT : styles.lineNT]} />
    </View>
  );
}

//Book Card───────────────
function BookCard({ item, lang, onPress, isFlipped, onFlip }: {
  item: { book: number; name: string; chapters: number };
  lang: 'fr' | 'en';
  onPress: () => void;
  isFlipped: boolean;
  onFlip: (bookNum: number) => void;
}) {
  const rotate = useSharedValue(0);

  useEffect(() => {
    rotate.value = withTiming(isFlipped ? 180 : 0, { duration: 420 });
  }, [isFlipped]);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${interpolate(rotate.value, [0, 180], [0, 180], Extrapolation.CLAMP)}deg` }],
    backfaceVisibility: 'hidden',
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${interpolate(rotate.value, [0, 180], [180, 360], Extrapolation.CLAMP)}deg` }],
    backfaceVisibility: 'hidden',
  }));

  const isOT    = item.book <= 39;
  const summary = BOOK_SUMMARIES[item.book]?.[lang] ?? (lang === 'fr' ? 'Résumé du livre biblique.' : 'Summary of the biblical book.');

  return (
    <TouchableOpacity activeOpacity={1} onPress={() => onFlip(item.book)} style={styles.cardWrapper}>
      <Animated.View style={[styles.card, frontStyle]}>
        <Image source={BOOK_IMAGES[item.book]} style={styles.cardImage} resizeMode="cover" />
        <View style={styles.cardOverlay} />
        <View style={styles.cardBottom}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
        </View>
      </Animated.View>

      <Animated.View style={[styles.card, styles.cardBack, backStyle, isOT ? styles.backOT : styles.backNT]}>
        <Text style={styles.backTitle}>{item.name}</Text>
        <View style={[styles.divider, isOT ? styles.dividerOT : styles.dividerNT]} />
        <Text style={styles.backSummary}>{summary}</Text>
        <Text style={styles.backChapters}>{item.chapters} {lang === 'fr' ? 'chapitres' : 'chapters'}</Text>
        <TouchableOpacity style={[styles.readBtn, isOT ? styles.readBtnOT : styles.readBtnNT]} onPress={onPress}>
          <Text style={styles.readBtnText}>{lang === 'fr' ? 'Lire →' : 'Read →'}</Text>
        </TouchableOpacity>
        <Text style={styles.flipHint}>{lang === 'fr' ? '↺ retourner' : '↺ flip'}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

//Écran principal─────────
export default function LivresScreen() {
  const [search, setSearch]           = useState('');
  const [activeTab, setActiveTab]     = useState<'OT' | 'NT'>('OT');
  const [flippedBook, setFlippedBook] = useState<number | null>(null);
  const [verseResults, setVerseResults] = useState<Verse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { lang }                      = useBible();
  const router                        = useRouter();
  const scrollRef                     = useRef<ScrollView>(null);
  const ntOffsetY                     = useRef<number>(0);
  const searchTimer                   = useRef<ReturnType<typeof setTimeout> | null>(null);

  const books        = useMemo(() => getBooks(lang), [lang]);
  const oldTestament = useMemo(() => books.filter(b => b.book <= 39), [books]);
  const newTestament = useMemo(() => books.filter(b => b.book >= 40), [books]);

  // Recherche par nom de livre (instantanée)
  const filteredOT = useMemo(
    () => oldTestament.filter(b => b.name.toLowerCase().includes(search.toLowerCase())),
    [oldTestament, search]
  );
  const filteredNT = useMemo(
    () => newTestament.filter(b => b.name.toLowerCase().includes(search.toLowerCase())),
    [newTestament, search]
  );

  // Recherche dans les versets (debounced, seulement si ≥ 3 caractères)
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (search.trim().length < 3) {
      setVerseResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    searchTimer.current = setTimeout(() => {
      const results = searchVerses(lang, search.trim());
      setVerseResults(results);
      setIsSearching(false);
    }, 300);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [search, lang]);

  const isFullTextSearch = search.trim().length >= 3;

  const goToBook = useCallback((bookNum: number) => {
    router.push({
      pathname: '/lecture/[livre]/[chapitre]',
      params: { livre: bookNum, chapitre: 1 },
    });
  }, [router]);

  const goToVerse = useCallback((verse: Verse) => {
    router.push({
      pathname: '/lecture/[livre]/[chapitre]',
      params: { livre: verse.book, chapitre: verse.chapter },
    });
  }, [router]);

  const handleFlip = useCallback((bookNum: number) => {
    setFlippedBook(prev => prev === bookNum ? null : bookNum);
  }, []);

  const renderBook = ({ item }: { item: typeof books[0] }) => (
    <BookCard
      item={item}
      lang={lang}
      onPress={() => goToBook(item.book)}
      isFlipped={flippedBook === item.book}
      onFlip={handleFlip}
    />
  );

  const goToOT = () => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
    setActiveTab('OT');
  };

  const goToNT = () => {
    scrollRef.current?.scrollTo({ y: ntOffsetY.current, animated: true });
    setActiveTab('NT');
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    if (ntOffsetY.current > 0 && y >= ntOffsetY.current - 100) {
      setActiveTab('NT');
    } else {
      setActiveTab('OT');
    }
  };

  const otLabel = lang === 'fr' ? 'Ancien Testament' : 'Old Testament';
  const ntLabel = lang === 'fr' ? 'Nouveau Testament' : 'New Testament';

  return (
    <>
      <Stack.Screen
        options={{
          title: lang === 'fr' ? 'La Bible' : 'The Bible',
          headerStyle: { backgroundColor: 'wheat' },
          headerTintColor: '#5C3D0E',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ paddingHorizontal: 8 }}>
              <Text style={[styles.backHeader, { minWidth: 60 }]}>
                {lang === 'fr' ? '← Retour' : '← Back'}
              </Text>
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.stickyBar}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder={lang === 'fr' ? 'Rechercher un livre ou un verset...' : 'Search a book or verse...'}
            placeholderTextColor="#A08060"
            value={search}
            onChangeText={setSearch}
            clearButtonMode="while-editing"
          />
        </View>

        {/* Onglets masqués pendant la recherche plein texte */}
        {!isFullTextSearch && (
          <View style={styles.tabBar}>
            <TouchableOpacity style={styles.dotBtn} onPress={goToOT} activeOpacity={0.7}>
              <View style={[styles.dot, activeTab === 'OT' && styles.dotActiveOT]} />
              <Text style={[styles.dotBtnText, activeTab === 'OT' && styles.dotBtnTextActiveOT]}>
                {lang === 'fr' ? 'Ancien Testament' : 'Old Testament'}
              </Text>
            </TouchableOpacity>
            <View style={styles.dotSeparator} />
            <TouchableOpacity style={styles.dotBtn} onPress={goToNT} activeOpacity={0.7}>
              <View style={[styles.dot, activeTab === 'NT' && styles.dotActiveNT]} />
              <Text style={[styles.dotBtnText, activeTab === 'NT' && styles.dotBtnTextActiveNT]}>
                {lang === 'fr' ? 'Nouveau Testament' : 'New Testament'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* ── Livres correspondants ── */}
        {filteredOT.length > 0 && (
          <>
            <SectionHeader label={otLabel} isOT={true} />
            <FlatList
              data={filteredOT}
              keyExtractor={(item) => String(item.book)}
              renderItem={renderBook}
              numColumns={2}
              columnWrapperStyle={styles.row}
              scrollEnabled={false}
            />
          </>
        )}

        {filteredNT.length > 0 && (
          <View onLayout={(e) => { ntOffsetY.current = e.nativeEvent.layout.y; }}>
            <SectionHeader label={ntLabel} isOT={false} />
            <FlatList
              data={filteredNT}
              keyExtractor={(item) => String(item.book)}
              renderItem={renderBook}
              numColumns={2}
              columnWrapperStyle={styles.row}
              scrollEnabled={false}
            />
          </View>
        )}

        {/* ── Résultats versets ── */}
        {isFullTextSearch && (
          <>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionLine, { backgroundColor: '#8B6540' }]} />
              <Text style={[styles.sectionLabel, { color: '#8B6540' }]}>
                {lang === 'fr' ? 'Versets' : 'Verses'}
              </Text>
              <View style={[styles.sectionLine, { backgroundColor: '#8B6540' }]} />
            </View>

            {isSearching ? (
              <ActivityIndicator color="#C9922A" style={{ marginTop: 20 }} />
            ) : verseResults.length > 0 ? (
              <>
                {verseResults.map((verse) => (
                  <VerseResultCard
                    key={`${verse.book}-${verse.chapter}-${verse.verse}`}
                    verse={verse}
                    query={search.trim()}
                    onPress={() => goToVerse(verse)}
                  />
                ))}
                {verseResults.length === 50 && (
                  <Text style={styles.limitNote}>
                    {lang === 'fr' ? '50 résultats affichés — affinez votre recherche' : '50 results shown — refine your search'}
                  </Text>
                )}
              </>
            ) : (
              <Text style={styles.noResult}>
                {lang === 'fr' ? 'Aucun verset trouvé' : 'No verse found'}
              </Text>
            )}
          </>
        )}

        {/* ── Aucun résultat du tout ── */}
        {!isFullTextSearch && filteredOT.length === 0 && filteredNT.length === 0 && (
          <Text style={styles.noResult}>
            {lang === 'fr' ? 'Aucun livre trouvé' : 'No book found'}
          </Text>
        )}
      </ScrollView>
    </>
  );
}

//Styles──────────────────
const styles = StyleSheet.create({
  container: {
    backgroundColor: 'wheat',
    flex: 1,
  },
  list: {
    padding: 12,
    paddingBottom: 40,
  },
  row: {
    gap: 12,
    marginBottom: 12,
  },
  backHeader: {
    fontSize: 16,
    color: '#5C3D0E',
    fontWeight: '600',
  },

  stickyBar: {
    backgroundColor: 'wheat',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#D4B896',
    zIndex: 10,
  },

  searchContainer: {
    backgroundColor: '#F5ECD7',
    borderRadius: 14,
    marginBottom: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#D4B896',
  },
  searchInput: {
    height: 44,
    fontSize: 13,
    color: '#3B2A1A',
  },

  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  dotSeparator: {
    width: 1,
    height: 14,
    backgroundColor: '#D4B896',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#C4A87A',
  },
  dotActiveOT: {
    backgroundColor: '#3A9BD5',
  },
  dotActiveNT: {
    backgroundColor: '#3A9BD5',
  },
  dotBtnText: {
    fontSize: 11,
    color: '#A08060',
    fontWeight: '400',
  },
  dotBtnTextActiveOT: {
    color: '#C9922A',
  },
  dotBtnTextActiveNT: {
    color: '#C9922A',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 14,
    gap: 10,
  },
  sectionLine:  { flex: 1, height: StyleSheet.hairlineWidth },
  lineOT:       { backgroundColor: '#C9922A' },
  lineNT:       { backgroundColor: '#3A9BD5' },
  sectionLabel: { fontSize: 13, fontWeight: '800', letterSpacing: 2.5, textTransform: 'uppercase' },
  labelOT:      { color: '#C9922A' },
  labelNT:      { color: '#3A9BD5' },

  // Cards livres
  cardWrapper: { width: CARD_WIDTH, height: CARD_HEIGHT },
  card: {
    width: CARD_WIDTH, height: CARD_HEIGHT,
    borderRadius: 16, overflow: 'hidden',
    position: 'absolute', top: 0, left: 0,
    backgroundColor: '#1A1205',
  },
  cardImage:   { width: '100%', height: '100%', borderRadius: 16 },
  cardOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.38)' },
  cardBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 10, backgroundColor: 'rgba(0,0,0,0.55)',
  },
  cardTitle:   { color: '#fff', fontSize: 17, fontWeight: '600', textAlign: 'center' },
  cardBack:    { padding: 14, justifyContent: 'center', alignItems: 'center', gap: 8 },
  backOT:      { backgroundColor: '#1A1205' },
  backNT:      { backgroundColor: '#05101A' },
  backTitle:   { color: '#F0E6CC', fontSize: 16, fontWeight: '700', textAlign: 'center' },
  divider:     { width: 36, height: 2, borderRadius: 1 },
  dividerOT:   { backgroundColor: '#C9922A' },
  dividerNT:   { backgroundColor: '#3A9BD5' },
  backSummary: { color: '#9A8870', fontSize: 12, lineHeight: 18, textAlign: 'center' },
  backChapters:{ color: '#5A5040', fontSize: 11 },
  readBtn:     { paddingHorizontal: 22, paddingVertical: 9, borderRadius: 10, marginTop: 4 },
  readBtnOT:   { backgroundColor: '#7A5C10' },
  readBtnNT:   { backgroundColor: '#0F4C7A' },
  readBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  flipHint:    { color: '#3A3028', fontSize: 9 },

  // Cartes versets
  verseCard: {
    backgroundColor: '#F5ECD7',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#D4B896',
  },
  verseCardHeader: {
    marginBottom: 8,
  },
  verseRef: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  verseRefOT: { backgroundColor: '#C9922A22' },
  verseRefNT: { backgroundColor: '#3A9BD522' },
  verseRefText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  verseRefTextOT: { color: '#7A5C10' },
  verseRefTextNT: { color: '#0F4C7A' },
  verseText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#3B2A1A',
  },
  highlight: {
    backgroundColor: '#C9922A44',
    color: '#5C3D0E',
    fontWeight: '700',
  },
  limitNote: {
    textAlign: 'center',
    color: '#A08060',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
    marginBottom: 16,
  },

  noResult: {
    textAlign: 'center', color: '#A08060',
    marginTop: 60, fontSize: 15, fontStyle: 'italic',
  },
});