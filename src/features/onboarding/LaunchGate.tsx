import { createContext, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import { Stack, useRouter } from 'expo-router';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { BrandMark } from '../../components/Brand';
import { colors } from '../../theme/tokens';

type Destination = 'overview' | 'sign-in' | 'sign-up';
const storageKey = 'myquickgas.rider.introduction.v1';
const LaunchContext = createContext<{
  hasSeen: boolean;
  finish: (destination: Destination) => Promise<void>;
  takeDestination: () => Destination;
} | null>(null);

if (Platform.OS !== 'web') {
  SplashScreen.setOptions({ fade: true, duration: 240 });
  void SplashScreen.preventAutoHideAsync().catch(() => undefined);
}

export function LaunchGate() {
  const [seen, setSeen] = useState<boolean | null>(null);
  const destination = useRef<Destination>('overview');

  useEffect(() => {
    let active = true;
    async function load() {
      const value = await AsyncStorage.getItem(storageKey).catch(() => null);
      if (active) setSeen(value === 'seen');
    }
    void load();
    return () => { active = false; };
  }, []);

  async function finish(next: Destination) {
    // A device storage failure should still allow the rider to enter the app.
    await AsyncStorage.setItem(storageKey, 'seen').catch(() => undefined);
    destination.current = next;
    setSeen(true);
  }

  function takeDestination() {
    const next = destination.current;
    destination.current = 'overview';
    return next;
  }

  if (seen === null) return <View style={styles.launch} testID="launch-screen">
    <BrandMark size={112} />
    <Text accessibilityRole="header" style={styles.wordmark}>MyQuickGas Rider</Text>
  </View>;

  return <LaunchContext.Provider value={{ hasSeen: seen, finish, takeDestination }}>
    <View style={styles.root} onLayout={() => {
      if (Platform.OS !== 'web') SplashScreen.hide();
    }}>
      <Stack screenOptions={{
        headerTintColor: colors.forest,
        headerBackTitle: 'Back',
        headerStyle: { backgroundColor: colors.white },
        contentStyle: { backgroundColor: colors.canvas },
      }}>
        <Stack.Protected guard={!seen}>
          <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'none' }} />
        </Stack.Protected>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Protected guard={seen}>
          <Stack.Screen name="trip/[id]" options={{ title: 'Delivery trip' }} />
          <Stack.Screen name="rider-application" options={{ title: 'Rider application' }} />
        </Stack.Protected>
      </Stack>
    </View>
  </LaunchContext.Provider>;
}

export function useOnboarding() {
  const launch = useContext(LaunchContext);
  if (!launch) throw new Error('LaunchGate is required.');
  return launch;
}

export function useOnboardingDestination() {
  const { takeDestination } = useOnboarding();
  const router = useRouter();
  useEffect(() => {
    const destination = takeDestination();
    if (destination !== 'overview') router.replace({ pathname: '/account', params: { intent: destination } });
  }, [router, takeDestination]);
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  launch: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, backgroundColor: '#F0FDF4' },
  wordmark: { color: colors.forest, letterSpacing: -1, fontSize: 31, fontWeight: '800' },
});
