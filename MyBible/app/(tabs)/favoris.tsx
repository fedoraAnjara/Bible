import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, Modal, ScrollView, Pressable,
} from 'react-native';
import { useRouter, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  loadFavorites, removeFavorite, setFavoriteCategories,
} from '../../services/storageService';
import type { Favorite } from '../../services/storageService';
import { useBible } from '../../context/BibleContext';
import { getBooks, getChapter } from '../../services/bibleService';
import Ionicons from '@expo/vector-icons/Ionicons';

const P = {
  parchment: '#F5EDD8',
  parchmentDk: '#EDE0C0',
  parchmentLt: '#FAF4E6',
  ink: '#2C1F0E',
  inkLight: '#5C4020',
  inkFaint: '#A08060',
  sepia: '#8B6540',
  rubriq: '#7A2010',
};

const CATEGORIES = [
  { id: 'promises', fr: 'Promesses', en: 'Promises', mg: 'Fampanantenana', color: '#7A2010' },
  { id: 'faith', fr: 'Foi', en: 'Faith', mg: 'Finoana', color: '#1A3050' },
  { id: 'prayer', fr: 'Prière', en: 'Prayer', mg: 'Vavaka', color: '#3A5030' },
  { id: 'grace', fr: 'Grâce', en: 'Grace', mg: 'Fahasoavana', color: '#7A5C10' },
  { id: 'love', fr: 'Amour', en: 'Love', mg: 'Fitiavana', color: '#7A2040' },
  { id: 'hope', fr: 'Espoir', en: 'Hope', mg: 'Fanantenana', color: '#1A5050' },
  { id: 'wisdom', fr: 'Sagesse', en: 'Wisdom', mg: 'Fahendrena', color: '#5C3A6A' },
  { id: 'courage', fr: 'Courage', en: 'Courage', mg: 'Herim-po', color: '#8B4513' },
  { id: 'peace', fr: 'Paix', en: 'Peace', mg: 'Fiadanana', color: '#2A5040' },
  { id: 'salvation', fr: 'Salut', en: 'Salvation', mg: 'Famonjena', color: '#6A1A10' },
];

function getCatById(id: string) {
  return CATEGORIES.find(c => c.id === id) ?? null;
}

function getCatLabel(id: string, lang: 'fr' | 'en' | 'mg') {
  const cat = getCatById(id);
  return cat ? cat[lang] : id;
}

function getCatColor(id: string) {
  return getCatById(id)?.color ?? P.inkFaint;
}

const T = {
  fr: {
    titre: 'Mes Favoris',
    tous: 'Tous',
    recents: 'Récents',
    categories: 'Catégories',
    vide: 'Aucun favori pour l\'instant.',
    videHint: 'Appuyez longuement sur un verset pour l\'ajouter.',
    retirer: 'Retirer des favoris ?',
    annuler: 'Annuler',
    supprimer: 'Supprimer',
    lire: 'Lire',
    ajouterCat: 'Choisir des catégories',
    sansCat: 'Sans catégorie',
    retirecat: 'Retirer toutes les catégories',
    toutesLes: 'Toutes les catégories',
    filtreEt: 'Filtre : affiche les versets liés à au moins une catégorie choisie',
    verset: 'verset',
    versets: 'versets',
    aucun: '—',
    valider: 'Valider',
  },
  en: {
    titre: 'My Favourites',
    tous: 'All',
    recents: 'Recent',
    categories: 'Categories',
    vide: 'No favourites yet.',
    videHint: 'Long press a verse to add it.',
    retirer: 'Remove from favourites?',
    annuler: 'Cancel',
    supprimer: 'Remove',
    lire: 'Read',
    ajouterCat: 'Choose categories',
    sansCat: 'Uncategorized',
    retirecat: 'Remove all categories',
    toutesLes: 'All categories',
    filtreEt: 'Filter: shows verses linked to at least one selected category',
    verset: 'verse',
    versets: 'verses',
    aucun: '—',
    valider: 'Apply',
  },
  mg: {
    titre: 'Ireo ankafiziko',
    tous: 'Rehetra',
    recents: 'Vao haingana',
    categories: 'Sokajy',
    vide: 'Tsy mbola misy ankafizina.',
    videHint: 'Tsindrio ela ny andininy iray hanampiana azy.',
    retirer: 'Esorina amin’ny ankafizina ve?',
    annuler: 'Hanafoana',
    supprimer: 'Esory',
    lire: 'Vakio',
    ajouterCat: 'Misafidiana sokajy',
    sansCat: 'Tsy sokajiana',
    retirecat: 'Esory ny sokajy rehetra',
    toutesLes: 'Sokajy rehetra',
    filtreEt: 'Sivana : mampiseho andininy manana farafahakeliny sokajy iray voafidy',
    verset: 'andininy',
    versets: 'andininy',
    aucun: '—',
    valider: 'Hampihatra',
  },
};

