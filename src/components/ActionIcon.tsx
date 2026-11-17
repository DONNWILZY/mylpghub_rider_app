import type { ComponentProps } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet } from 'react-native';
import { colors } from '../theme/tokens';

export type AppIcon = ComponentProps<typeof Ionicons>['name'];

export function ActionIcon({ icon, label, onPress }: { icon: AppIcon; label: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress}
    style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
    <Ionicons name={icon} size={22} color={colors.forest} />
  </Pressable>;
}

const styles = StyleSheet.create({
  button: { width: 44, height: 44, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  pressed: { backgroundColor: colors.mint },
});
