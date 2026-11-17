import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { Brand } from '../../components/Brand';
import { Notice } from '../../components/feedback/Notice';
import { ResourceView } from '../../components/feedback/ResourceView';
import { Screen } from '../../components/layout/Screen';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useRefreshOnReturn } from '../../hooks/useRefreshOnReturn';
import { useResource } from '../../hooks/useResource';
import { area, readable } from '../../lib/format';
import { useSession } from '../../session';
import { s } from '../../theme/tokens';
import { RequireAccount } from '../account/AccountScreen';
import { ProfileSkeleton } from '../profile/RiderProfile';
import type { AssignedTrip } from './contracts';

export function TripList() {
  return <RequireAccount title="Delivery trips" message="Sign in to view trips assigned to your rider account.">
    <AssignedTrips />
  </RequireAccount>;
}

function AssignedTrips() {
  const { api, session } = useSession();
  const router = useRouter();
  const token = session!.token;
  const resource = useResource('delivery-trips', async signal => {
    const account = await api.riderAccount(token, signal);
    return account.overview.trip_quotes_enabled ? await api.assignedTrips(token, signal) : null;
  }, token);
  useRefreshOnReturn(resource.reload);

  return <Screen>
    <Brand />
    <View style={s.between}>
      <Text accessibilityRole="header" style={s.title}>Delivery trips</Text>
      <Button title="Refresh trips" quiet onPress={resource.reload} icon="refresh-outline" />
    </View>
    <ResourceView resource={resource} label="Loading assigned trips" placeholder={<ProfileSkeleton />}>
      {trips => {
        if (!trips) return <Notice title="Assigned trips are unavailable"
          message="Assignments appear here when this rider account has access to delivery trips." />;
        if (!trips.length) return <Notice title="No assigned deliveries" message="New assignments will appear here." />;
        return trips.map(trip => <Card key={trip.trip_id}>
          <View style={s.between}>
            <Text accessibilityRole="header" style={s.subtitle}>Delivery #{trip.trip_id}</Text>
            <TripBadge trip={trip} />
          </View>
          {trip.pickup_outlet && <Outlet trip={trip} />}
          <Button title={'Open delivery #' + trip.trip_id} quiet
            onPress={() => router.push({ pathname: '/trip/[id]', params: { id: String(trip.trip_id) } })} />
        </Card>);
      }}
    </ResourceView>
  </Screen>;
}

export function Outlet({ trip }: { trip: AssignedTrip }) {
  const outlet = trip.pickup_outlet;
  if (!outlet) return null;
  const address = area(outlet.address, outlet.city, outlet.state);
  return <View style={s.stack}>
    <Text style={s.label}>{outlet.name}</Text>
    {!!address && <Text style={s.small}>{address}</Text>}
  </View>;
}

export function TripBadge({ trip }: { trip: AssignedTrip }) {
  const label = trip.delivery_code_verified && trip.status === 'in_transit'
    ? 'Drop-off verified' : readable(trip.status);
  return <Badge title={label} positive={trip.status === 'in_transit' || trip.status === 'completed'} />;
}
