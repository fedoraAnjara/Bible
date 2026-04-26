import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { loadFavorites, removeFavorite } from '../../services/storageService';
import type { Favorite } from '../../services/storageService';
import { useBible } from '../../context/BibleContext';
import Ionicons from '@expo/vector-icons/Ionicons';

const P = {
  parchment:   '#F5EDD8',
  parchmentDk: '#EDE0C0',
  parchmentLt: '#FAF4E6',
  ink:         '#2C1F0E',
  inkLight:    '#5C4020',
  inkFaint:    '#A08060',
  sepia:       '#8B6540',
  rubriq:      '#7A2010',
};

const T = {
  fr: {
    titre:      'Mes Favoris',
    vide:       'Aucun favori pour l\'instant.',
    videHint:   'Appuyez longuement sur un verset pour l\'ajouter.',
    retirer:    'Retirer des favoris ?',
    annuler:    'Annuler',
    supprimer:  'Supprimer',
    lire:       'Lire',
  },
  en: {
    titre:      'My Favourites',
    vide:       'No favourites yet.',
    videHint:   'Long press a verse to add it.',
    retirer:    'Remove from favourites?',
    annuler:    'Cancel',
    supprimer:  'Remove',
    lire:       'Read',
  },
};

export default function FavorisScreen() {
  const { lang } = useBible();
  const t = T[lang];
  const router = useRouter();
  const [favorites, setFavorites] = useState<Favorite[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadFavorites().then(setFavorites);
    }, [])
  );

  const handleRemove = (fav: Favorite) => {
    const id = `${fav.book}-${fav.chapter}-${fav.verse}`;
    Alert.alert(t.retirer, `${fav.bookName} ${fav.chapter}:${fav.verse}`, [
      { text: t.annuler, style: 'cancel' },
      {
        text: t.supprimer, style: 'destructive',
        onPress: async () => {
          await removeFavorite(id);
          loadFavorites().then(setFavorites);
        },
      },
    ]);
  };

  // Ref affichée : Genèse 1:5-17 ou Genèse 1:5
const getRef = (fav: Favorite) =>
  fav.endVerse
    ? `${fav.bookName} ${fav.chapter}:${fav.verse}-${fav.endVerse}`
    : `${fav.bookName} ${fav.chapter}:${fav.verse}`;

// Redirection avec start/end pour highlight
const handleRead = (fav: Favorite) => {
  router.push({
    pathname: '/lecture/[livre]/[chapitre]',
    params: {
      livre:    String(fav.book),
      chapitre: String(fav.chapter),
      start:    String(fav.verse),
      end:      String(fav.endVerse ?? fav.verse),
    },
  });
};

// Dans renderItem, remplace la ligne ref :


  const renderItem = ({ item }: { item: Favorite }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.ref}>{getRef(item)}</Text>
        <TouchableOpacity onPress={() => handleRemove(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="heart" size={18} color={P.rubriq} />
        </TouchableOpacity>
      </View>
      <Text style={styles.verseText}>{item.text}</Text>
      <TouchableOpacity style={styles.readBtn} onPress={() => handleRead(item)}>
        <Text style={styles.readBtnText}>{t.lire} →</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {favorites.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="heart-outline" size={48} color={P.inkFaint} />
          <Text style={styles.emptyText}>{t.vide}</Text>
          <Text style={styles.emptyHint}>{t.videHint}</Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(f) => `${f.book}-${f.chapter}-${f.verse}`}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: P.parchment },
  list:      { padding: 16, paddingBottom: 40 },

  card: {
    backgroundColor: P.parchmentLt,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#8B654050',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  ref: {
    fontSize: 11, fontWeight: '700', letterSpacing: 2,
    textTransform: 'uppercase', color: P.rubriq,
  },
  verseText: {
    fontSize: 16, lineHeight: 26, color: P.ink,
    fontStyle: 'italic', marginBottom: 12,
  },
  readBtn: { alignSelf: 'flex-end' },
  readBtnText: {
    fontSize: 11, fontWeight: '700', letterSpacing: 0.8,
    textTransform: 'uppercase', color: P.sepia,
  },

  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  emptyText: { fontSize: 16, color: P.inkLight, fontWeight: '500' },
  emptyHint: { fontSize: 13, color: P.inkFaint, fontStyle: 'italic', textAlign: 'center', paddingHorizontal: 40 },
});