import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useBible } from '../../context/BibleContext';

const P = {
  parchmentDk: '#EDE0C0',
  ink: '#2C1F0E',
  inkFaint: '#A08060',
  sepia: '#8B6540',
};

const T = {
  fr: {
    accueil: 'Accueil',
    plans: 'Plans',
    livres: 'Livres',
    favoris: 'Favoris',
  },
  en: {
    accueil: 'Home',
    plans: 'Plans',
    livres: 'Books',
    favoris: 'Favorites',
  },
  mg: {
    accueil: 'Fandraisana',
    plans: 'Lahatra vakiteny',
    livres: 'Baiboly',
    favoris: 'Ankafizina',
  }
};

export default function TabsLayout() {
  const { lang } = useBible();
  const t = T[lang];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: P.parchmentDk,
          borderTopColor: '#8B654040',
          borderTopWidth: 0.5,
        },
        tabBarActiveTintColor: P.ink,
        tabBarInactiveTintColor: P.inkFaint,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.3,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.accueil,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="plans"
        options={{
          title: t.plans,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="livres"
        options={{
          title: t.livres,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="favoris"
        options={{
          title: t.favoris,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}