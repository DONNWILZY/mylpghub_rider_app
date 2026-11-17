import type { ComponentProps, ReactNode } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
  type TextInputProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Resource } from './resource';

export const colors = {
  canvas: '#F4F8F5',
  white: '#FFFFFF',
  ink: '#12372B',
  muted: '#4D665D',
  green: '#047857',
  forest: '#064E3B',
  mint: '#DCF5E8',
  line: '#DCE8E1',
  orange: '#9A3412',
  peach: '#FFF0E4',
  error: '#9F2637',
};
export const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  scroll: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 4, justifyContent: 'space-between' },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  grow: { flex: 1, minWidth: 0 },
  stack: { gap: 8 },
  brand: { width: 34, height: 34, borderRadius: 9, backgroundColor: colors.white },
  label: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  body: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  small: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  title: { color: colors.ink, fontSize: 24, lineHeight: 31, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { color: colors.ink, fontSize: 18, lineHeight: 24, fontWeight: '800' },
  hero: { backgroundColor: colors.forest, borderRadius: 22, padding: 22, gap: 10, overflow: 'hidden' },
  heroTitle: { color: colors.white, fontSize: 34, lineHeight: 39, fontWeight: '800', letterSpacing: -1.05 },
  heroBody: { color: '#E0F5E9', fontSize: 16, lineHeight: 23, maxWidth: 430 },
  heroIcon: { color: '#A5E7C6', marginBottom: 4 },
  card: { backgroundColor: colors.white, borderColor: colors.line, borderWidth: 1, borderRadius: 17, padding: 16, gap: 9 },
  input: { color: colors.ink, minHeight: 51, flexGrow: 1, fontSize: 16, paddingHorizontal: 13, borderRadius: 12, backgroundColor: colors.white, borderColor: '#A9BFB2', borderWidth: 1 },
  button: { minHeight: 46, borderRadius: 11, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: colors.green, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 7 },
  quiet: { backgroundColor: colors.mint },
  buttonText: { color: colors.white, fontWeight: '800', fontSize: 14, textAlign: 'center' },
  quietText: { color: colors.forest },
  pressed: { opacity: 0.74 },
  disabled: { opacity: 0.5 },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { fontSize: 12, lineHeight: 17, fontWeight: '700' },
  error: { color: colors.error, fontSize: 14, lineHeight: 20 },
  thumb: { width: 52, height: 52, borderRadius: 10, backgroundColor: colors.mint },
  cover: { width: '100%', height: 150, borderRadius: 15, backgroundColor: colors.mint },
});
const icon = require('../assets/icon.png');

export type IconName = ComponentProps<typeof Ionicons>['name'];

export function Screen({ children }: { children: ReactNode }) {
  return <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
    <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  </SafeAreaView>;
}

export function Header({ title, action }: { title: string; action?: ReactNode }) {
  return <View style={s.header}>
    <View style={s.row}>
      <Image source={icon} style={s.brand} />
      <Text accessibilityRole="header" style={s.label}>{title}</Text>
    </View>
    {action}
  </View>;
}

export function Hero({ title, text, icon }: { title: string; text: string; icon: IconName }) {
  return <View style={s.hero}>
    <Ionicons name={icon} size={30} style={s.heroIcon} />
    <Text accessibilityRole="header" style={s.heroTitle}>{title}</Text>
    <Text style={s.heroBody}>{text}</Text>
  </View>;
}

export function Card({ children }: { children: ReactNode }) {
  return <View style={s.card}>{children}</View>;
}

export function Button({ title, onPress, quiet = false, disabled = false, icon }: {
  title: string; onPress: () => void; quiet?: boolean; disabled?: boolean; icon?: IconName;
}) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [s.button, quiet && s.quiet, disabled && s.disabled, pressed && s.pressed]}>
    {icon && <Ionicons name={icon} color={quiet ? colors.forest : colors.white} size={17} />}
    <Text style={[s.buttonText, quiet && s.quietText]}>{title}</Text>
  </Pressable>;
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return <View style={s.stack}>
    <Text style={s.label}>{label}</Text>
    <TextInput accessibilityLabel={label} placeholderTextColor="#61746C" {...props} style={s.input} />
  </View>;
}

export function Badge({ title, positive = false }: { title: string; positive?: boolean }) {
  return <View style={[s.badge, { backgroundColor: positive ? colors.mint : colors.peach }]}>
    <Text style={[s.badgeText, { color: positive ? colors.forest : colors.orange }]}>{title}</Text>
  </View>;
}

export function Loading({ label = 'Loading' }: { label?: string }) {
  return <View accessibilityLiveRegion="polite" style={s.row}>
    <ActivityIndicator color={colors.green} />
    <Text style={s.body}>{label}…</Text>
  </View>;
}

export function Notice({ title, message, retry }: { title: string; message: string; retry?: () => void }) {
  return <Card>
    <Text accessibilityRole="header" style={s.subtitle}>{title}</Text>
    <Text style={s.body}>{message}</Text>
    {retry && <View style={s.row}><Button quiet title="Try again" onPress={retry} /></View>}
  </Card>;
}

export function Result<T>({ resource, children }: { resource: Resource<T>; children: (data: T) => ReactNode }) {
  if (!resource.value) return <Loading />;
  if (resource.value.status === 'error') return <Notice title="Couldn’t load this page" message={resource.value.message} retry={resource.reload} />;
  return <>{children(resource.value.data)}</>;
}

export function Pagination({ page, lastPage, change }: { page: number; lastPage: number; change: (page: number) => void }) {
  if (lastPage <= 1 && page <= 1) return null;
  return <View style={s.between}>
    <Button title="Previous" quiet disabled={page <= 1} onPress={() => change(page - 1)} />
    <Text style={s.small}>{page} / {lastPage}</Text>
    <Button title="Next" quiet disabled={page >= lastPage} onPress={() => change(page + 1)} />
  </View>;
}

export function readable(value: string) {
  return value.replace(/[_-]+/g, ' ').replace(/^./, letter => letter.toUpperCase());
}

export function naira(value: number | string) {
  return '₦' + new Intl.NumberFormat('en-NG', { maximumFractionDigits: 2 }).format(Number(value));
}

export function area(...parts: Array<string | null | undefined>) {
  return parts.filter(Boolean).join(', ');
}

export function validId(value?: string) {
  if (!value || !/^\d+$/.test(value)) return 0;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : 0;
}
