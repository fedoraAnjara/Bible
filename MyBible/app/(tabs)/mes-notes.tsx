import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useBible } from '../../context/BibleContext';
import { loadAllNotes, type Note, type NoteTag } from '../../services/storageService';
import NoteModal from '../../components/NoteModal';

// ─── Palette ─────────────────────────────────────────────────
const C = {
  bg:        '#FFF8F0',
  bgCard:    '#FAF4E6',
  bgDeep:    '#F5ECD7',
  ink:       '#2C1A0E',
  inkLight:  '#5C3D1E',
  inkFaint:  '#A08060',
  border:    '#D0B896',
  sepia:     '#8B4513',
  rubriq:    '#7A2010',
  gold:      '#C9922A',
};

// ─── Tags ────────────────────────────────────────────────────
type TagDef = { id: NoteTag; fr: string; en: string; mg: string; };

const TAGS: TagDef[] = [
  { id: 'priere',     fr: 'Prière',      en: 'Prayer',      mg: 'Vavaka',         },
  { id: 'etude',      fr: 'Étude',       en: 'Study',       mg: 'Fianarana',      },
  { id: 'meditation', fr: 'Méditation',  en: 'Meditation',  mg: 'Fisainana',      },
  { id: 'promesse',   fr: 'Promesse',    en: 'Promise',     mg: 'Fampanantenana', },
  { id: 'temoignage', fr: 'Témoignage',  en: 'Testimony',   mg: 'Filazana',       },
  { id: 'question',   fr: 'Question',    en: 'Question',    mg: 'Fanontaniana',   },
];

const tagById = (id: NoteTag) => TAGS.find(t => t.id === id);

// ─── UI strings ──────────────────────────────────────────────
const UI = {
  fr: {
    title:   'Mes Notes',
    empty:   'Aucune note pour l\'instant.',
    emptySub:'Appuyez sur ✎ à côté d\'un verset dans la lecture pour ajouter une note.',
    filter:  'Filtrer',
    all:     'Toutes',
    modifiedOn: 'Modifié le',
  },
  en: {
    title:   'My Notes',
    empty:   'No notes yet.',
    emptySub:'Tap ✎ next to a verse while reading to add a note.',
    filter:  'Filter',
    all:     'All',
    modifiedOn: 'Edited',
  },
  mg: {
    title:   'Ny fanamarihako',
    empty:   'Tsy misy fanamarihana.',
    emptySub:'Tsindrio ✎ eo anilan\'ny andininy raha mamaky mba hanampy fanamarihana.',
    filter:  'Sisika',
    all:     'Rehetra',
    modifiedOn: 'Novaina',
  },
};

function formatDate(ts: number, lang: string): string {
  return new Date(ts).toLocaleDateString(
    lang === 'fr' ? 'fr-FR' : lang === 'mg' ? 'fr-MG' : 'en-GB',
    { day: 'numeric', month: 'short', year: 'numeric' }
  );
}

