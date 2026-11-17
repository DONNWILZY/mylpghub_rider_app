import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import { colors, s } from '../../theme/tokens';
import type { RiderMapProps } from './mapTypes';

export function MapFallback({ point, destination }: RiderMapProps) {
  return <View style={styles.root} accessibilityLabel="GPS coordinates">
    <View style={s.row}>
      <Ionicons name="locate-outline" size={22} color={colors.forest} />
      <Text style={s.label}>GPS coordinates</Text>
    </View>
    <Text style={s.small}>
      {point ? 'Rider · ' + point.latitude.toFixed(5) + ', ' + point.longitude.toFixed(5) : 'Waiting for rider location'}
    </Text>
    {destination && <Text style={s.small}>
      {destination.label + ' · ' + destination.latitude.toFixed(5) + ', ' + destination.longitude.toFixed(5)}
    </Text>}
    <Text style={s.small}>Use Directions to open a street map.</Text>
  </View>;
}

const styles = StyleSheet.create({
  root: { minHeight: 140, borderRadius: 13, backgroundColor: colors.mint, justifyContent: 'center', gap: 7, padding: 15 },
});
