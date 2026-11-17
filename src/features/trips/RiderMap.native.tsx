import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Constants from 'expo-constants';
import MapView, { Marker } from 'react-native-maps';
import { colors } from '../../theme/tokens';
import { MapFallback } from './MapFallback';
import type { RiderMapProps } from './mapTypes';

export function RiderMap(props: RiderMapProps) {
  if (Platform.OS === 'android' && Constants.expoConfig?.extra?.riderAndroidMapConfigured !== true) {
    return <MapFallback {...props} />;
  }
  if (!props.point && !props.destination) return <MapFallback {...props} />;
  return <StreetMap {...props} />;
}

function StreetMap({ point, destination }: RiderMapProps) {
  const map = useRef<MapView>(null);
  const [ready, setReady] = useState(false);
  const center = point ?? destination;
  const latitude = destination?.latitude ?? point?.latitude;
  const longitude = destination?.longitude ?? point?.longitude;
  const latest = useRef(point);
  latest.current = point;
  const hasPoint = point !== null;

  useEffect(() => {
    if (!ready || latitude == null || longitude == null) return;
    focusStops(latest.current, { latitude, longitude });
  }, [ready, latitude, longitude, hasPoint]);

  function focusStops(current: RiderMapProps['point'], target: { latitude: number; longitude: number }) {
    if (current && (Math.abs(current.latitude - target.latitude) > 0.0005 || Math.abs(current.longitude - target.longitude) > 0.0005)) {
      map.current?.fitToCoordinates([current, target], {
        edgePadding: { top: 45, bottom: 45, left: 45, right: 45 }, animated: true,
      });
    } else {
      map.current?.animateToRegion({ ...target, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 400);
    }
  }

  if (!center) return null;
  return <View style={styles.frame}>
    <MapView ref={map} style={StyleSheet.absoluteFill} onMapReady={() => setReady(true)}
      accessibilityLabel="Delivery street map" toolbarEnabled={false}
      initialRegion={{ latitude: center.latitude, longitude: center.longitude, latitudeDelta: 0.015, longitudeDelta: 0.015 }}>
      {point && <Marker coordinate={point} title="Your location" pinColor={colors.green} />}
      {destination && <Marker coordinate={destination} title={destination.label} pinColor={colors.orange} />}
    </MapView>
    {ready && <Pressable accessibilityRole="button" accessibilityLabel="Fit delivery map" style={styles.fit}
      onPress={() => focusStops(point, destination ?? center)}>
      <Ionicons name="locate-outline" size={22} color={colors.forest} />
    </Pressable>}
  </View>;
}

const styles = StyleSheet.create({
  fit: { position: 'absolute', bottom: 19, right: 10, width: 44, height: 44, borderRadius: 11,
    justifyContent: 'center', alignItems: 'center', backgroundColor: colors.white },
  frame: { height: 250, borderRadius: 13, overflow: 'hidden', backgroundColor: colors.mint },
});
