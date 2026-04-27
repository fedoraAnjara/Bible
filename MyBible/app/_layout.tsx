import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { BibleProvider, useBible } from '../context/BibleContext';

const T = {
  fr: {
    appTitle: 'La Parole de Dieu',
    modal: 'Modal',
  },
  en: {
    appTitle: 'The Word of God',
    modal: 'Modal',
  },
  mg: {
    appTitle: 'Ny Tenin’Andriamanitra',
    modal: 'Varavarankely',
  },
};

function RootStack() {
  const { lang } = useBible();
  const t = T[lang];

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#EDE0C0' },
        headerTintColor: '#5C3D0E',
        headerTitleStyle: { fontWeight: '600' },
        headerShadowVisible: true,
      }}
    >
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: true,
          headerTitle: t.appTitle,
        }}
      />

      <Stack.Screen
        name="plans/[id]"
        options={{
          headerShown: true,
        }}
      />

      <Stack.Screen
        name="modal"
        options={{
          presentation: 'modal',
          title: t.modal,
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <BibleProvider>
      <ThemeProvider value={DefaultTheme}>
        <RootStack />
        <StatusBar style="dark" />
      </ThemeProvider>
    </BibleProvider>
  );
}