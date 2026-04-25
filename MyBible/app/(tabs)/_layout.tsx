import { Stack } from 'expo-router';
import { BibleProvider } from '../../context/BibleContext';

export default function RootLayout() {
  return (
    <BibleProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="lecture/[livre]/[chapitre]" options={{ title: 'Lecture' }} />
      </Stack>
    </BibleProvider>
  );
}