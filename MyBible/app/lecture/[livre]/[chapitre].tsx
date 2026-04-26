// app/lecture/[livre]/[chapitre].tsx

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Pressable,
  PanResponder,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useBible } from '../../../context/BibleContext';
import { getBooks, getChapter } from '../../../services/bibleService';
import type { Verse } from '../../../services/bibleService';
import {
  addFavorite,
  removeFavorite,
  isFavorite,
  saveLastPosition,
} from '../../../services/storageService';

type SidebarMode = 'none' | 'chapters' | 'verses';

const T = {
  fr: {
    retour: '← Retour',
    chapitres: 'Chapitres',
    versets: 'Versets',
    passage: 'Passage',
    ajouteFavori: '✦ Ajouté aux favoris',
    retirerFavori: 'Retirer des favoris ?',
    annuler: 'Annuler',
    retirer: 'Retirer',
    selectionner: 'verset(s) sélectionné(s)',
    sauvegarder: 'Sauvegarder',
  },
  en: {
    retour: '← Back',
    chapitres: 'Chapters',
    versets: 'Verses',
    passage: 'Passage',
    ajouteFavori: '✦ Added to favourites',
    retirerFavori: 'Remove from favourites?',
    annuler: 'Cancel',
    retirer: 'Remove',
    selectionner: 'verse(s) selected',
    sauvegarder: 'Save',
  },
};

