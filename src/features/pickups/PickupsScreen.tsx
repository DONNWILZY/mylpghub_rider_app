import { useState } from 'react';
import { Text } from 'react-native';
import * as Location from 'expo-location';
import { Brand } from '../../components/Brand';
import { ResourceView } from '../../components/feedback/ResourceView';
import { Screen } from '../../components/layout/Screen';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useAction } from '../../hooks/useAction';
import { useRefreshOnReturn } from '../../hooks/useRefreshOnReturn';
import { useResource } from '../../hooks/useResource';
import { useSession } from '../../session';
import { s } from '../../theme/tokens';
import { RequireAccount } from '../account/AccountScreen';
import type { PickupAction } from './contracts';

export function PickupsScreen() {
  const { session } = useSession();
  return <RequireAccount title="Pickup requests" message="Sign in to collect parcels from nearby customers and businesses.">
    {session && <PickupInbox key={session.token} token={session.token} />}
  </RequireAccount>;
}

function PickupInbox({ token }: { token: string }) {
  const { api } = useSession();
  const queue = useResource('pickups', signal => api.pickupQueue(token, signal), token);
  const action = useAction();
  const [notice, setNotice] = useState('');
  useRefreshOnReturn(queue.reload);

  function change(work: () => Promise<void>, message: string) {
    setNotice('');
    void action.run(async () => {
      try { await work(); } finally { queue.reload(); }
    }, () => setNotice(message));
  }

  async function shareLocation() {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) throw new Error('Allow location access to find nearby pickups.');
    const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    await api.riderAvailability(token, true);
    await api.sharePickupLocation(token, coords.latitude, coords.longitude);
  }

  function advance(id: string, next: PickupAction, message: string) {
    change(() => api.pickupAction(token, id, next), message);
  }

  return <Screen>
    <Brand />
    <Text accessibilityRole="header" style={s.title}>Pickup requests</Text>
    <Button quiet title="Refresh pickups" onPress={queue.reload} disabled={action.busy} icon="refresh-outline" />
    {!!(action.error || notice) && <Text accessibilityLiveRegion="polite" style={s.body}>{action.error || notice}</Text>}
    <ResourceView resource={queue} label="Loading pickups">
      {({ assigned, nearby }) => <>
        <Card>
          <Text style={s.body}>Share your current location to see pickups nearby for five minutes.</Text>
          <Button title="Go online and share location" disabled={action.busy}
            onPress={() => change(shareLocation, 'Location shared for nearby pickups.')} />
          <Button title="Go offline" quiet disabled={action.busy}
            onPress={() => change(() => api.riderAvailability(token, false), 'You are offline.')} />
        </Card>
        <Text accessibilityRole="header" style={s.subtitle}>My assignments</Text>
        {!assigned.length && <Text style={s.body}>No active pickups.</Text>}
        {assigned.map(job => <Card key={job.id}>
          <Text style={s.label}>{job.parcel}</Text>
          <Text style={s.body}>Pickup · {job.pickup_address}</Text>
          <Text style={s.body}>Drop-off · {job.dropoff_address}</Text>
          <Text selectable style={s.body}>Contact · {job.contact_phone}</Text>
          {job.status === 'accepted' && <Button title="Mark collected" disabled={action.busy}
            onPress={() => advance(job.id, 'collect', 'Parcel marked as collected.')} />}
          {job.status === 'collected' && <Button title="Mark delivered" disabled={action.busy}
            onPress={() => advance(job.id, 'deliver', 'Pickup completed.')} />}
        </Card>)}
        <Text accessibilityRole="header" style={s.subtitle}>Nearby requests</Text>
        {!nearby.length && <Text style={s.body}>No pickups nearby. Refresh after sharing your location.</Text>}
        {nearby.map(job => <Card key={job.id}>
          <Text style={s.label}>{job.parcel}</Text>
          <Button title="Accept pickup" disabled={action.busy} onPress={() => advance(job.id, 'accept', 'Pickup accepted.')} />
        </Card>)}
      </>}
    </ResourceView>
  </Screen>;
}
