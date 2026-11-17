import type { ReactNode } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Brand } from '../../components/Brand';
import { LoadingState } from '../../components/feedback/LoadingState';
import { Notice } from '../../components/feedback/Notice';
import { Screen } from '../../components/layout/Screen';
import { Button } from '../../components/ui/Button';
import { useSession } from '../../session';
import { AuthCard } from './AuthCard';
import { Profile } from './Profile';
import { SignInForm } from './SignInForm';

export function AccountScreen() {
  const { intent } = useLocalSearchParams<{ intent?: string }>();
  const { session, status } = useSession();
  const initial = intent === 'sign-up' ? 'sign-up' : 'sign-in';

  return <Screen contentStyle={styles.account}>
    <View style={styles.brand}><Brand /></View>
    <SessionStatus />
    {session && <Profile />}
    {status === 'guest' && <SignInForm key={initial} initial={initial} />}
  </Screen>;
}

export function RequireAccount({ children, title, message }: { children: ReactNode; title: string; message: string }) {
  const { session, status } = useSession();
  const router = useRouter();

  if (session) return <>{children}</>;
  return <Screen contentStyle={styles.account}>
    <View style={styles.brand}><Brand /></View>
    <SessionStatus />
    {status === 'guest' && <AuthCard title={title} description={message} icon="bicycle-outline">
      <Button title="Go to sign in" onPress={() => router.navigate({ pathname: '/account', params: { intent: 'sign-in' } })} />
      <Button title="Create an account" quiet onPress={() => router.navigate({ pathname: '/account', params: { intent: 'sign-up' } })} />
    </AuthCard>}
  </Screen>;
}

function SessionStatus() {
  const { status, problem, retry } = useSession();
  if (status === 'checking') return <LoadingState label="Checking your session" />;
  if (status === 'restore-error') return <Notice title="Couldn’t restore your session" message={problem} retry={retry} />;
  return null;
}

const styles = StyleSheet.create({
  account: { maxWidth: 520, paddingTop: 24, gap: 24 },
  brand: { alignItems: 'center', paddingVertical: 6 },
});