export default function LectureScreen() {
  const { livre, chapitre, start, end } = useLocalSearchParams<{
    livre: string;
    chapitre: string;
    start?: string;
    end?: string;
  }>();

  const startVerse = start ? Number(start) : null;
  const endVerse = end ? Number(end) : null;

  const { lang, setLang, fontSize } = useBible();
  const t = T[lang];

  const router = useRouter();

  const bookNum = Number(livre);
  const chapNum = Number(chapitre);

  const books = useMemo(() => getBooks(lang), [lang]);
  const book = books.find((b) => b.book === bookNum);

  const verses = useMemo(
    () => getChapter(lang, bookNum, chapNum),
    [lang, bookNum, chapNum]
  );

  const totalChapters = book?.chapters ?? 1;
  const totalVerses = verses.length;

  const listRef = useRef<FlatList<Verse>>(null);

  const [sidebar, setSidebar] = useState<SidebarMode>('none');
  const [selectedVerses, setSelectedVerses] = useState<Set<number>>(new Set());

  const selectionMode = selectedVerses.size > 0;

  useEffect(() => {
    if (book) {
      saveLastPosition({
        book: bookNum,
        bookName: book.name,
        chapter: chapNum,
      });
    }
  }, [bookNum, chapNum, book]);

  useEffect(() => {
    setSelectedVerses(new Set());
  }, [bookNum, chapNum]);

  const goToChapter = useCallback(
    (ch: number) => {
      setSidebar('none');

      router.replace({
        pathname: '/lecture/[livre]/[chapitre]',
        params: {
          livre: String(bookNum),
          chapitre: String(ch),
        },
      });
    },
    [bookNum, router]
  );

  const prevChapter = () => {
    if (chapNum > 1) {
      goToChapter(chapNum - 1);
    }
  };

  const nextChapter = () => {
    if (chapNum < totalChapters) {
      goToChapter(chapNum + 1);
    }
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dx) > 30 && Math.abs(g.dy) < 40,

        onPanResponderRelease: (_, g) => {
          if (g.dx < -60) {
            nextChapter();
          } else if (g.dx > 60) {
            prevChapter();
          }
        },
      }),
    [chapNum, totalChapters]
  );

  const scrollToVerse = (verseIndex: number) => {
    setSidebar('none');

    listRef.current?.scrollToIndex({
      index: verseIndex,
      animated: true,
      viewOffset: 8,
    });
  };

  useEffect(() => {
    if (!startVerse || verses.length === 0) return;

    const index = verses.findIndex((v) => Number(v.verse) === startVerse);

    if (index !== -1) {
      setTimeout(() => {
        listRef.current?.scrollToIndex({
          index,
          animated: true,
          viewPosition: 0.15,
        });
      }, 500);
    }
  }, [startVerse, verses]);

  const toggleVerse = (verseNum: number) => {
    setSelectedVerses((prev) => {
      const next = new Set(prev);

      if (next.has(verseNum)) {
        next.delete(verseNum);
      } else {
        next.add(verseNum);
      }

      return next;
    });
  };

  const handlePress = (v: Verse) => {
    if (selectionMode) {
      toggleVerse(Number(v.verse));
    }
  };

  const handleLongPress = async (v: Verse) => {
    if (selectionMode) return;

    const verseNum = Number(v.verse);
    const already = await isFavorite(v.book, v.chapter, verseNum);

    if (already) {
      Alert.alert(t.retirerFavori, `${book?.name} ${chapNum}:${verseNum}`, [
        {
          text: t.annuler,
          style: 'cancel',
        },
        {
          text: t.retirer,
          style: 'destructive',
          onPress: () => removeFavorite(`${v.book}-${v.chapter}-${verseNum}`),
        },
      ]);
    } else {
      setSelectedVerses(new Set([verseNum]));
    }
  };

  const cancelSelection = () => {
    setSelectedVerses(new Set());
  };

  const saveSelection = async () => {
    const sorted = Array.from(selectedVerses).sort((a, b) => a - b);

    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    const combinedText = sorted
      .map((vNum) => {
        const verse = verses.find((v) => Number(v.verse) === vNum);
        return verse ? `[${vNum}] ${verse.text}` : '';
      })
      .filter(Boolean)
      .join(' ');

    await addFavorite({
      book: bookNum,
      bookName: book?.name ?? '',
      chapter: chapNum,
      verse: first,
      endVerse: sorted.length > 1 ? last : undefined,
      text: combinedText,
    });

    cancelSelection();

    const label =
      sorted.length === 1
        ? `${book?.name} ${chapNum}:${first}`
        : `${book?.name} ${chapNum}:${first}-${last}`;

    Alert.alert(t.ajouteFavori, label);
  };

  const renderVerse = ({ item }: { item: Verse }) => {
    const verseNumber = Number(item.verse);

    const isHighlighted =
      startVerse !== null &&
      endVerse !== null &&
      verseNumber >= startVerse &&
      verseNumber <= endVerse;

    const isSelected = selectedVerses.has(verseNumber);

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => handlePress(item)}
        onLongPress={() => handleLongPress(item)}
        style={[
          styles.verseRow,
          isHighlighted && !isSelected && styles.highlightedVerseRow,
          isSelected && styles.selectedVerseRow,
        ]}
      >
        {isSelected && <View style={styles.selectedIndicator} />}

        <Text
          style={[
            styles.verseNum,
            isHighlighted && styles.highlightedVerseNum,
            isSelected && styles.selectedVerseNum,
          ]}
        >
          {item.verse}
        </Text>

        <Text
          style={[
            styles.verseText,
            {
              fontSize: fontSize,
              lineHeight: fontSize * 1.65,
            },
            isHighlighted && styles.highlightedVerseText,
            isSelected && styles.selectedVerseText,
          ]}
        >
          {item.text}
        </Text>
      </TouchableOpacity>
    );
  };

  const ChapterSidebar = () => (
    <Modal transparent animationType="fade" visible={sidebar === 'chapters'}>
      <Pressable style={styles.overlay} onPress={() => setSidebar('none')}>
        <View style={styles.sidePanel}>
          <Text style={styles.sidePanelTitle}>{t.chapitres}</Text>

          <ScrollView>
            {Array.from({ length: totalChapters }, (_, i) => i + 1).map(
              (ch) => (
                <TouchableOpacity
                  key={ch}
                  style={[
                    styles.sideItem,
                    ch === chapNum && styles.sideItemActive,
                  ]}
                  onPress={() => goToChapter(ch)}
                >
                  <Text
                    style={[
                      styles.sideItemText,
                      ch === chapNum && styles.sideItemTextActive,
                    ]}
                  >
                    {ch}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  );

  const VerseSidebar = () => (
    <Modal transparent animationType="fade" visible={sidebar === 'verses'}>
      <Pressable style={styles.overlay} onPress={() => setSidebar('none')}>
        <View style={styles.sidePanel}>
          <Text style={styles.sidePanelTitle}>{t.versets}</Text>

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

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <Stack.Screen
        options={{
          title: `${book?.name ?? '...'} ${chapNum}`,
          headerStyle: { backgroundColor: '#F5ECD7' },
          headerTintColor: '#8B4513',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ paddingHorizontal: 8 }}
            >
              <Text
                style={{
                  fontSize: 16,
                  color: '#8B4513',
                  fontWeight: '600',
                  minWidth: 60,
                }}
              >
                {t.retour}
              </Text>
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.toolbar}>
        <TouchableOpacity
          style={styles.toolBtn}
          onPress={() =>
            setSidebar(sidebar === 'chapters' ? 'none' : 'chapters')
          }
        >
          <Text style={styles.toolBtnText}>
            📖 {t.chapitres.slice(0, 2)}. {chapNum}/{totalChapters}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.langBtn}
          onPress={() => setLang(lang === 'fr' ? 'en' : 'fr')}
        >
          <Text style={styles.langBtnText}>
            {lang === 'fr' ? '🇫🇷 FR' : '🇬🇧 EN'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toolBtn}
          onPress={() =>
            setSidebar(sidebar === 'verses' ? 'none' : 'verses')
          }
        >
          <Text style={styles.toolBtnText}>V. 1 – {totalVerses}</Text>
        </TouchableOpacity>
      </View>

      {startVerse && endVerse && (
        <View style={styles.passageBanner}>
          <Text style={styles.passageBannerText}>
            {t.passage} : {book?.name} {chapNum}:{startVerse}-{endVerse}
          </Text>
        </View>
      )}

      <FlatList
        ref={listRef}
        data={verses}
        keyExtractor={(v) => String(v.verse)}
        renderItem={renderVerse}
        contentContainerStyle={styles.listContent}
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            listRef.current?.scrollToIndex({
              index: info.index,
              animated: true,
            });
          }, 300);
        }}
      />

      {selectionMode && (
        <View style={styles.selectionBar}>
          <TouchableOpacity onPress={cancelSelection} style={styles.cancelBtn}>
            <Text style={styles.cancelBtnText}>✕</Text>
          </TouchableOpacity>

          <Text style={styles.selectionCount}>
            {selectedVerses.size} {t.selectionner}
          </Text>

          <TouchableOpacity onPress={saveSelection} style={styles.saveBtn}>
            <Text style={styles.saveBtnText}>♥ {t.sauvegarder}</Text>
          </TouchableOpacity>
        </View>
      )}

      <ChapterSidebar />
      <VerseSidebar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },

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
    color: '#2C1A0E',
  },

  highlightedVerseRow: {
    backgroundColor: '#FFF3C4',
    borderLeftWidth: 4,
    borderLeftColor: '#8B4513',
    padding: 10,
    borderRadius: 10,
  },

  highlightedVerseNum: {
    color: '#8B4513',
    fontWeight: '900',
  },

  highlightedVerseText: {
    color: '#2C1A0E',
    fontWeight: '500',
  },

  selectedVerseRow: {
    backgroundColor: '#FFF0E8',
    borderRadius: 10,
    padding: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#C9922A',
  },

  selectedIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#C9922A',
    borderRadius: 2,
  },

  selectedVerseNum: {
    color: '#C9922A',
    fontWeight: '900',
  },

  selectedVerseText: {
    color: '#2C1A0E',
    fontWeight: '500',
  },

  selectionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    backgroundColor: '#2C1A0E',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#C9922A',
  },

  cancelBtn: {
    padding: 8,
  },

  cancelBtnText: {
    color: '#A08060',
    fontSize: 18,
    fontWeight: '300',
  },

  selectionCount: {
    color: '#F5EDD8',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    textAlign: 'center',
  },

  saveBtn: {
    backgroundColor: '#C9922A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },

  saveBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },

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

  passageBanner: {
    backgroundColor: '#FFF0C2',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#D0B896',
  },

  passageBannerText: {
    color: '#8B4513',
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
  },
});