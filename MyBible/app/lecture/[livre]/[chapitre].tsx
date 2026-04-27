import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ScrollView, Modal, Pressable, PanResponder, Alert, Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { useBible } from '../../../context/BibleContext';
import { getBooks, getChapter } from '../../../services/bibleService';
import type { Language, Verse } from '../../../services/bibleService';
import {
  addFavorite, removeFavorite, isFavorite,
  saveLastPosition, loadNote, hasNote, type Note,
} from '../../../services/storageService';
import NoteModal from '../../../components/NoteModal';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

type SidebarMode = 'none' | 'chapters' | 'verses';

const CATEGORIES = [
  { id: 'promises',  fr: 'Promesses', en: 'Promises',  mg: 'Fampanantenana', color: '#7A2010' },
  { id: 'faith',     fr: 'Foi',       en: 'Faith',     mg: 'Finoana',        color: '#1A3050' },
  { id: 'prayer',    fr: 'Prière',    en: 'Prayer',    mg: 'Vavaka',         color: '#3A5030' },
  { id: 'grace',     fr: 'Grâce',     en: 'Grace',     mg: 'Fahasoavana',    color: '#7A5C10' },
  { id: 'love',      fr: 'Amour',     en: 'Love',      mg: 'Fitiavana',      color: '#7A2040' },
  { id: 'hope',      fr: 'Espoir',    en: 'Hope',      mg: 'Fanantenana',    color: '#1A5050' },
  { id: 'wisdom',    fr: 'Sagesse',   en: 'Wisdom',    mg: 'Fahendrena',     color: '#5C3A6A' },
  { id: 'courage',   fr: 'Courage',   en: 'Courage',   mg: 'Herim-po',       color: '#8B4513' },
  { id: 'peace',     fr: 'Paix',      en: 'Peace',     mg: 'Fiadanana',      color: '#2A5040' },
  { id: 'salvation', fr: 'Salut',     en: 'Salvation', mg: 'Famonjena',      color: '#6A1A10' },
];

const T = {
  fr: {
    retour: '← Retour', chapitres: 'Chapitres', versets: 'Versets',
    chapitreCourt: 'Ch.', versetCourt: 'V.', passage: 'Passage',
    ajouteFavori: '✦ Ajouté aux favoris', retirerFavori: 'Retirer des favoris ?',
    annuler: 'Annuler', retirer: 'Retirer', selectionner: 'verset(s) sélectionné(s)',
    sauvegarder: 'Favori', choisirCategories: 'Choisir une catégorie',
    sansCategorie: 'Sans catégorie', valider: 'Valider', note: 'Note',
    precedent: 'Précédent', suivant: 'Suivant',
    partager: 'Partager', fermer: 'Fermer',
  },
  en: {
    retour: '← Back', chapitres: 'Chapters', versets: 'Verses',
    chapitreCourt: 'Ch.', versetCourt: 'V.', passage: 'Passage',
    ajouteFavori: '✦ Added to favourites', retirerFavori: 'Remove from favourites?',
    annuler: 'Cancel', retirer: 'Remove', selectionner: 'verse(s) selected',
    sauvegarder: 'Favourite', choisirCategories: 'Choose a category',
    sansCategorie: 'No category', valider: 'Apply', note: 'Note',
    precedent: 'Previous', suivant: 'Next',
    partager: 'Share', fermer: 'Close',
  },
  mg: {
    retour: '← Hiverina', chapitres: 'Toko', versets: 'Andininy',
    chapitreCourt: 'Toko', versetCourt: 'And.', passage: 'Andalana',
    ajouteFavori: '✦ Nampidirina ao amin\'ny ankafizina', retirerFavori: 'Esorina amin\'ny ankafizina ve?',
    annuler: 'Hanafoana', retirer: 'Esory', selectionner: 'andininy voafidy',
    sauvegarder: 'Ankafizina', choisirCategories: 'Misafidiana sokajy',
    sansCategorie: 'Tsy misy sokajy', valider: 'Hampihatra', note: 'Fanamarihana',
    precedent: 'Teo aloha', suivant: 'Manaraka',
    partager: 'Zarao', fermer: 'Hidio',
  },
};

