import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ApiError } from '../../api';
import { getErrorMessage, useSession } from '../../session';
import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/Field';
import { s } from '../../theme/tokens';
import { type AppIcon } from '../../components/ActionIcon';
import { AuthCard } from './AuthCard';
import { TermsConsent } from './TermsConsent';
import { PasswordField } from './PasswordField';
import { PasswordResetForm } from './PasswordResetForm';


const authCopy = {
  password: ['Welcome back', 'Sign in to manage your rider profile and delivery trips.', 'log-in-outline'],
  register: ['Create your MyQuickGas account', 'Use the same account to set up your rider profile.', 'person-add-outline'],
  email: ['Verify your email', 'Confirm your email address to finish setting up your account.', 'mail-outline'],
  code: ['Verify your sign-in', 'Complete two-factor authentication to continue.', 'lock-closed-outline'],
  recovery: ['Use a recovery code', 'Enter one of your saved codes to access your account.', 'key-outline'],
} satisfies Record<Step, [string, string, AppIcon]>;

type Step = 'password' | 'register' | 'email' | 'code' | 'recovery';

export function SignInForm({ initial }: { initial: 'sign-in' | 'sign-up' }) {
  const { api, signIn } = useSession();
  const [resetting, setResetting] = useState(false);
  const [step, setStep] = useState<Step>(initial === 'sign-up' ? 'register' : 'password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function move(next: Step) {
    setStep(next);
    setPassword('');
    setConfirmation('');
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
      if (step === 'register') {
        await api.register({
          name: name.trim(), username: username.trim(), phone: phone.trim(),
          email: email.trim(), password, password_confirmation: confirmation,
        });
        move('email');
        setMessage('Account created. Check your inbox for your verification code.');
        return;
      }
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
    password: 'Sign in', register: 'Create account', email: 'Verify email', code: 'Verify sign-in', recovery: 'Verify sign-in',
  };
  const credentials = step === 'password' || step === 'register';
  const requiredFieldMissing = credentials ? !email.trim() || !password : !code.trim();
  const incompleteRegistration = step === 'register' &&
    (!name.trim() || !username.trim() || !phone.trim() || password.length < 8 || password !== confirmation);
  const disabled = busy || requiredFieldMissing || incompleteRegistration || (step === 'register' && !accepted);

  if (resetting) return <PasswordResetForm initialEmail={email} onBack={() => setResetting(false)} onComplete={address => {
    move('password');
    setEmail(address);
    setResetting(false);
    setMessage('Password changed. Sign in with your new password.');
  }} />;

  const [title, description, icon] = authCopy[step];
  return <AuthCard title={title} description={description} icon={icon}>
    {credentials ? <>
      {step === 'register' && <>
        <Field label="Full name" value={name} onChangeText={setName} autoComplete="name" editable={!busy} />
        <Field label="Username" value={username} onChangeText={setUsername} autoCapitalize="none"
          autoCorrect={false} editable={!busy} />
        <Field label="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad"
          autoComplete="tel" maxLength={20} editable={!busy} />
      </>}
      <Field label="Email address" value={email} onChangeText={setEmail} autoCapitalize="none"
        autoCorrect={false} keyboardType="email-address" autoComplete="email" placeholder="you@example.com" editable={!busy} />
      <PasswordField label="Password" value={password} onChange={setPassword} busy={busy} newPassword={step === 'register'} />
      {step === 'password' && <Pressable accessibilityRole="button" style={{ alignSelf: 'flex-end', justifyContent: 'center', minHeight: 44 }}
        disabled={busy} onPress={() => setResetting(true)}>
        <Text style={s.label}>Forgot password?</Text>
      </Pressable>}
      {step === 'register' && <>
        <PasswordField label="Confirm password" value={confirmation} onChange={setConfirmation} busy={busy} newPassword />
        <Text style={s.small}>{confirmation && confirmation !== password ? 'Passwords must match.' : 'Use at least 8 characters.'}</Text>
        <TermsConsent accepted={accepted} onChange={() => setAccepted(value => !value)}
          disabled={busy} onLinkError={() => setError('Could not open this page. Please try again.')} />
      </>}
    </> : <>
      <Text style={s.body}>{step === 'recovery' ? 'Enter a recovery code for ' : 'Enter the six-digit code sent to '}{email}.</Text>
      <Field label={step === 'recovery' ? 'Recovery code' : 'Verification code'} value={code} onChangeText={setCode}
        keyboardType={step === 'recovery' ? 'default' : 'number-pad'} autoCapitalize="none" autoCorrect={false}
        maxLength={step === 'recovery' ? undefined : 6} autoComplete={step === 'recovery' ? 'off' : 'one-time-code'}
        editable={!busy} />
    </>}
    {!!message && <Text accessibilityLiveRegion="polite" style={s.body}>{message}</Text>}
    {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
    <Button title={busy ? 'Please wait…' : labels[step]} onPress={() => void submit()} disabled={disabled} busy={busy} />
    {step === 'password' && <Button quiet title="Create an account"
      onPress={() => move('register')} disabled={busy} />}
    {step !== 'password' && <View style={s.row}>
      <Button quiet title="Back to sign in" onPress={() => move('password')} disabled={busy} />
      {step === 'email' && <Button quiet title="Resend code" onPress={() => void resend()} disabled={busy} />}
      {step === 'code' && <Button quiet title="Use a recovery code" onPress={() => move('recovery')} disabled={busy} />}
      {step === 'recovery' && <Button quiet title="Use the email code" onPress={() => move('code')} disabled={busy} />}
    </View>}
  </AuthCard>;
}
