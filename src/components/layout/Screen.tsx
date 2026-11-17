import type { ReactNode, Ref } from 'react';
import { ScrollView, StyleSheet, type ScrollViewInstance, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { colors } from '../../theme/tokens';

export function Screen({ children, header, contentStyle, scrollRef, edges = ['top', 'left', 'right'] }: {
  children: ReactNode; header?: ReactNode; contentStyle?: StyleProp<ViewStyle>; scrollRef?: Ref<ScrollViewInstance>; edges?: Edge[];
}) {
  return <SafeAreaView style={styles.safe} edges={edges}>
    {header}
    <ScrollView ref={scrollRef} contentContainerStyle={[styles.scroll, contentStyle]} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  scroll: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 16, paddingTop: 18, paddingBottom: 24, gap: 18 },
});
