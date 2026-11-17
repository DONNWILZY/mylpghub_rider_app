import type { ReactNode } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import { colors, s } from '../../theme/tokens';
import { type AppIcon } from '../../components/ActionIcon';

export function AuthCard({ title, description, icon, children }: {
  title: string; description: string; icon: AppIcon; children: ReactNode;
}) {
  return <View style={styles.card}>
    <View style={styles.header}>
      <View style={styles.symbol}><Ionicons name={icon} size={23} color={colors.green} /></View>
      <Text accessibilityRole="header" style={styles.title}>{title}</Text>
      <Text style={s.body}>{description}</Text>
    </View>
    {children}
  </View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: 24, borderColor: colors.line, borderWidth: 1, gap: 15, padding: 21 },
  header: { gap: 9, paddingBottom: 5 },
  symbol: { width: 45, height: 45, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E4F3E8' },
  title: { color: colors.ink, fontSize: 30, lineHeight: 36, fontWeight: '800', letterSpacing: -0.9 },
});
