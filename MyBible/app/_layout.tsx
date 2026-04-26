// app/_layout.tsx
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { BibleProvider, useBible } from '../context/BibleContext';

function RootStack() {
  const { lang } = useBible();
  const title = lang === 'fr' ? 'La Parole de Dieu' : 'The Word of God';

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
          headerTitle: title,
        }}
      />
      <Stack.Screen name="plans/[id]" options={{ headerShown: true }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
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