type Tab = 'tous' | 'recents' | 'categories';

export default function FavorisScreen() {
  const { lang } = useBible();
  const t = T[lang];
  const router = useRouter();

  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [tab, setTab] = useState<Tab>('tous');
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [catModal, setCatModal] = useState<Favorite | null>(null);
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);

  const books = useMemo(() => getBooks(lang), [lang]);

  useFocusEffect(
    useCallback(() => {
      loadFavorites().then(setFavorites);
    }, [])
  );

  const getFavoriteCats = (fav: Favorite) => {
    const oldCat = (fav as any).category;
    const newCats = (fav as any).categories;

    if (Array.isArray(newCats)) return newCats;
    if (oldCat) return [oldCat];

    return [];
  };

  const getBookName = (fav: Favorite) =>
    books.find(b => b.book === fav.book)?.name ?? fav.bookName;

  const getVerseText = (fav: Favorite) => {
    const verses = getChapter(lang, fav.book, fav.chapter);
    const start = fav.verse;
    const end = fav.endVerse ?? fav.verse;

    const selected = verses.filter(
      v => Number(v.verse) >= start && Number(v.verse) <= end
    );

    if (selected.length === 0) return fav.text;

    return selected
      .map(v => fav.endVerse ? `[${v.verse}] ${v.text}` : v.text)
      .join(' ');
  };

  const getRef = (fav: Favorite) => {
    const name = getBookName(fav);

    return fav.endVerse
      ? `${name} ${fav.chapter}:${fav.verse}-${fav.endVerse}`
      : `${name} ${fav.chapter}:${fav.verse}`;
  };

  const versetLabel = (n: number) =>
    `${n} ${n > 1 ? t.versets : t.verset}`;

  const sorted = useMemo(
    () => [...favorites].sort((a, b) => b.addedAt - a.addedAt),
    [favorites]
  );

  const recent = useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return sorted.filter(f => f.addedAt >= cutoff);
  }, [sorted]);

