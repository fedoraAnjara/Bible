import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useBible } from '../context/BibleContext';

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
    titre:       'Paramètres',
    retour:      '← Retour',
    langue:      'Langue',
    taille:      'Taille du texte',
    petit:       'A',
    grand:       'A',
  },
  en: {
    titre:       'Settings',
    retour:      '← Back',
    langue:      'Language',
    taille:      'Text size',
    petit:       'A',
    grand:       'A',
  },
    mg: {
    titre:       'Fikirana',
    retour:      '← Hiverina',
    langue:      'Dikanteny',
    taille:      'Hangezan-tsoratra',
    petit:       'A',
    grand:       'A',
  },
};
const previewText = {
  fr: 'Car Dieu a tant aimé le monde…',
  en: 'For God so loved the world…',
  mg: 'Fa toy izao no nitiavan’Andriamanitra izao tontolo izao…',
};

export default function ParametresScreen() {
  const { lang, setLang, fontSize, setFontSize } = useBible();
  const t = T[lang];
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: t.titre,
          headerStyle: { backgroundColor: 'wheat' },
          headerTintColor: '#5C3D0E',
          headerTitleStyle: { fontWeight: '600' },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ paddingHorizontal: 8 }}>
              <Text style={{ fontSize: 16, color: '#5C3D0E', fontWeight: '600' }}>{t.retour}</Text>
            </TouchableOpacity>
          ),
        }}
      />

      {/* Langue */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{t.langue}</Text>
        <View style={styles.langRow}>
          <TouchableOpacity
            style={[styles.langBtn, lang === 'fr' && styles.langBtnActive]}
            onPress={() => setLang('fr')}
          >
            <Text style={[styles.langBtnText, lang === 'fr' && styles.langBtnTextActive]}>🇫🇷 Français</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.langBtn, lang === 'en' && styles.langBtnActive]}
            onPress={() => setLang('en')}
          >
            <Text style={[styles.langBtnText, lang === 'en' && styles.langBtnTextActive]}>🇬🇧 English</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.langBtn, lang === 'mg' && styles.langBtnActive]}
            onPress={() => setLang('mg')}
          >
            <Text style={[styles.langBtnText, lang === 'mg' && styles.langBtnTextActive]}>🇲🇬 Malagasy</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Taille du texte */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{t.taille}</Text>
        <View style={styles.sizeRow}>
          <Text style={[styles.sizeLabel, { fontSize: 13 }]}>{t.petit}</Text>
          <View style={styles.sizeButtons}>
            {[14, 16, 18, 20, 22].map(size => (
              <TouchableOpacity
                key={size}
                style={[styles.sizeBtn, fontSize === size && styles.sizeBtnActive]}
                onPress={() => setFontSize(size)}
              >
                <Text style={[styles.sizeBtnText, fontSize === size && styles.sizeBtnTextActive, { fontSize: size - 4 }]}>
                  A
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.sizeLabel, { fontSize: 20 }]}>{t.grand}</Text>
        </View>
        <Text style={[styles.preview, { fontSize }]}>
          {previewText[lang]}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#F5EDD8' },

  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 3,
    textTransform: 'uppercase', color: '#8B6540', marginBottom: 16,
  },

  langRow:    { flexDirection: 'row', gap: 12 },
  langBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 8,
    borderWidth: 1, borderColor: '#8B654060',
    alignItems: 'center', backgroundColor: '#FAF4E6',
  },
  langBtnActive:     { backgroundColor: '#2C1F0E', borderColor: '#2C1F0E' },
  langBtnText:       { fontSize: 15, color: '#5C4020', fontWeight: '500' },
  langBtnTextActive: { color: '#FAF4E6', fontWeight: '700' },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#8B654040',
    marginHorizontal: 20,
  },

  sizeRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  sizeLabel:  { color: '#8B6540', fontWeight: '700' },
  sizeButtons:{ flex: 1, flexDirection: 'row', justifyContent: 'space-between' },
  sizeBtn: {
    width: 40, height: 40, borderRadius: 8,
    borderWidth: 1, borderColor: '#8B654060',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FAF4E6',
  },
  sizeBtnActive:     { backgroundColor: '#2C1F0E', borderColor: '#2C1F0E' },
  sizeBtnText:       { color: '#5C4020', fontWeight: '600' },
  sizeBtnTextActive: { color: '#FAF4E6' },

  preview: {
    color: '#2C1F0E', fontStyle: 'italic', lineHeight: 28,
    padding: 14, backgroundColor: '#FAF4E6',
    borderRadius: 8, borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#8B654050',
  },
});