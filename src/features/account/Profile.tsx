import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { getErrorMessage, useSession } from '../../session';
import { s } from '../../theme/tokens';

export function Profile() {
  const { session, signOut } = useSession();
  const router = useRouter();
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
      <Button title="My Rider Account" quiet onPress={() => router.navigate('/')} />
      <Button title={busy ? 'Signing out…' : 'Sign out'} onPress={() => void submit()} busy={busy} />
    </View>
  </Card>;
}
