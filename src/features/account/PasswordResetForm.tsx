import { useState } from 'react';
import { Text } from 'react-native';
import { getErrorMessage, useSession } from '../../session';
import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/Field';
import { s } from '../../theme/tokens';
import { AuthCard } from './AuthCard';
import { PasswordField } from './PasswordField';

export function PasswordResetForm({ initialEmail, onBack, onComplete }: {
  initialEmail: string; onBack: () => void; onComplete: (email: string) => void;
}) {
  const { api } = useSession();
  const [email, setEmail] = useState(initialEmail);
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [reset, setReset] = useState<{ email: string; token: string } | null>(null);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      if (reset) {
        await api.resetPassword(reset.email, reset.token, password, confirmation);
        onComplete(reset.email);
      } else if (codeSent) {
        setReset(await api.verifyPasswordCode(email.trim(), code.trim()));
        setCode('');
      } else {
        await api.requestPasswordCode(email.trim());
        setCodeSent(true);
      }
    } catch (problem) {
      setError(getErrorMessage(problem));
    } finally {
      setBusy(false);
    }
  }

  const title = reset ? 'Choose a new password' : codeSent ? 'Enter your reset code' : 'Reset your password';
  const description = reset ? 'Use at least 8 characters.' : codeSent
    ? 'If your account is registered, check your email for a six-digit code.'
    : 'Enter your MyQuickGas email address to request a reset code.';
  const action = reset ? 'Change password' : codeSent ? 'Verify reset code' : 'Send reset code';
  const disabled = busy || (reset ? password.length < 8 || password !== confirmation : codeSent ? !/^\d{6}$/.test(code) : !email.trim());

  return <AuthCard title={title} description={description} icon="key-outline">
    {reset ? <>
      <PasswordField label="New password" value={password} onChange={setPassword} busy={busy} newPassword />
      <PasswordField label="Confirm password" value={confirmation} onChange={setConfirmation} busy={busy} newPassword />
      {!!confirmation && confirmation !== password && <Text style={s.small}>Passwords must match.</Text>}
    </> : codeSent ? <Field label="Reset code" value={code} onChangeText={setCode} keyboardType="number-pad"
      autoComplete="one-time-code" maxLength={6} editable={!busy} /> :
      <Field label="Email address" value={email} onChangeText={setEmail} autoCapitalize="none"
        autoCorrect={false} keyboardType="email-address" autoComplete="email" editable={!busy} />}
    {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
    <Button title={busy ? 'Please wait…' : action} onPress={() => void submit()} disabled={disabled} busy={busy} />
    {codeSent && !reset && <Button title="Use a different email or send again" quiet disabled={busy}
      onPress={() => { setCodeSent(false); setCode(''); setError(''); }} />}
    <Button title="Back to sign in" quiet onPress={onBack} disabled={busy} />
  </AuthCard>;
}
