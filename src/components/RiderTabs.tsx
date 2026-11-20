import { Redirect, Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboarding, useOnboardingDestination } from '../features/onboarding/LaunchGate';
import { colors } from '../theme/tokens';
import type { AppIcon } from './ActionIcon';

const routes: ReadonlyArray<{ route: string; title: string; icon: AppIcon }> = [
  { route: 'index', title: 'Rider account', icon: 'person-circle-outline' },
  { route: 'pickups', title: 'Pickups', icon: 'cube-outline' },
  { route: 'trips', title: 'Trips', icon: 'navigate-outline' },
  { route: 'account', title: 'Account', icon: 'person-circle-outline' },
];

export function RiderTabs() {
  const { bottom } = useSafeAreaInsets();
  const { hasSeen } = useOnboarding();
  useOnboardingDestination();
  if (!hasSeen) return <Redirect href="/onboarding" />;
  return <Tabs screenOptions={{
    headerShown: false,
    tabBarActiveTintColor: colors.green,
    tabBarInactiveTintColor: colors.muted,
    tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.line, height: 60 + bottom },
    tabBarLabelPosition: 'below-icon',
    tabBarLabelStyle: { fontWeight: '700', fontSize: 12 },
  }}>
    {routes.map(({ route, title, icon }) => <Tabs.Screen key={route} name={route} options={{
      title,
      tabBarAccessibilityLabel: title,
      tabBarIcon: ({ focused, size }) => <Ionicons name={icon} color={focused ? colors.green : colors.muted} size={size} />,
    }} />)}
  </Tabs>;
}
