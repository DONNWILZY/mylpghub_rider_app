import { StyleSheet, View, type DimensionValue } from 'react-native';

export function Skeleton({ width = '100%', height = 14 }: { width?: DimensionValue; height?: number }) {
  return <View aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
    style={[styles.block, { width, height }]} />;
}

const styles = StyleSheet.create({
  block: { backgroundColor: '#E0EDE3', borderRadius: 8 },
});
