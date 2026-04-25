import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ScrollView, Modal, Pressable, PanResponder, Alert,
  useWindowDimensions, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useBible } from '../../../context/BibleContext';
import { getBooks, getChapter } from '../../../services/bibleService';
import type { Verse } from '../../../services/bibleService';
import {
  addFavorite, removeFavorite, isFavorite,
  saveLastPosition,
} from '../../../services/storageService';

//Sidebar type──
type SidebarMode = 'none' | 'chapters' | 'verses';

export default function LectureScreen() {
  const { livre, chapitre } = useLocalSearchParams<{ livre: string; chapitre: string }>();
  const { lang, setLang } = useBible();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const bookNum = Number(livre);
  const chapNum = Number(chapitre);

  //Données───────
  const books = useMemo(() => getBooks(lang), [lang]);
  const book = books.find((b) => b.book === bookNum);
  const verses = useMemo(() => getChapter(lang, bookNum, chapNum), [lang, bookNum, chapNum]);
  const totalChapters = book?.chapters ?? 1;
  const totalVerses = verses.length;

  //Refs───────────
  const listRef = useRef<FlatList>(null);

  //État sidebar────
  const [sidebar, setSidebar] = useState<SidebarMode>('none');

  //Sauvegarde position à chaque changement ─────────────────
  useEffect(() => {
    if (book) {
      saveLastPosition({ book: bookNum, bookName: book.name, chapter: chapNum });
    }
  }, [bookNum, chapNum, book]);

  //Navigation chapitre ─────────────────────────────────────
  const goToChapter = useCallback((ch: number) => {
    setSidebar('none');
    router.replace({
      pathname: '/lecture/[livre]/[chapitre]',
      params: { livre: bookNum, chapitre: ch },
    });
  }, [bookNum, router]);

  const prevChapter = () => { if (chapNum > 1) goToChapter(chapNum - 1); };
  const nextChapter = () => { if (chapNum < totalChapters) goToChapter(chapNum + 1); };

  //Swipe gauche/droite ──────────────────────────────────────
  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) =>
      Math.abs(g.dx) > 30 && Math.abs(g.dy) < 40,
    onPanResponderRelease: (_, g) => {
      if (g.dx < -60) nextChapter();   // swipe gauche → suivant
      else if (g.dx > 60) prevChapter(); // swipe droit → précédent
    },
  }), [chapNum, totalChapters]);

  //Scroll vers un verset ───────────────────────────────────
  const scrollToVerse = (verseIndex: number) => {
    setSidebar('none');
    listRef.current?.scrollToIndex({ index: verseIndex, animated: true, viewOffset: 8 });
  };

  //Favori (appui long) ──────────────────────────────────────
  const handleLongPress = async (v: Verse) => {
    const id = `${v.book}-${v.chapter}-${v.verse}`;
    const already = await isFavorite(v.book, v.chapter, v.verse);
    if (already) {
      Alert.alert('Retirer des favoris ?', `${book?.name} ${chapNum}:${v.verse}`, [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Retirer', style: 'destructive', onPress: () => removeFavorite(id) },
      ]);
    } else {
      await addFavorite({
        book: v.book, bookName: v.book_name,
        chapter: v.chapter, verse: v.verse, text: v.text,
      });
      Alert.alert('✦ Ajouté aux favoris', `${book?.name} ${chapNum}:${v.verse}`);
    }
  };

  //Rendu d'un verset ────────────────────────────────────────
  const renderVerse = ({ item }: { item: Verse }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onLongPress={() => handleLongPress(item)}
      style={styles.verseRow}
    >
      <Text style={styles.verseNum}>{item.verse}</Text>
      <Text style={styles.verseText}>{item.text}</Text>
    </TouchableOpacity>
  );

  //Sidebar Chapitres
  const ChapterSidebar = () => (
    <Modal transparent animationType="fade" visible={sidebar === 'chapters'}>
      <Pressable style={styles.overlay} onPress={() => setSidebar('none')}>
        <View style={styles.sidePanel}>
          <Text style={styles.sidePanelTitle}>Chapitres</Text>
          <ScrollView>
            {Array.from({ length: totalChapters }, (_, i) => i + 1).map((ch) => (
              <TouchableOpacity
                key={ch}
                style={[styles.sideItem, ch === chapNum && styles.sideItemActive]}
                onPress={() => goToChapter(ch)}
              >
                <Text style={[styles.sideItemText, ch === chapNum && styles.sideItemTextActive]}>
                  {ch}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  );

  //Sidebar Versets
  const VerseSidebar = () => (
    <Modal transparent animationType="fade" visible={sidebar === 'verses'}>
      <Pressable style={styles.overlay} onPress={() => setSidebar('none')}>
        <View style={styles.sidePanel}>
          <Text style={styles.sidePanelTitle}>Versets</Text>
          <ScrollView>
            {verses.map((v, index) => (
              <TouchableOpacity
                key={v.verse}
                style={styles.sideItem}
                onPress={() => scrollToVerse(index)}
              >
                <Text style={styles.sideItemText}>{v.verse}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  );

  //Render principal
  return (
    <View style={styles.container} {...panResponder.panHandlers}>

      {/* Titre dans la header native */}
        <Stack.Screen options={{ 
        title: `${book?.name ?? '...'} ${chapNum}`,
        headerStyle: { backgroundColor: '#F5ECD7' },
        headerTintColor: '#8B4513',
        headerLeft: () => (
            <TouchableOpacity
            onPress={() => router.back()}
            style={{ paddingHorizontal: 8 }}
            >
            <Text style={{ fontSize: 16, color: '#8B4513', fontWeight: '600' }}>
                ← Retour
            </Text>
            </TouchableOpacity>
        ),
        }} />
      

      {/* Barre d'outils : chapitres | langue | versets */}
      <View style={styles.toolbar}>
        <TouchableOpacity
          style={styles.toolBtn}
          onPress={() => setSidebar(sidebar === 'chapters' ? 'none' : 'chapters')}
        >
          <Text style={styles.toolBtnText}>📖 Ch. {chapNum}/{totalChapters}</Text>
        </TouchableOpacity>

        {/* Bouton langue */}
        <TouchableOpacity
          style={styles.langBtn}
          onPress={() => setLang(lang === 'fr' ? 'en' : 'fr')}
        >
          <Text style={styles.langBtnText}>{lang === 'fr' ? '🇫🇷 FR' : '🇬🇧 EN'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toolBtn}
          onPress={() => setSidebar(sidebar === 'verses' ? 'none' : 'verses')}
        >
          <Text style={styles.toolBtnText}>V. 1 – {totalVerses}</Text>
        </TouchableOpacity>
      </View>

      {/* Liste des versets */}
      <FlatList
        ref={listRef}
        data={verses}
        keyExtractor={(v) => String(v.verse)}
        renderItem={renderVerse}
        contentContainerStyle={styles.listContent}
        onScrollToIndexFailed={(info) => {
          // Fallback si l'index n'est pas encore rendu
          setTimeout(() => {
            listRef.current?.scrollToIndex({ index: info.index, animated: true });
          }, 300);
        }}
      />

      {/* Sidebars */}
      <ChapterSidebar />
      <VerseSidebar />
    </View>
  );
}

//Styles──────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },

  // Toolbar
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F5ECD7',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#D0B896',
  },
  toolBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D0B896',
  },
  toolBtnText: {
    fontSize: 13,
    color: '#5C3D1E',
    fontWeight: '500',
  },
  langBtn: {
    backgroundColor: '#8B4513',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  langBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },

  // Versets
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  verseRow: {
    flexDirection: 'row',
    marginBottom: 14,
    alignItems: 'flex-start',
  },
  verseNum: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8B4513',
    minWidth: 28,
    marginTop: 3,
  },
  verseText: {
    flex: 1,
    fontSize: 17,
    lineHeight: 28,
    color: '#2C1A0E',
  },

  // Barre nav bas
  navBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    backgroundColor: '#F5ECD7',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#D0B896',
  },
  navBtn: {
    backgroundColor: '#8B4513',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  navBtnDisabled: {
    backgroundColor: '#C4A882',
  },
  navBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  navInfo: {
    fontSize: 14,
    color: '#5C3D1E',
    fontWeight: '500',
  },

  // Sidebar / Modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  sidePanel: {
    width: 120,
    maxHeight: '70%',
    backgroundColor: '#FFF8F0',
    borderRadius: 12,
    marginRight: 16,
    padding: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  sidePanelTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8B4513',
    textAlign: 'center',
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#D0B896',
    marginBottom: 4,
  },
  sideItem: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderRadius: 6,
  },
  sideItemActive: {
    backgroundColor: '#8B4513',
  },
  sideItemText: {
    fontSize: 15,
    color: '#3B2A1A',
    fontWeight: '500',
  },
  sideItemTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
});