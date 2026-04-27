import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Pressable,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Alert,
  Keyboard,
  ScrollView,
} from 'react-native';
import type { Note, NoteTag } from '../services/storageService';
import { saveNote, deleteNote } from '../services/storageService';

const C = {
  bg:       '#FFF8F0',
  bgDeep:   '#F5ECD7',
  ink:      '#2C1A0E',
  inkLight: '#5C3D1E',
  inkFaint: '#A08060',
  border:   '#D0B896',
  rubriq:   '#7A2010',
  sepia:    '#8B4513',
  gold:     '#C9922A',
  white:    '#FFFFFF',
};

type TagDef = { id: NoteTag; fr: string; en: string; mg: string };

const TAGS: TagDef[] = [
  { id: 'priere',     fr: 'Prière',      en: 'Prayer',      mg: 'Vavaka',         },
  { id: 'etude',      fr: 'Étude',       en: 'Study',       mg: 'Fianarana',      },
  { id: 'meditation', fr: 'Méditation',  en: 'Meditation',  mg: 'Fisainana',      },
  { id: 'promesse',   fr: 'Promesse',    en: 'Promise',     mg: 'Fampanantenana', },
  { id: 'temoignage', fr: 'Témoignage',  en: 'Testimony',   mg: 'Filazana',       },
  { id: 'question',   fr: 'Question',    en: 'Question',    mg: 'Fanontaniana',   },
];

const UI = {
  fr: {
    title:       'Note personnelle',
    titleEdit:   'Modifier la note',
    placeholder: 'Écrivez votre réflexion…',
    tags:        'Étiquettes',
    save:        'Enregistrer',
    delete:      'Supprimer',
    confirmDel:  'Supprimer cette note ?',
    confirmMsg:  'Cette action est irréversible.',
    cancel:      'Annuler',
    confirm:     'Supprimer',
  },
  en: {
    title:       'Personal note',
    titleEdit:   'Edit note',
    placeholder: 'Write your reflection…',
    tags:        'Tags',
    save:        'Save',
    delete:      'Delete',
    confirmDel:  'Delete this note?',
    confirmMsg:  'This action cannot be undone.',
    cancel:      'Cancel',
    confirm:     'Delete',
  },
  mg: {
    title:       'Fanamarihana manokana',
    titleEdit:   'Hanova ny fanamarihana',
    placeholder: 'Soraty ny hevitrao…',
    tags:        'Marika',
    save:        'Tehirizo',
    delete:      'Fafao',
    confirmDel:  'Hofafana ve ity fanamarihana ity?',
    confirmMsg:  'Tsy azo averina izany.',
    cancel:      'Hanafoana',
    confirm:     'Fafao',
  },
};

type Props = {
  visible: boolean;
  lang: 'fr' | 'en' | 'mg';
  book: number;
  bookName: string;
  chapter: number;
  verse: number;
  endVerse?: number;
  verseText: string;
  existingNote: Note | null;
  onClose: () => void;
  onSaved: (note: Note) => void;
  onDeleted: () => void;
};

