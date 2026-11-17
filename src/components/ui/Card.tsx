import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme/tokens';

export function Card({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderColor: colors.line, borderWidth: 1, borderRadius: 17, padding: 16, gap: 9 },
});
