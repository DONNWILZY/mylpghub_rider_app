import { useRef, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { type AppIcon } from '../../components/ActionIcon';
import { Brand } from '../../components/Brand';
import { Button } from '../../components/ui/Button';
import { Screen } from '../../components/layout/Screen';
import { colors, s } from '../../theme/tokens';
import { useOnboarding } from './LaunchGate';

const pages: ReadonlyArray<{ title: string; accent: string; description: string; icon: AppIcon }> = [
  { title: 'Set up your', accent: 'rider account.',
    description: 'Add rider and vehicle details, then submit your documents when applications are open.', icon: 'person-circle-outline' },
  { title: 'Find your', accent: 'delivery stops.',
    description: 'Open an assigned trip to see the pickup and drop-off stages and check your distance to the next stop.', icon: 'map-outline' },
  { title: 'Share location', accent: 'during a trip.',
    description: 'Choose when to share your position with the customer while heading to the drop-off.', icon: 'locate-outline' },
];

export function OnboardingScreen() {
  const { finish } = useOnboarding();
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const leaving = useRef(false);
  const last = index === pages.length - 1;

  async function complete(destination: Parameters<typeof finish>[0]) {
    if (leaving.current) return;
    leaving.current = true;
    setBusy(true);
    await finish(destination);
  }

  return <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={styles.safe}>
    <Screen edges={[]} contentStyle={styles.content}>
      <View style={styles.top}>
        <Brand />
        <TextAction title="Skip" disabled={busy} onPress={() => void complete('overview')} />
      </View>
      <IntroPage page={pages[index]} index={index} />
      <View style={styles.footer}>
        <Button title={last ? 'Open My Rider Account' : 'Continue'} icon="arrow-forward-outline" busy={busy}
          onPress={() => last ? void complete('overview') : setIndex(step => Math.min(step + 1, pages.length - 1))} />
        {last ? <>
          <Button title="Create an account" quiet disabled={busy} onPress={() => void complete('sign-up')} />
          <TextAction title="Sign in" disabled={busy} onPress={() => void complete('sign-in')} />
        </> : index > 0 && <TextAction title="Back" onPress={() => setIndex(step => step - 1)} />}
      </View>
    </Screen>
  </SafeAreaView>;
}

function IntroPage({ page, index }: { page: (typeof pages)[number]; index: number }) {
  return <View style={styles.page}>
    <View style={styles.visual} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.ring}>
        <View style={styles.icon}>
          <Ionicons name={page.icon} size={52} color={colors.green} />
        </View>
      </View>
    </View>
    <View style={styles.copy} accessibilityLiveRegion="polite">
      <Text accessibilityRole="header" style={styles.title}>{page.title}{' '}<Text style={styles.accent}>{page.accent}</Text></Text>
      <Text style={styles.description}>{page.description}</Text>
    </View>
    <View style={styles.progress} accessibilityLabel={'Step ' + (index + 1) + ' of ' + pages.length}>
      {pages.map((item, position) => <View key={item.icon} style={[styles.dot, position === index && styles.currentDot]} />)}
    </View>
  </View>;
}

function TextAction({ title, disabled, onPress }: { title: string; disabled?: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} disabled={disabled} style={styles.textAction}>
    <Text style={s.label}>{title}</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  content: { flexGrow: 1, maxWidth: 540, gap: 22, paddingTop: 17, paddingBottom: 12 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  page: { flexGrow: 1, justifyContent: 'center', gap: 24 },
  visual: { backgroundColor: '#EAF6ED', minHeight: 232, justifyContent: 'center', alignItems: 'center',
    borderRadius: 28, borderColor: '#DCEBDF', borderWidth: 1 },
  ring: { width: 166, height: 166, alignItems: 'center', justifyContent: 'center', borderRadius: 83,
    backgroundColor: '#D9EFDF', borderWidth: 1, borderColor: '#CEE6D4' },
  icon: { width: 112, height: 112, alignItems: 'center', justifyContent: 'center', borderRadius: 32, backgroundColor: colors.white },
  copy: { gap: 12 },
  title: { color: colors.ink, fontSize: 35, lineHeight: 40, fontWeight: '800', letterSpacing: -1.2 },
  accent: { color: colors.green },
  description: { color: colors.muted, fontSize: 16, lineHeight: 24 },
  progress: { flexDirection: 'row', gap: 7 },
  dot: { width: 8, height: 8, borderRadius: 5, backgroundColor: '#C6DDD0' },
  currentDot: { width: 22, backgroundColor: colors.green },
  footer: { gap: 10 },
  textAction: { minHeight: 44, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 12 },
});