const byCat = useMemo(() => {
  if (selectedCats.length === 0) return sorted;

  return sorted.filter(fav => {
    const favCats = getFavoriteCats(fav);

    // Filtre OU : afficher si le favori possède AU MOINS UNE catégorie sélectionnée
    return selectedCats.some(catId => favCats.includes(catId));
  });
}, [sorted, selectedCats]);

  const displayData: Favorite[] =
    tab === 'recents' ? recent :
    tab === 'categories' ? byCat :
    sorted;

  const toggleSelectedCat = (catId: string) => {
    setSelectedCats(prev =>
      prev.includes(catId)
        ? prev.filter(id => id !== catId)
        : [...prev, catId]
    );
  };

  const countForCategory = (catId: string) =>
    sorted.filter(f => getFavoriteCats(f).includes(catId)).length;

  const handleRemove = (fav: Favorite) => {
    Alert.alert(t.retirer, getRef(fav), [
      { text: t.annuler, style: 'cancel' },
      {
        text: t.supprimer,
        style: 'destructive',
        onPress: async () => {
          await removeFavorite(fav.id);
          loadFavorites().then(setFavorites);
        },
      },
    ]);
  };

  const handleRead = (fav: Favorite) => {
    router.push({
      pathname: '/lecture/[livre]/[chapitre]',
      params: {
        livre: String(fav.book),
        chapitre: String(fav.chapter),
        start: String(fav.verse),
        end: String(fav.endVerse ?? fav.verse),
      },
    });
  };

  const toggleCategoryForFavorite = async (catId: string) => {
    if (!catModal) return;

    const currentCats = getFavoriteCats(catModal);

    const nextCats = currentCats.includes(catId)
      ? currentCats.filter(id => id !== catId)
      : [...currentCats, catId];

    await setFavoriteCategories(catModal.id, nextCats);
    const updated = await loadFavorites();
    setFavorites(updated);

    const updatedFav = updated.find(f => f.id === catModal.id);
    setCatModal(updatedFav ?? null);
  };

  const removeAllCategories = async () => {
    if (!catModal) return;

    await setFavoriteCategories(catModal.id, []);
    const updated = await loadFavorites();
    setFavorites(updated);
    setCatModal(null);
  };

  const renderItem = ({ item }: { item: Favorite }) => {
    const cats = getFavoriteCats(item);
    const firstCat = cats[0];
    const color = firstCat ? getCatColor(firstCat) : P.parchmentDk;

    const date = new Date(item.addedAt).toLocaleDateString(
      lang === 'en' ? 'en-GB' : 'fr-FR',
      { day: 'numeric', month: 'short' }
    );

    return (
      <View style={styles.card}>
        <View style={[styles.catStripe, { backgroundColor: color }]} />

        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.ref}>{getRef(item)}</Text>

            <View style={styles.cardActions}>
              <TouchableOpacity
                onPress={() => setCatModal(item)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.catBtn}
              >
                <Ionicons
                  name="pricetags-outline"
                  size={14}
                  color={cats.length > 0 ? getCatColor(cats[0]) : P.inkFaint}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleRemove(item)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="heart" size={18} color={P.rubriq} />
              </TouchableOpacity>
            </View>
          </View>

          {cats.length > 0 && (
            <View style={styles.catPillsRow}>
              {cats.map(catId => (
                <View
                  key={catId}
                  style={[
                    styles.catPill,
                    { backgroundColor: getCatColor(catId) + '18' },
                  ]}
                >
                  <Text style={[styles.catPillText, { color: getCatColor(catId) }]}>
                    {getCatLabel(catId, lang)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <Text style={styles.verseText}>{getVerseText(item)}</Text>

          <View style={styles.cardFooter}>
            <Text style={styles.dateText}>{date}</Text>

            <TouchableOpacity onPress={() => handleRead(item)}>
              <Text style={styles.readBtnText}>{t.lire} →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: t.titre,
          headerStyle: { backgroundColor: P.parchmentDk },
          headerTintColor: P.ink,
          headerTitleStyle: { fontWeight: '600' },
        }}
      />

      <View style={styles.tabBar}>
        {(['tous', 'recents', 'categories'] as Tab[]).map(tabKey => (
          <TouchableOpacity
            key={tabKey}
            style={[styles.tabBtn, tab === tabKey && styles.tabBtnActive]}
            onPress={() => {
              setTab(tabKey);
              setCatDropdownOpen(false);
              if (tabKey !== 'categories') setSelectedCats([]);
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabBtnText, tab === tabKey && styles.tabBtnTextActive]}>
              {t[tabKey]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {displayData.length === 0 && tab !== 'categories' ? (
        <View style={styles.empty}>
          <Ionicons name="heart-outline" size={48} color={P.inkFaint} />
          <Text style={styles.emptyText}>{t.vide}</Text>
          <Text style={styles.emptyHint}>{t.videHint}</Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {tab === 'categories' && (
            <View style={styles.pickerWrapper}>
              <TouchableOpacity
                style={[
                  styles.pickerBtn,
                  selectedCats.length > 0 && styles.pickerBtnActive,
                ]}
                onPress={() => setCatDropdownOpen(o => !o)}
                activeOpacity={0.75}
              >
                <Ionicons name="filter-outline" size={15} color={P.inkLight} />

                <Text style={styles.pickerLabel} numberOfLines={1}>
                  {selectedCats.length > 0
                    ? selectedCats.map(catId => getCatLabel(catId, lang)).join(' + ')
                    : t.toutesLes}
                </Text>

                <View style={styles.pickerBadge}>
                  <Text style={styles.pickerBadgeText}>
                    {versetLabel(byCat.length)}
                  </Text>
                </View>

                <Ionicons
                  name={catDropdownOpen ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color={P.inkFaint}
                />
              </TouchableOpacity>

              <Text style={styles.filterHint}>{t.filtreEt}</Text>

              {catDropdownOpen && (
                <View style={styles.dropdown}>
                  <ScrollView
                    style={{ maxHeight: 300 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                  >
                    <TouchableOpacity
                      style={[
                        styles.dropItem,
                        selectedCats.length === 0 && styles.dropItemActive,
                      ]}
                      onPress={() => {
                        setSelectedCats([]);
                        setCatDropdownOpen(false);
                      }}
                    >
                      <View style={[styles.dropDot, { backgroundColor: P.inkFaint }]} />
                      <Text style={styles.dropName}>{t.toutesLes}</Text>
                      <Text style={styles.dropCount}>{versetLabel(sorted.length)}</Text>
                      {selectedCats.length === 0 && (
                        <Ionicons name="checkmark" size={14} color={P.inkLight} />
                      )}
                    </TouchableOpacity>

                    {CATEGORIES.map(cat => {
                      const count = countForCategory(cat.id);
                      const isActive = selectedCats.includes(cat.id);
                      const isEmpty = count === 0;

                      return (
                        <TouchableOpacity
                          key={cat.id}
                          style={[
                            styles.dropItem,
                            isActive && { backgroundColor: cat.color + '14' },
                            isEmpty && { opacity: 0.4 },
                          ]}
                          onPress={() => {
                            if (isEmpty) return;
                            toggleSelectedCat(cat.id);
                          }}
                          activeOpacity={isEmpty ? 1 : 0.7}
                        >
                          <View style={[styles.dropDot, { backgroundColor: cat.color }]} />

                          <Text style={styles.dropName}>{cat[lang]}</Text>

                          <Text style={styles.dropCount}>
                            {count > 0 ? versetLabel(count) : t.aucun}
                          </Text>

                          <Ionicons
                            name={isActive ? 'checkbox' : 'square-outline'}
                            size={16}
                            color={isActive ? cat.color : P.inkFaint}
                          />
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
            </View>
          )}

          {displayData.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="heart-outline" size={48} color={P.inkFaint} />
              <Text style={styles.emptyText}>{t.vide}</Text>
              <Text style={styles.emptyHint}>{t.videHint}</Text>
            </View>
          ) : (
            <FlatList
              data={displayData}
              keyExtractor={f => f.id}
              renderItem={renderItem}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              onScrollBeginDrag={() => setCatDropdownOpen(false)}
            />
          )}
        </View>
      )}

      <Modal visible={!!catModal} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setCatModal(null)}>
          <Pressable style={styles.modalBox}>
            <Text style={styles.modalTitle}>{t.ajouterCat}</Text>

            <View style={styles.catGrid}>
              {CATEGORIES.map(cat => {
                const activeCats = catModal ? getFavoriteCats(catModal) : [];
                const isActive = activeCats.includes(cat.id);

                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.catGridItem,
                      isActive && {
                        backgroundColor: cat.color,
                        borderColor: cat.color,
                      },
                    ]}
                    onPress={() => toggleCategoryForFavorite(cat.id)}
                    activeOpacity={0.75}
                  >
                    <View
                      style={[
                        styles.catDot,
                        { backgroundColor: isActive ? '#fff' : cat.color },
                      ]}
                    />

                    <Text
                      style={[
                        styles.catGridLabel,
                        isActive && { color: '#fff', fontWeight: '700' },
                      ]}
                    >
                      {cat[lang]}
                    </Text>

                    {isActive && (
                      <Ionicons name="checkmark" size={13} color="#fff" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {catModal && getFavoriteCats(catModal).length > 0 && (
              <TouchableOpacity style={styles.removeCatBtn} onPress={removeAllCategories}>
                <Ionicons name="close-circle-outline" size={14} color={P.inkFaint} />
                <Text style={styles.removeCatText}>{t.retirecat}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.applyBtn} onPress={() => setCatModal(null)}>
              <Text style={styles.applyBtnText}>{t.valider}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: P.parchment },
  list: { padding: 16, paddingBottom: 40 },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: P.parchmentDk,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#8B654040',
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: P.parchment,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#8B654050',
  },
  tabBtnActive: { backgroundColor: P.rubriq, borderColor: P.rubriq },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: P.inkLight,
    letterSpacing: 0.3,
  },
  tabBtnTextActive: { color: '#fff' },

  card: {
    flexDirection: 'row',
    backgroundColor: P.parchmentLt,
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#8B654040',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  catStripe: { width: 4 },
  cardContent: { flex: 1, padding: 14 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ref: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: P.rubriq,
  },

  catBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  catPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  catPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  catPillText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  verseText: {
    fontSize: 15,
    lineHeight: 24,
    color: P.ink,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 10,
    color: P.inkFaint,
    letterSpacing: 0.5,
  },
  readBtnText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: P.sepia,
  },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: P.inkLight,
    fontWeight: '500',
  },
  emptyHint: {
    fontSize: 13,
    color: P.inkFaint,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 40,
  },

  pickerWrapper: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: P.parchment,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#8B654040',
    zIndex: 10,
  },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#8B654060',
    backgroundColor: P.parchmentDk,
  },
  pickerBtnActive: {
    borderWidth: 1,
    borderColor: P.rubriq,
  },
  pickerLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: P.ink,
  },
  pickerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    backgroundColor: '#8B654022',
  },
  pickerBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: P.inkLight,
  },
  filterHint: {
    marginTop: 6,
    fontSize: 10,
    color: P.inkFaint,
    fontStyle: 'italic',
    textAlign: 'center',
  },

  dropdown: {
    position: 'absolute',
    top: '100%' as any,
    left: 12,
    right: 12,
    backgroundColor: P.parchmentLt,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#8B654060',
    zIndex: 100,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    overflow: 'hidden',
  },
  dropItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#8B654030',
  },
  dropItemActive: { backgroundColor: P.parchmentDk },
  dropDot: { width: 8, height: 8, borderRadius: 4 },
  dropName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: P.ink,
  },
  dropCount: {
    fontSize: 11,
    color: P.inkFaint,
  },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: '88%',
    backgroundColor: P.parchmentLt,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: P.ink,
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catGridItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#8B654050',
    backgroundColor: P.parchment,
  },
  catDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  catGridLabel: {
    fontSize: 13,
    color: P.inkLight,
    fontWeight: '500',
  },
  removeCatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#8B654040',
  },
  removeCatText: {
    fontSize: 12,
    color: P.inkFaint,
  },
  applyBtn: {
    marginTop: 10,
    backgroundColor: P.rubriq,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  applyBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
});