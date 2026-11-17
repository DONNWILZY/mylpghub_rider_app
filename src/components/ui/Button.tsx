import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../../theme/tokens';
import type { AppIcon } from '../ActionIcon';

export function Button({ title, onPress, quiet = false, disabled = false, busy = false, icon }: {
  title: string; onPress: () => void; quiet?: boolean; disabled?: boolean; busy?: boolean; icon?: AppIcon;
}) {
  const inactive = disabled || busy;
  return <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ disabled: inactive, busy }} disabled={inactive} onPress={onPress}
    style={({ pressed }) => [styles.button, quiet && styles.quiet, inactive && styles.disabled, pressed && styles.pressed]}>
    {busy ? <ActivityIndicator size="small" color={quiet ? colors.forest : colors.white} />
      : icon && <Ionicons name={icon} color={quiet ? colors.forest : colors.white} size={17} />}
    <Text style={[styles.buttonText, quiet && styles.quietText]}>{title}</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  button: { minHeight: 46, borderRadius: 11, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: colors.green,
    justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 7 },
  quiet: { backgroundColor: colors.mint },
  buttonText: { color: colors.white, fontWeight: '800', fontSize: 14, textAlign: 'center' },
  quietText: { color: colors.forest },
  pressed: { opacity: 0.74 },
  disabled: { opacity: 0.5 },
});