export default function MesNotesScreen() {
  const { lang } = useBible();
  const t        = UI[lang];
  const router   = useRouter();

  const [notes, setNotes]               = useState<Note[]>([]);
  const [activeTag, setActiveTag]       = useState<NoteTag | null>(null);
  const [editingNote, setEditingNote]   = useState<Note | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Recharge à chaque fois qu'on revient sur l'écran
  useFocusEffect(
    useCallback(() => {
      loadAllNotes().then(setNotes);
    }, [])
  );

  const filtered = activeTag
    ? notes.filter(n => n.tags.includes(activeTag))
    : notes;

  const openEdit = (note: Note) => {
    setEditingNote(note);
    setModalVisible(true);
  };

  const handleSaved = (updated: Note) => {
    setNotes(prev => prev.map(n => n.id === updated.id ? updated : n));
    setModalVisible(false);
  };

  const handleDeleted = () => {
    if (editingNote) {
      setNotes(prev => prev.filter(n => n.id !== editingNote.id));
    }
    setModalVisible(false);
  };

  const goToVerse = (note: Note) => {
    router.push({
      pathname: '/lecture/[livre]/[chapitre]',
      params: {
        livre:    String(note.book),
        chapitre: String(note.chapter),
        start:    String(note.verse),
        end:      String(note.endVerse ?? note.verse),
      },
    });
  };

  // ── Carte note ──
  const renderNote = ({ item }: { item: Note }) => (
  <TouchableOpacity
    style={styles.card}
    activeOpacity={0.75}
    onPress={() => goToVerse(item)}  // ← carte entière → navigation
  >
    <View style={styles.cardHeader}>
      <Text style={styles.cardRef}>
        {item.bookName} {item.chapter}:{item.verse}{item.endVerse && item.endVerse !== item.verse ? `–${item.endVerse}` : ''}
      </Text>
      <View style={styles.cardHeaderRight}>
        <Text style={styles.cardDate}>
          {t.modifiedOn} {formatDate(item.updatedAt, lang)}
        </Text>
        <TouchableOpacity
          onPress={() => openEdit(item)}  // ← bouton dédié → modale
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.editIcon}>✎</Text>
        </TouchableOpacity>
      </View>
    </View>

    <Text style={styles.cardVerse} numberOfLines={2}>{item.verseText}</Text>
    <Text style={styles.cardContent} numberOfLines={4}>{item.content}</Text>

    {item.tags.length > 0 && (
      <View style={styles.cardTags}>
        {item.tags.map(tagId => {
          const tag = tagById(tagId);
          return tag ? (
            <View key={tagId} style={styles.cardTag}>
              <Text style={styles.cardTagText}>{tag[lang]}</Text>
            </View>
          ) : null;
        })}
      </View>
    )}
  </TouchableOpacity>
);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bgDeep} />

      {/* ── En-tête ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t.title}</Text>
        <Text style={styles.headerCount}>{notes.length}</Text>
      </View>

      {/* ── Filtres par tag ── */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterChip, !activeTag && styles.filterChipActive]}
          onPress={() => setActiveTag(null)}
        >
          <Text style={[styles.filterChipText, !activeTag && styles.filterChipTextActive]}>
            {t.all}
          </Text>
        </TouchableOpacity>
        {TAGS.map(tag => {
          const active = activeTag === tag.id;
          return (
            <TouchableOpacity
              key={tag.id}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setActiveTag(active ? null : tag.id)}
            >
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                 {tag[lang]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Liste ── */}
      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>✎</Text>
          <Text style={styles.emptyText}>{t.empty}</Text>
          <Text style={styles.emptySubText}>{t.emptySub}</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={n => n.id}
          renderItem={renderNote}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* ── Modale d'édition ── */}
      {editingNote && (
        <NoteModal
          visible={modalVisible}
          lang={lang}
          book={editingNote.book}
          bookName={editingNote.bookName}
          chapter={editingNote.chapter}
          verse={editingNote.verse}
          verseText={editingNote.verseText}
          existingNote={editingNote}
          onClose={() => setModalVisible(false)}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 20,
    paddingBottom: 14,
    backgroundColor: C.bgDeep,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '300',
    color: C.ink,
    letterSpacing: 0.5,
  },
  headerCount: {
    fontSize: 13,
    color: C.inkFaint,
    fontWeight: '600',
  },

  filterBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: C.bgDeep,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  filterChip: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
    backgroundColor: C.bg,
  },
  filterChipActive: {
    backgroundColor: C.sepia,
    borderColor: C.sepia,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.inkLight,
  },
  filterChipTextActive: {
    color: '#fff',
  },

  list: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },

  card: {
    backgroundColor: C.bgCard,
    borderRadius: 12,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
    gap: 8,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardRef: {
    fontSize: 13,
    fontWeight: '700',
    color: C.sepia,
    letterSpacing: 0.3,
  },
  cardDate: {
    fontSize: 10,
    color: C.inkFaint,
    letterSpacing: 0.3,
  },

  cardVerse: {
    fontSize: 12,
    fontStyle: 'italic',
    color: C.inkFaint,
    lineHeight: 18,
    borderLeftWidth: 2,
    borderLeftColor: C.border,
    paddingLeft: 10,
  },

  cardContent: {
    fontSize: 15,
    color: C.ink,
    lineHeight: 23,
  },

  cardTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  cardTag: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: C.bgDeep,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
  },
  cardTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: C.inkLight,
  },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 40,
    color: C.inkFaint,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: C.inkLight,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 13,
    color: C.inkFaint,
    textAlign: 'center',
    lineHeight: 20,
  },
  cardHeaderRight: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 10,
},
editIcon: {
  fontSize: 16,
  color: C.inkFaint,
},
});
  