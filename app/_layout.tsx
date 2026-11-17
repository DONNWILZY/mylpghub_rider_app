import { StatusBar } from 'expo-status-bar';
import { LaunchGate } from '../src/features/onboarding/LaunchGate';
import { SessionProvider } from '../src/session';

export default function Layout() {
  return <SessionProvider apiUrl={process.env.EXPO_PUBLIC_API_URL}>
    <StatusBar style="dark" />
    <LaunchGate />
  </SessionProvider>;
}