export default function LectureScreen() {
  const { livre, chapitre, start, end } = useLocalSearchParams<{
    livre: string; chapitre: string; start?: string; end?: string;
  }>();

  const startVerse = start ? Number(start) : null;
  const endVerse   = end   ? Number(end)   : null;

  const { lang, setLang, fontSize } = useBible();
  const t      = T[lang];
  const router = useRouter();

  const bookNum = Number(livre);
  const chapNum = Number(chapitre);

  const books  = useMemo(() => getBooks(lang), [lang]);
  const book   = books.find(b => b.book === bookNum);
  const verses = useMemo(() => getChapter(lang, bookNum, chapNum), [lang, bookNum, chapNum]);

  const totalChapters = book?.chapters ?? 1;
  const totalVerses   = verses.length;

  const listRef    = useRef<FlatList<Verse>>(null);
  const shareRef   = useRef<ViewShot>(null);

  const [sidebar, setSidebar]                           = useState<SidebarMode>('none');
  const [selectedVerses, setSelectedVerses]             = useState<Set<number>>(new Set());
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [selectedCategories, setSelectedCategories]     = useState<string[]>([]);

  const [noteVerseNums, setNoteVerseNums]       = useState<Set<number>>(new Set());
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [noteTargetVerse, setNoteTargetVerse]   = useState<Verse | null>(null);
  const [noteEndVerse, setNoteEndVerse]         = useState<number | undefined>(undefined);
  const [noteExisting, setNoteExisting]         = useState<Note | null>(null);

  // ── Share state ──
  const [shareVerse, setShareVerse]               = useState<Verse | null>(null);
  const [shareVerseEnd, setShareVerseEnd]         = useState<number | undefined>(undefined);
  const [shareModalVisible, setShareModalVisible] = useState(false);

  const selectionMode = selectedVerses.size > 0;

  useEffect(() => {
    if (book) saveLastPosition({ book: bookNum, bookName: book.name, chapter: chapNum });
  }, [bookNum, chapNum, book]);

  useEffect(() => {
    setSelectedVerses(new Set());
    setSelectedCategories([]);
    setCategoryModalVisible(false);
    setNoteModalVisible(false);
    setNoteTargetVerse(null);
    setNoteExisting(null);
    setNoteEndVerse(undefined);
    setShareModalVisible(false);
    setShareVerse(null);
    setShareVerseEnd(undefined);
  }, [bookNum, chapNum]);

  useEffect(() => {
    let cancelled = false;
    async function loadNoteMarkers() {
      const withNotes = new Set<number>();
      for (const v of verses) {
        const found = await hasNote(bookNum, chapNum, Number(v.verse));
        if (found) withNotes.add(Number(v.verse));
      }
      if (!cancelled) setNoteVerseNums(withNotes);
    }
    loadNoteMarkers();
    return () => { cancelled = true; };
  }, [bookNum, chapNum, verses]);

  const goToChapter = useCallback((ch: number) => {
    setSidebar('none');
    router.replace({
      pathname: '/lecture/[livre]/[chapitre]',
      params: { livre: String(bookNum), chapitre: String(ch) },
    });
  }, [bookNum, router]);

  const prevChapter = () => { if (chapNum > 1) goToChapter(chapNum - 1); };
  const nextChapter = () => { if (chapNum < totalChapters) goToChapter(chapNum + 1); };

  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 30 && Math.abs(g.dy) < 40,
    onPanResponderRelease: (_, g) => {
      if (g.dx < -60) nextChapter();
      else if (g.dx > 60) prevChapter();
    },
  }), [chapNum, totalChapters]);

  const scrollToVerse = (verseIndex: number) => {
    setSidebar('none');
    listRef.current?.scrollToIndex({ index: verseIndex, animated: true, viewOffset: 8 });
  };

  useEffect(() => {
    if (!startVerse || verses.length === 0) return;
    const index = verses.findIndex(v => Number(v.verse) === startVerse);
    if (index !== -1) {
      setTimeout(() => {
        listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.15 });
      }, 500);
    }
  }, [startVerse, verses]);

  const toggleVerse = (verseNum: number) => {
    setSelectedVerses(prev => {
      const next = new Set(prev);
      if (next.has(verseNum)) next.delete(verseNum);
      else next.add(verseNum);
      return next;
    });
  };

  const toggleCategory = (catId: string) => {
    setSelectedCategories(prev =>
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

  const handlePress = (v: Verse) => {
    if (selectionMode) toggleVerse(Number(v.verse));
  };

  const handleLongPress = async (v: Verse) => {
    if (selectionMode) return;
    const verseNum = Number(v.verse);
    const already  = await isFavorite(v.book, v.chapter, verseNum);
    if (already) {
      Alert.alert(t.retirerFavori, `${book?.name} ${chapNum}:${verseNum}`, [
        { text: t.annuler, style: 'cancel' },
        { text: t.retirer, style: 'destructive', onPress: () => removeFavorite(`${v.book}-${v.chapter}-${verseNum}`) },
      ]);
    } else {
      setSelectedVerses(new Set([verseNum]));
    }
  };

  const cancelSelection = () => {
    setSelectedVerses(new Set());
    setSelectedCategories([]);
    setCategoryModalVisible(false);
  };

  const openFavoriteModal = () => {
    const sorted = Array.from(selectedVerses).sort((a, b) => a - b);
    if (sorted.length === 0) return;
    const first = sorted[0];
    const last  = sorted[sorted.length - 1];
    setNoteTargetVerse(verses.find(v => Number(v.verse) === first) ?? null);
    setNoteEndVerse(last > first ? last : undefined);
    setCategoryModalVisible(true);
  };

  const confirmFavorite = async () => {
    const sorted = Array.from(selectedVerses).sort((a, b) => a - b);
    if (sorted.length === 0) return;
    const first = sorted[0];
    const last  = sorted[sorted.length - 1];
    const endV  = last > first ? last : undefined;
    const combinedText = sorted
      .map(vNum => {
        const verse = verses.find(v => Number(v.verse) === vNum);
        return verse ? (sorted.length > 1 ? `[${vNum}] ${verse.text}` : verse.text) : '';
      })
      .filter(Boolean).join(' ');
    await addFavorite({
      book: bookNum, bookName: book?.name ?? '',
      chapter: chapNum, verse: first, endVerse: endV,
      text: combinedText, category: selectedCategories[0] ?? '',
      categories: selectedCategories,
    } as any);
    const label = sorted.length === 1
      ? `${book?.name} ${chapNum}:${first}`
      : `${book?.name} ${chapNum}:${first}-${last}`;
    setCategoryModalVisible(false);
    cancelSelection();
    Alert.alert(t.ajouteFavori, label);
  };

  const openNoteFromSelection = async () => {
    const sorted = Array.from(selectedVerses).sort((a, b) => a - b);
    if (sorted.length === 0) return;
    const first = sorted[0];
    const last  = sorted[sorted.length - 1];
    const endV  = last > first ? last : undefined;
    const firstVerse = verses.find(v => Number(v.verse) === first);
    if (!firstVerse) return;
    const combinedText = sorted
      .map(vNum => {
        const verse = verses.find(v => Number(v.verse) === vNum);
        return verse ? (sorted.length > 1 ? `[${vNum}] ${verse.text}` : verse.text) : '';
      })
      .filter(Boolean).join(' ');
    setNoteTargetVerse({ ...firstVerse, text: combinedText });
    setNoteEndVerse(endV);
    const existing = await loadNote(bookNum, chapNum, first);
    setNoteExisting(existing);
    cancelSelection();
    setNoteModalVisible(true);
  };

  const openNoteModal = async (v: Verse) => {
    const existing = await loadNote(bookNum, chapNum, Number(v.verse));
    setNoteTargetVerse(v);
    setNoteEndVerse(undefined);
    setNoteExisting(existing);
    setNoteModalVisible(true);
  };

  const handleNoteSaved = (note: Note) => {
    setNoteVerseNums(prev => new Set([...prev, note.verse]));
    setNoteModalVisible(false);
  };

  const handleNoteDeleted = () => {
    if (noteTargetVerse) {
      const vn = Number(noteTargetVerse.verse);
      setNoteVerseNums(prev => { const next = new Set(prev); next.delete(vn); return next; });
    }
    setNoteModalVisible(false);
  };

  // ── Share handlers ──
  const openShareFromSelection = () => {
    const sorted = Array.from(selectedVerses).sort((a, b) => a - b);
    if (sorted.length === 0) return;
    const first = sorted[0];
    const combinedText = sorted
      .map(vNum => {
        const verse = verses.find(v => Number(v.verse) === vNum);
        return verse ? (sorted.length > 1 ? `[${vNum}] ${verse.text}` : verse.text) : '';
      })
      .filter(Boolean).join(' ');
    const firstVerse = verses.find(v => Number(v.verse) === first);
    if (!firstVerse) return;
    // On stocke un verse synthétique avec le texte combiné et la plage
    setShareVerse({ ...firstVerse, text: combinedText });
    setShareVerseEnd(sorted.length > 1 ? sorted[sorted.length - 1] : undefined);
    cancelSelection();
    setShareModalVisible(true);
  };

  const handleShare = async () => {
    try {
      const uri = await captureRef(shareRef, {
        format: 'png',
        quality: 1,
      });
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: shareVerse
          ? `${book?.name} ${chapNum}:${shareVerse.verse}`
          : '',
      });
    } catch (e) {
      console.error(e);
    }
  };

  const renderVerse = ({ item }: { item: Verse }) => {
    const verseNumber   = Number(item.verse);
    const isHighlighted = startVerse !== null && endVerse !== null &&
      verseNumber >= startVerse && verseNumber <= endVerse;
    const isSelected  = selectedVerses.has(verseNumber);
    const hasNoteFlag = noteVerseNums.has(verseNumber);

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
        <View style={styles.verseNumCol}>
          <Text style={[styles.verseNum, isHighlighted && styles.highlightedVerseNum, isSelected && styles.selectedVerseNum]}>
            {item.verse}
          </Text>
          <TouchableOpacity
            onPress={() => openNoteModal(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.noteIcon}
          >
            <Text style={[styles.noteIconText, hasNoteFlag && styles.noteIconActive]}>
              {hasNoteFlag ? '✏️' : '✎'}
            </Text>
          </TouchableOpacity>

        </View>
        <Text style={[
          styles.verseText,
          { fontSize, lineHeight: fontSize * 1.65 },
          isHighlighted && styles.highlightedVerseText,
          isSelected && styles.selectedVerseText,
        ]}>
          {item.text}
        </Text>
      </TouchableOpacity>
    );
  };

  const ChapterSidebar = () => (
    <Modal transparent animationType="fade" visible={sidebar === 'chapters'}>
      <Pressable style={styles.sideOverlay} onPress={() => setSidebar('none')}>
        <Pressable style={styles.sideSheet}>
          <View style={styles.sideHeader}>
            <View style={styles.sideHeaderLeft}>
              <Text style={styles.sideHeaderBook}>{book?.name}</Text>
              <Text style={styles.sideHeaderSub}>{totalChapters} {t.chapitres.toLowerCase()}</Text>
            </View>
            <TouchableOpacity onPress={() => setSidebar('none')} style={styles.sideCloseBtn}>
              <Text style={styles.sideCloseBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.sideGrid} showsVerticalScrollIndicator={false}>
            {Array.from({ length: totalChapters }, (_, i) => i + 1).map(ch => {
              const isCurrent = ch === chapNum;
              return (
                <TouchableOpacity
                  key={ch}
                  style={[styles.sideGridCell, isCurrent && styles.sideGridCellActive]}
                  onPress={() => goToChapter(ch)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.sideGridCellText, isCurrent && styles.sideGridCellTextActive]}>
                    {ch}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );

  const VerseSidebar = () => (
    <Modal transparent animationType="fade" visible={sidebar === 'verses'}>
      <Pressable style={styles.sideOverlay} onPress={() => setSidebar('none')}>
        <Pressable style={styles.sideSheet}>
          <View style={styles.sideHeader}>
            <View style={styles.sideHeaderLeft}>
              <Text style={styles.sideHeaderBook}>{book?.name} {chapNum}</Text>
              <Text style={styles.sideHeaderSub}>{totalVerses} {t.versets.toLowerCase()}</Text>
            </View>
            <TouchableOpacity onPress={() => setSidebar('none')} style={styles.sideCloseBtn}>
              <Text style={styles.sideCloseBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.sideGrid} showsVerticalScrollIndicator={false}>
            {verses.map((v, index) => {
              const vNum    = Number(v.verse);
              const hasNote = noteVerseNums.has(vNum);
              return (
                <TouchableOpacity
                  key={v.verse}
                  style={[styles.sideGridCell, hasNote && styles.sideGridCellNote]}
                  onPress={() => scrollToVerse(index)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.sideGridCellText, hasNote && styles.sideGridCellTextNote]}>
                    {v.verse}
                  </Text>
                  {hasNote && <View style={styles.sideNoteDot} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Pressable>
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
            <TouchableOpacity onPress={() => router.back()} style={{ paddingHorizontal: 8 }}>
              <Text style={{ fontSize: 16, color: '#8B4513', fontWeight: '600', minWidth: 60 }}>{t.retour}</Text>
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.toolbar}>
        <TouchableOpacity
          style={[styles.toolBtn, sidebar === 'chapters' && styles.toolBtnActive]}
          onPress={() => setSidebar(sidebar === 'chapters' ? 'none' : 'chapters')}
        >
          <Text style={[styles.toolBtnText, sidebar === 'chapters' && styles.toolBtnTextActive]}>
            📖 {t.chapitreCourt} {chapNum}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.langBtn} onPress={() => {
          const cycle: Language[] = ['fr', 'en', 'mg'];
          setLang(cycle[(cycle.indexOf(lang) + 1) % cycle.length]);
        }}>
          <Text style={styles.langBtnText}>
            {lang === 'fr' ? '🇫🇷 FR' : lang === 'en' ? '🇬🇧 EN' : '🇲🇬 MG'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toolBtn, sidebar === 'verses' && styles.toolBtnActive]}
          onPress={() => setSidebar(sidebar === 'verses' ? 'none' : 'verses')}
        >
          <Text style={[styles.toolBtnText, sidebar === 'verses' && styles.toolBtnTextActive]}>
            {t.versetCourt} 1–{totalVerses}
          </Text>
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
        keyExtractor={v => String(v.verse)}
        renderItem={renderVerse}
        contentContainerStyle={styles.listContent}
        onScrollToIndexFailed={info => {
          setTimeout(() => listRef.current?.scrollToIndex({ index: info.index, animated: true }), 300);
        }}
      />

      {!selectionMode && (
        <View style={styles.navBar}>
          <TouchableOpacity
            onPress={prevChapter}
            disabled={chapNum <= 1}
            activeOpacity={0.7}
            style={[styles.glassBtn, chapNum <= 1 && styles.glassBtnDisabled]}
          >
            <BlurView intensity={60} tint="dark" style={styles.glassBtnInner}>
              <View style={styles.glassBtnOverlay} />
              <Text style={[styles.glassBtnArrow, chapNum <= 1 && styles.glassBtnTextDisabled]}>←</Text>
              <Text style={[styles.glassBtnText, chapNum <= 1 && styles.glassBtnTextDisabled]}>{t.precedent}</Text>
            </BlurView>
          </TouchableOpacity>

          <BlurView intensity={40} tint="dark" style={styles.navCenterGlass}>
            <View style={styles.navCenterOverlay} />
            <Text style={styles.navCenterText}>{chapNum}</Text>
            <Text style={styles.navCenterSub}>/ {totalChapters}</Text>
          </BlurView>

          <TouchableOpacity
            onPress={nextChapter}
            disabled={chapNum >= totalChapters}
            activeOpacity={0.7}
            style={[styles.glassBtn, chapNum >= totalChapters && styles.glassBtnDisabled]}
          >
            <BlurView intensity={60} tint="dark" style={styles.glassBtnInner}>
              <View style={styles.glassBtnOverlay} />
              <Text style={[styles.glassBtnText, chapNum >= totalChapters && styles.glassBtnTextDisabled]}>{t.suivant}</Text>
              <Text style={[styles.glassBtnArrow, chapNum >= totalChapters && styles.glassBtnTextDisabled]}>→</Text>
            </BlurView>
          </TouchableOpacity>
        </View>
      )}

      {selectionMode && (
        <View style={styles.selectionBar}>
          <TouchableOpacity onPress={cancelSelection} style={styles.cancelBtn}>
            <Text style={styles.cancelBtnText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.selectionCount}>{selectedVerses.size} {t.selectionner}</Text>
          <TouchableOpacity onPress={openNoteFromSelection} style={styles.noteSelBtn}>
            <Text style={styles.noteSelBtnText}>✎ {t.note}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={openShareFromSelection} style={styles.shareSelBtn}>
            <Text style={styles.shareSelBtnText}>↗ {t.partager}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={openFavoriteModal} style={styles.saveBtn}>
            <Text style={styles.saveBtnText}>♥ {t.sauvegarder}</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={categoryModalVisible} transparent animationType="fade">
        <Pressable style={styles.categoryOverlay} onPress={() => setCategoryModalVisible(false)}>
          <Pressable style={styles.categoryModal}>
            <Text style={styles.categoryModalTitle}>{t.choisirCategories}</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map(cat => {
                const active = selectedCategories.includes(cat.id);
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.categoryChip, active && { backgroundColor: cat.color, borderColor: cat.color }]}
                    onPress={() => toggleCategory(cat.id)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.categoryChipText, active && { color: '#fff', fontWeight: '700' }]}>
                      {cat[lang]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity style={styles.noCategoryBtn} onPress={() => setSelectedCategories([])}>
              <Text style={styles.noCategoryText}>{t.sansCategorie}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmCategoryBtn} onPress={confirmFavorite}>
              <Text style={styles.confirmCategoryText}>{t.valider}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {noteTargetVerse && (
        <NoteModal
          visible={noteModalVisible}
          lang={lang}
          book={bookNum}
          bookName={book?.name ?? ''}
          chapter={chapNum}
          verse={Number(noteTargetVerse.verse)}
          endVerse={noteEndVerse}
          verseText={noteTargetVerse.text}
          existingNote={noteExisting}
          onClose={() => setNoteModalVisible(false)}
          onSaved={handleNoteSaved}
          onDeleted={handleNoteDeleted}
        />
      )}

      {/* ── Modal de partage ── */}
      <Modal visible={shareModalVisible} transparent animationType="fade">
        <Pressable style={styles.shareOverlay} onPress={() => setShareModalVisible(false)}>
          <Pressable style={styles.shareModal}>

            {/* Carte capturée par ViewShot */}
            <ViewShot ref={shareRef} style={styles.shareCard} options={{ format: 'png', quality: 1 }}>
              <View style={styles.shareCardInner}>
                <Text style={styles.shareVerseRef}>
                  {book?.name} {chapNum}:{shareVerse?.verse}{shareVerseEnd ? `–${shareVerseEnd}` : ''}
                </Text>
                <View style={styles.shareRule} />
                <Text style={styles.shareVerseText}>
                  {shareVerse?.text}
                </Text>
                <View style={styles.shareRule} />
                <MaterialIcons name="volunteer-activism" size={20} color="#4c453a" />
              </View>
            </ViewShot>

            <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
              <Text style={styles.shareBtnText}>{t.partager}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareCloseBtn}
              onPress={() => setShareModalVisible(false)}
            >
              <Text style={styles.shareCloseBtnText}>{t.fermer}</Text>
            </TouchableOpacity>

          </Pressable>
        </Pressable>
      </Modal>

      <ChapterSidebar />
      <VerseSidebar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F0' },

  toolbar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: '#F5ECD7',
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#D0B896',
  },
  toolBtn: {
    backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 8, borderWidth: 1, borderColor: '#D0B896',
  },
  toolBtnActive: { backgroundColor: '#8B4513', borderColor: '#8B4513' },
  toolBtnText: { fontSize: 13, color: '#5C3D1E', fontWeight: '500' },
  toolBtnTextActive: { color: '#fff' },
  langBtn: { backgroundColor: '#8B4513', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  langBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  listContent: { padding: 16, paddingBottom: 120 },

  verseRow: { flexDirection: 'row', marginBottom: 14, alignItems: 'flex-start' },
  verseNumCol: { alignItems: 'center', minWidth: 36, marginTop: 2, gap: 4 },
  verseNum: { fontSize: 11, fontWeight: '700', color: '#8B4513' },
  noteIcon: { alignItems: 'center' },
  noteIconText: { fontSize: 13, color: '#C0A070' },
  noteIconActive: { fontSize: 14 },

  verseText: { flex: 1, color: '#2C1A0E' },

  highlightedVerseRow: {
    backgroundColor: '#FFF3C4', borderLeftWidth: 4,
    borderLeftColor: '#8B4513', padding: 10, borderRadius: 10,
  },
  highlightedVerseNum: { color: '#8B4513', fontWeight: '900' },
  highlightedVerseText: { color: '#2C1A0E', fontWeight: '500' },

  selectedVerseRow: {
    backgroundColor: '#FFF0E8', borderRadius: 10,
    padding: 10, borderLeftWidth: 4, borderLeftColor: '#C9922A',
  },
  selectedIndicator: {
    position: 'absolute', left: 0, top: 0, bottom: 0,
    width: 4, backgroundColor: '#C9922A', borderRadius: 2,
  },
  selectedVerseNum: { color: '#C9922A', fontWeight: '900' },
  selectedVerseText: { color: '#2C1A0E', fontWeight: '500' },

  navBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 12,
    backgroundColor: 'transparent',
    gap: 10,
  },

  glassBtn: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 200, 180, 0.25)',
    shadowColor: '#7A2010',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  glassBtnDisabled: { shadowOpacity: 0, elevation: 0 },
  glassBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 6,
    overflow: 'hidden',
  },
  glassBtnOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(122, 32, 16, 0.55)',
    borderRadius: 16,
  },
  glassBtnArrow: { fontSize: 17, color: '#FFE8E0', fontWeight: '700' },
  glassBtnText: { fontSize: 13, color: '#FFE8E0', fontWeight: '600', letterSpacing: 0.2 },
  glassBtnTextDisabled: { color: 'rgba(255,232,224,0.4)' },
  navCenterGlass: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(122, 32, 16, 0.25)',
  },
  navCenterOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(122, 32, 16, 0.08)',
  },
  navCenterText: { fontSize: 20, fontWeight: '700', color: '#FFE8E0' },
  navCenterSub: { fontSize: 12, color: 'rgba(255,232,224,0.6)', fontWeight: '500' },

  selectionBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    backgroundColor: '#2C1A0E',
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#C9922A',
    gap: 8,
  },
  cancelBtn: { padding: 8 },
  cancelBtnText: { color: '#A08060', fontSize: 18, fontWeight: '300' },
  selectionCount: { color: '#F5EDD8', fontSize: 12, fontWeight: '500', flex: 1, textAlign: 'center' },
  noteSelBtn: {
    backgroundColor: '#5C4020', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
  },
  noteSelBtnText: { color: '#F5EDD8', fontWeight: '700', fontSize: 13 },
  shareSelBtn: {
    backgroundColor: '#2A4A6A', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
  },
  shareSelBtnText: { color: '#F5EDD8', fontWeight: '700', fontSize: 13 },
  saveBtn: {
    backgroundColor: '#C9922A', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  sideOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end',
  },
  sideSheet: {
    backgroundColor: '#FFF8F0', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '75%', paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  sideHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#D0B896',
  },
  sideHeaderLeft: { gap: 2 },
  sideHeaderBook: { fontSize: 16, fontWeight: '700', color: '#2C1A0E', letterSpacing: 0.3 },
  sideHeaderSub: {
    fontSize: 11, color: '#A08060', fontWeight: '500',
    textTransform: 'uppercase', letterSpacing: 1,
  },
  sideCloseBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#F0E4D0', alignItems: 'center', justifyContent: 'center',
  },
  sideCloseBtnText: { fontSize: 14, color: '#8B4513', fontWeight: '600' },
  sideGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 10 },
  sideGridCell: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: '#F5ECD7', alignItems: 'center', justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth, borderColor: '#D0B896', position: 'relative',
  },
  sideGridCellActive: { backgroundColor: '#8B4513', borderColor: '#8B4513' },
  sideGridCellNote: { backgroundColor: '#FFF3C4', borderColor: '#C9922A' },
  sideGridCellText: { fontSize: 15, fontWeight: '600', color: '#5C3D1E' },
  sideGridCellTextActive: { color: '#fff', fontWeight: '700' },
  sideGridCellTextNote: { color: '#8B4513' },
  sideNoteDot: {
    position: 'absolute', top: 6, right: 6,
    width: 5, height: 5, borderRadius: 3, backgroundColor: '#C9922A',
  },

  passageBanner: {
    backgroundColor: '#FFF0C2', paddingVertical: 8, paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#D0B896',
  },
  passageBannerText: { color: '#8B4513', textAlign: 'center', fontSize: 13, fontWeight: '700' },

  categoryOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center', alignItems: 'center',
  },
  categoryModal: { width: '88%', backgroundColor: '#FFF8F0', borderRadius: 16, padding: 20 },
  categoryModalTitle: {
    fontSize: 14, fontWeight: '700', color: '#2C1A0E',
    marginBottom: 16, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1,
  },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1, borderColor: '#8B654050', backgroundColor: '#F5EDD8',
  },
  categoryChipText: { fontSize: 13, fontWeight: '600', color: '#5C3D1E' },
  noCategoryBtn: { marginTop: 16, paddingVertical: 10, alignItems: 'center' },
  noCategoryText: { color: '#A08060', fontSize: 12 },
  confirmCategoryBtn: {
    marginTop: 8, backgroundColor: '#7A2010',
    paddingVertical: 11, borderRadius: 10, alignItems: 'center',
  },
  confirmCategoryText: { color: '#fff', fontWeight: '700' },

  // ── Styles du partage ──
  // Thème : Parchemin | Police : Mono | Layout : Centré | Règles : oui | Logo : non | Italique : non
  shareOverlay: {
    flex: 1,
    backgroundColor: 'rgba(44, 26, 14, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  shareModal: {
    width: '100%',
    alignItems: 'center',
    gap: 14,
  },
  shareCard: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  shareCardInner: {
    // Fond transparent-parchemin : léger voile sur blanc cassé
    backgroundColor: 'rgba(255, 248, 240, 0.96)',
    padding: 32,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D0B896',
    alignItems: 'center',
    gap: 18,
  },
  shareVerseRef: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: '#8B4513',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  shareRule: {
    width: 48,
    height: 1,
    backgroundColor: '#C9922A',
    opacity: 0.5,
  },
  shareVerseText: {
    fontSize: 17,
    lineHeight: 28,
    color: '#2C1A0E',
    fontStyle: 'normal',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    letterSpacing: 0.2,
  },
  shareBtn: {
    backgroundColor: '#8B4513',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  shareBtnText: {
    color: '#FFF8F0',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  shareCloseBtn: {
    paddingVertical: 10,
  },
  shareCloseBtnText: {
    color: '#F5EDD8',
    fontSize: 14,
    opacity: 0.6,
  },
});