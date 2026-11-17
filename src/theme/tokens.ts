import { StyleSheet } from 'react-native';

export const colors = {
  canvas: '#F0FDF4',
  white: '#FFFFFF',
  ink: '#142D20',
  muted: '#536A5B',
  green: '#166534',
  forest: '#064E3B',
  mint: '#DCF5E8',
  line: '#DCE9DF',
  orange: '#9A3412',
  peach: '#FFF0E4',
  error: '#9F2637',
};
export const s = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  grow: { flex: 1, minWidth: 0 },
  stack: { gap: 8 },
  label: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  body: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  small: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  title: { color: colors.ink, fontSize: 24, lineHeight: 31, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { color: colors.ink, fontSize: 18, lineHeight: 24, fontWeight: '800' },
  error: { color: colors.error, fontSize: 14, lineHeight: 20 },
  thumb: { width: 52, height: 52, borderRadius: 10, backgroundColor: colors.mint },
});
