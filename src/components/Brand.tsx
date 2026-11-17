import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/tokens';

const mark = require('../../assets/brand-mark.png');

export function BrandMark({ size = 34 }: { size?: number }) {
  return <Image source={mark} style={{ width: size, height: size }} resizeMode="contain" />;
}

export function Brand({ tagline = false }: { tagline?: boolean }) {
  return <View style={styles.identity} accessibilityLabel="MyQuickGas Rider">
    <BrandMark />
    <View>
      <Text style={styles.name}>MyQuickGas Rider</Text>
      {tagline && <Text style={styles.tagline}>Rider account</Text>}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  identity: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { color: colors.forest, fontSize: 19, fontWeight: '800', letterSpacing: -0.5 },
  tagline: { color: colors.muted, fontSize: 11, lineHeight: 16 },
});
