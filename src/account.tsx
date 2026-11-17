import { useState } from 'react';
import { Stack, Tabs, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiError } from './api';
import { SessionProvider, useSession, getErrorMessage } from './session';
import { Button, Card, Field, Header, Hero, Loading, Notice, Screen, colors, s } from './ui';

const appName = 'MyQuickGas Rider';
const app = { homes: 'Rider account', icon: 'person-circle-outline', task: 'Trips', taskIcon: 'navigate-outline' } as const;

export function Root({ apiUrl }: { apiUrl: string | undefined }) {
  return <SessionProvider apiUrl={apiUrl}>
    <StatusBar style="dark" />
    <Stack screenOptions={{
      headerTintColor: colors.forest,
      headerBackTitle: 'Back',
      headerStyle: { backgroundColor: colors.canvas },
      contentStyle: { backgroundColor: colors.canvas },
    }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  </SessionProvider>;
}

export function RoleTabs() {
  const { bottom } = useSafeAreaInsets();
  return <Tabs screenOptions={{
    headerShown: false,
    tabBarActiveTintColor: colors.green,
    tabBarInactiveTintColor: colors.muted,
    tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.line, height: 60 + bottom },
    tabBarLabelPosition: 'below-icon',
    tabBarLabelStyle: { fontWeight: '700', fontSize: 12 },
  }}>
    <Tabs.Screen name="index" options={{
      title: app.homes,
      tabBarAccessibilityLabel: app.homes,
      tabBarIcon: ({ focused, size }) => <Ionicons name={app.icon} color={focused ? colors.green : colors.muted} size={size} />,
    }} />
    <Tabs.Screen name="trips" options={{
      title: app.task,
      tabBarAccessibilityLabel: app.task,
      tabBarIcon: ({ focused, size }) => <Ionicons name={app.taskIcon} color={focused ? colors.green : colors.muted} size={size} />,
    }} />
    <Tabs.Screen name="account" options={{
      title: 'Account',
      tabBarAccessibilityLabel: 'Account',
      tabBarIcon: ({ focused, size }) => <Ionicons name="settings-outline" color={focused ? colors.green : colors.muted} size={size} />,
    }} />
  </Tabs>;
}

export function AccountScreen() {
  return <Account showProfile />;
}

export function Account({ children, purpose, showProfile = false }: {
  children?: React.ReactNode; purpose?: string; showProfile?: boolean;
}) {
  const { session, status, problem, retry } = useSession();
  const router = useRouter();

  if (session && children) return <>{children}</>;
  return <Screen>
    <Header title={appName} />
    {status === 'checking' && <Loading label="Checking your session" />}
    {status === 'restore-error' && <Notice title="Couldn’t restore your session" message={problem} retry={retry} />}
    {session && <Profile />}
    {status === 'guest' && <>
      <Hero title={showProfile ? 'Your account' : purpose ?? 'Sign in'} icon="person-circle-outline"
        text={showProfile ? 'Sign in with your MyQuickGas email and password.' : 'Sign in to securely access your MyQuickGas account.'} />
      {showProfile ? <SignIn /> : <Button title="Go to sign in" onPress={() => router.navigate('/account')} />}
    </>}
  </Screen>;
}

type Step = 'password' | 'email' | 'code' | 'recovery';

function SignIn() {
  const { api, signIn } = useSession();
  const [step, setStep] = useState<Step>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function move(next: Step) {
    setStep(next);
    setPassword('');
    setCode('');
    setError('');
    setMessage('');
  }

  async function submit() {
    if (busy) return;
    setBusy(true);
    setError('');
    setMessage('');

    try {
      if (step === 'email') {
        await api.verifyEmail(email.trim(), code.trim());
        move('password');
        setMessage('Email verified. Sign in to continue.');
        return;
      }

      const result = step === 'password'
        ? await api.login(email.trim(), password)
        : await api.verifySignIn(email.trim(), code.trim(), step === 'recovery');
      if (result.kind === 'challenge') {
        setEmail(result.email);
        move('code');
        return;
      }
      await signIn(result);
    } catch (problem) {
      if (problem instanceof ApiError && problem.code === 'EMAIL_NOT_VERIFIED') move('email');
      setError(getErrorMessage(problem));
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await api.resendVerification(email.trim());
      setMessage('If your account is awaiting verification, check your inbox for a code.');
    } catch (problem) {
      setError(getErrorMessage(problem));
    } finally {
      setBusy(false);
    }
  }

  const labels: Record<Step, string> = {
    password: 'Sign in', email: 'Verify email', code: 'Verify sign-in', recovery: 'Verify sign-in',
  };
  const credentials = step === 'password';
  const requiredFieldMissing = credentials ? !email.trim() || !password : !code.trim();
  const disabled = busy || requiredFieldMissing;

  return <Card>
    {credentials ? <>
      <Field label="Email address" value={email} onChangeText={setEmail} autoCapitalize="none"
        autoCorrect={false} keyboardType="email-address" autoComplete="email" editable={!busy} />
      <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry
        autoComplete="current-password" editable={!busy} />
    </> : <>
      <Text style={s.body}>{step === 'recovery' ? 'Enter a recovery code for ' : 'Enter the six-digit code sent to '}{email}.</Text>
      <Field label={step === 'recovery' ? 'Recovery code' : 'Verification code'} value={code} onChangeText={setCode}
        keyboardType={step === 'recovery' ? 'default' : 'number-pad'} autoCapitalize="none" autoCorrect={false}
        maxLength={step === 'recovery' ? undefined : 6} autoComplete={step === 'recovery' ? 'off' : 'one-time-code'}
        editable={!busy} />
    </>}
    {!!message && <Text accessibilityLiveRegion="polite" style={s.body}>{message}</Text>}
    {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
    <Button title={busy ? 'Please wait…' : labels[step]} onPress={() => void submit()} disabled={disabled} />
    {step !== 'password' && <View style={s.row}>
      <Button quiet title="Back to sign in" onPress={() => move('password')} disabled={busy} />
      {step === 'email' && <Button quiet title="Resend code" onPress={() => void resend()} disabled={busy} />}
      {step === 'code' && <Button quiet title="Use a recovery code" onPress={() => move('recovery')} disabled={busy} />}
      {step === 'recovery' && <Button quiet title="Use the email code" onPress={() => move('code')} disabled={busy} />}
    </View>}
  </Card>;
}

function Profile() {
  const { session, signOut } = useSession();
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState('');

  async function submit() {
    setBusy(true);
    setProblem('');
    try {
      await signOut();
    } catch (error) {
      setProblem(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return <Card>
    <Text accessibilityRole="header" style={s.title}>{session?.user.name}</Text>
    <Text style={s.body}>{session?.user.email}</Text>
    {!!session?.user.phone && <Text style={s.body}>{session.user.phone}</Text>}
    {!!problem && <Text accessibilityRole="alert" style={s.error}>{problem}</Text>}
    <View style={s.row}>
      <Button title={busy ? 'Signing out…' : 'Sign out'} onPress={() => void submit()} disabled={busy} />
    </View>
  </Card>;
}
