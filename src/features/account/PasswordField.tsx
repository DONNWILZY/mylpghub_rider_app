import { useState } from 'react';
import { ActionIcon } from '../../components/ActionIcon';
import { Field } from '../../components/ui/Field';

export function PasswordField({ label, value, onChange, busy, newPassword = false }: {
  label: string; value: string; onChange: (value: string) => void; busy: boolean; newPassword?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return <Field label={label} value={value} onChangeText={onChange} secureTextEntry={!visible}
    placeholder={label === 'Confirm password' ? 'Re-enter your password' : 'Enter your password'}
    autoCapitalize="none" autoCorrect={false} autoComplete={newPassword ? 'new-password' : 'current-password'} editable={!busy}
    accessory={<ActionIcon label={(visible ? 'Hide ' : 'Show ') + label.toLowerCase()}
      icon={visible ? 'eye-off-outline' : 'eye-outline'} onPress={() => setVisible(show => !show)} />} />;
}
