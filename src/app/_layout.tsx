import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { barve } from '@/theme';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: barve.ozadje },
          headerTintColor: barve.besedilo,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: barve.ozadje },
        }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="navodila" options={{ title: 'Kako se igra' }} />
        <Stack.Screen name="igra" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