export default function NoteModal({
  visible, lang,
  book, bookName, chapter, verse, endVerse, verseText,
  existingNote,
  onClose, onSaved, onDeleted,
}: Props) {
  const t = UI[lang];
  const inputRef = useRef<TextInput>(null);

  const [content, setContent] = useState('');
  const [tags, setTags]       = useState<NoteTag[]>([]);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    if (visible) {
      setContent(existingNote?.content ?? '');
      setTags(existingNote?.tags ?? []);
    }
  }, [visible, existingNote]);

  const toggleTag = (id: NoteTag) => {
    setTags(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!content.trim()) return;
    Keyboard.dismiss();
    setSaving(true);
    try {
      const note = await saveNote({
        book, bookName, chapter, verse, verseText,
        endVerse,
        content: content.trim(),
        tags,
      });
      onSaved(note);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Keyboard.dismiss();
    Alert.alert(t.confirmDel, t.confirmMsg, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.confirm,
        style: 'destructive',
        onPress: async () => {
          await deleteNote(book, chapter, verse, endVerse);
          onDeleted();
        },
      },
    ]);
  };

  const handleClose = () => {
    Keyboard.dismiss();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.kavWrapper}
        >
          <Pressable style={styles.sheet} onPress={Keyboard.dismiss}>

            {/* ── Poignée ── */}
            <View style={styles.handle} />

            {/* ── En-tête fixe ── */}
            <View style={styles.header}>
              <View>
                <Text style={styles.headerTitle}>
                  {existingNote ? t.titleEdit : t.title}
                </Text>
                <Text style={styles.headerRef}>
                  {bookName} {chapter}:{verse}{endVerse && endVerse !== verse ? `–${endVerse}` : ''}
                </Text>
              </View>
              <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* ── Contenu scrollable ── */}
            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Verset cité */}
              <View style={styles.verseQuote}>
                <Text style={styles.verseQuoteText} numberOfLines={4}>
                  {verseText}
                </Text>
              </View>

              {/* Tags */}
              <Text style={styles.sectionLabel}>{t.tags}</Text>
              <View style={styles.tagsRow}>
                {TAGS.map(tag => {
                  const active = tags.includes(tag.id);
                  return (
                    <TouchableOpacity
                      key={tag.id}
                      style={[styles.tag, active && styles.tagActive]}
                      onPress={() => toggleTag(tag.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.tagLabel, active && styles.tagLabelActive]}>
                        {tag[lang]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Zone de texte */}
              <TextInput
                ref={inputRef}
                style={styles.input}
                multiline
                value={content}
                onChangeText={setContent}
                placeholder={t.placeholder}
                placeholderTextColor={C.inkFaint}
                textAlignVertical="top"
                scrollEnabled={false} // le scroll est géré par le ScrollView parent
              />
            </ScrollView>

            {/* ── Boutons ancrés en bas, toujours visibles ── */}
            <View style={styles.actions}>
              {existingNote && (
                <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
                  <Text style={styles.deleteBtnText}>{t.delete}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={handleSave}
                style={[styles.saveBtn, (!content.trim() || saving) && styles.saveBtnDisabled]}
                disabled={!content.trim() || saving}
              >
                <Text style={styles.saveBtnText}>{t.save}</Text>
              </TouchableOpacity>
            </View>

          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
    kavWrapper: {
    justifyContent: 'flex-end',
    flex: 1,  // ← permet au sheet de s'étirer vers le haut
    },
    sheet: {
    backgroundColor: C.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    flex: 1,        // ← prend tout l'espace disponible
    marginTop: 60,  // ← laisse un peu d'espace en haut pour voir derrière
    },

  handle: {
    width: 40, height: 4,
    borderRadius: 2,
    backgroundColor: C.border,
    alignSelf: 'center',
    marginBottom: 16,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.rubriq,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  headerRef: {
    fontSize: 12,
    color: C.inkFaint,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    fontSize: 18,
    color: C.inkFaint,
    fontWeight: '300',
  },

  // ScrollView prend tout l'espace disponible entre header et boutons
    scrollArea: {
        flex: 1, 
        },
    scrollContent: {
        padding: 20,
        paddingBottom: 8,
    },

  verseQuote: {
    borderLeftWidth: 3,
    borderLeftColor: C.sepia + '60',
    backgroundColor: C.bgDeep,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  verseQuoteText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: C.inkLight,
    lineHeight: 20,
  },

  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: C.inkFaint,
    textTransform: 'uppercase',
    marginBottom: 10,
  },

  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
    backgroundColor: C.bgDeep,
  },
  tagActive: {
    backgroundColor: C.sepia,
    borderColor: C.sepia,
  },
  tagLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: C.inkLight,
  },
  tagLabelActive: {
    color: C.white,
  },

  input: {
    backgroundColor: C.bgDeep,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
    padding: 14,
    fontSize: 15,
    color: C.ink,
    lineHeight: 24,
    minHeight: 150,
  },

  // Boutons toujours visibles, collés en bas
  actions: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.border,
    backgroundColor: C.bg,
  },
  deleteBtn: {
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.rubriq + '80',
  },
  deleteBtnText: {
    color: C.rubriq,
    fontWeight: '600',
    fontSize: 13,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: C.sepia,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.4,
  },
  saveBtnText: {
    color: C.white,
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.3,
  },
});