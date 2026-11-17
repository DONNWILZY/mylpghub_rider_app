import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/tokens';

export function Badge({ title, positive = false }: { title: string; positive?: boolean }) {
  return <View style={[styles.badge, { backgroundColor: positive ? colors.mint : colors.peach }]}>
    <Text style={[styles.badgeText, { color: positive ? colors.forest : colors.orange }]}>{title}</Text>
  </View>;
}

const styles = StyleSheet.create({
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { fontSize: 12, lineHeight: 17, fontWeight: '700' },
});
