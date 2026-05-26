import {
  EastSeaDokdo_400Regular,
} from '@expo-google-fonts/east-sea-dokdo';
import {
  Sumana_400Regular,
  Sumana_700Bold,
} from '@expo-google-fonts/sumana';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    EastSeaDokdo_400Regular,
    Sumana_400Regular,
    Sumana_700Bold,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);
  
  useEffect(() => {
    if (loaded) {
      console.log('폰트 로딩 완료!');
      SplashScreen.hideAsync();
    }
    if (error) {
      console.log('폰트 에러:', error);
    }
  }, [loaded, error]);

  if (!loaded) {
    return null;
  }

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding/one" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding/two" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding/three" options={{ headerShown: false }} />
    </Stack>
  );
}