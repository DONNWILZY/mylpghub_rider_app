import type { ReactNode } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { colors, s } from '../../theme/tokens';

export function LoadingState({ label = 'LoadingState', children }: { label?: string; children?: ReactNode }) {
  return <View style={s.stack}>
    <View accessibilityLiveRegion="polite" accessibilityState={{ busy: true }} style={s.row}>
      <ActivityIndicator color={colors.green} />
      <Text style={s.body}>{label}…</Text>
    </View>
    {children}
  </View>;
}
