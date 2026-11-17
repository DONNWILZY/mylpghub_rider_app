import { useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { colors, s } from '../../theme/tokens';
import type { TrackingStatus } from './contracts';
import { distanceMeters, formatDistance } from './distance';
import { RiderMap } from './RiderMap';
import { KeepSharingAwake } from './KeepSharingAwake';
import { useRiderLocation } from './useRiderLocation';

export function TripMapCard({ token, id, tracking, trackingError }: {
  token: string; id: number; tracking: TrackingStatus | null; trackingError: string;
}) {
  const location = useRiderLocation(token, id, tracking);
  const { gps } = location;
  const destination = tracking?.destination ?? null;
  const distance = gps.point && destination ? formatDistance(distanceMeters(gps.point, destination)) : '—';
  const [directionsError, setDirectionsError] = useState(false);

  async function directions() {
    if (!destination) return;
    setDirectionsError(false);
    const coordinates = encodeURIComponent(destination.latitude + ',' + destination.longitude);
    try {
      await Linking.openURL('https://www.google.com/maps/dir/?api=1&destination=' + coordinates);
    } catch {
      setDirectionsError(true);
    }
  }

  return <Card>
    {location.sharing && <KeepSharingAwake />}
    <View style={s.between}>
      <Text accessibilityRole="header" style={s.subtitle}>Delivery map</Text>
      <Badge title={location.sharing ? 'Sharing on' : 'Sharing off'} positive={location.sharing} />
    </View>
    {destination && <Text style={s.label}>{destination.label}</Text>}
    <RiderMap point={gps.point} destination={destination} />
    <View style={s.row}>
      <View style={styles.metric}>
        <Text style={s.small}>Straight-line distance</Text>
        <Text style={s.title}>{distance}</Text>
      </View>
      <View style={styles.metric}>
        <Text style={s.small}>Distance recorded this session</Text>
        <Text style={s.title}>{gps.point ? formatDistance(gps.distance) : '—'}</Text>
      </View>
    </View>
    {!destination && <Text style={s.small}>A mapped destination is unavailable for this stop.</Text>}
    {!!trackingError && <Text style={s.small}>{trackingError}</Text>}
    {!!gps.error && <Text accessibilityRole="alert" style={s.error}>{gps.error}</Text>}
    {gps.watching && !gps.point && !gps.error && <Text style={s.small}>Waiting for a GPS fix…</Text>}
    {gps.point?.accuracy != null && <Text style={s.small}>GPS accuracy ±{Math.round(gps.point.accuracy)} m</Text>}
    <View style={s.row}>
      <Button quiet busy={gps.waiting} title={gps.watching ? 'Stop using GPS' : 'Use my GPS'}
        onPress={gps.watching ? location.stopGps : () => void location.startGps()} icon="locate-outline" />
      {destination && <Button quiet title="Directions" onPress={() => void directions()} icon="navigate-outline" />}
    </View>
    {directionsError && <Text accessibilityRole="alert" style={s.error}>Couldn’t open directions on this device.</Text>}
    {location.canShare && <Text style={s.body}>Share your current position with this customer during delivery. Keep this screen open to continue sharing.</Text>}
    {!!location.shareStatus && <Text accessibilityLiveRegion="polite" style={s.small}>{location.shareStatus}</Text>}
    {location.sharing
      ? <Button title="Stop sharing location" quiet onPress={() => location.stopSharing()} />
      : location.canShare && <Button title="Share live location" disabled={!gps.point} onPress={location.startSharing} icon="radio-outline" />}
  </Card>;
}

const styles = StyleSheet.create({
  metric: { flexGrow: 1, flexBasis: 132, borderRadius: 11, backgroundColor: colors.canvas, gap: 3, padding: 10 },
});
