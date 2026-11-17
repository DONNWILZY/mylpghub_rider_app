import { useState } from 'react';
import { Text, View } from 'react-native';
import { LoadingState } from '../../components/feedback/LoadingState';
import { Notice } from '../../components/feedback/Notice';
import { Screen } from '../../components/layout/Screen';
import { Card } from '../../components/ui/Card';
import { useSession } from '../../session';
import { s } from '../../theme/tokens';
import { RequireAccount } from '../account/AccountScreen';
import { ProfileSkeleton } from '../profile/RiderProfile';
import { HandoverPanel } from './HandoverPanel';
import { TripMapCard } from './TripMapCard';
import { Outlet, TripBadge } from './TripList';
import { useDeliveryTrip } from './useDeliveryTrip';

export function DeliveryTripScreen({ id }: { id: number }) {
  return <RequireAccount title="Delivery trip" message="Sign in to view the assigned delivery.">
    {id > 0 ? <Delivery key={id} id={id} /> : <Screen>
      <Notice title="Delivery unavailable" message="Open a delivery from your assigned trips." />
    </Screen>}
  </RequireAccount>;
}

function Delivery({ id }: { id: number }) {
  const { session } = useSession();
  const token = session!.token;
  const { trip, tripError, waiting, tracking, trackingError, refresh } = useDeliveryTrip(token, id);
  const [verified, setVerified] = useState(false);

  return <Screen edges={['left', 'right', 'bottom']}>
    {waiting ? <LoadingState label="Loading delivery"><ProfileSkeleton /></LoadingState>
      : !trip ? <Notice title="Delivery unavailable" message={tripError} retry={refresh} />
      : <>
        <Card>
          <View style={s.between}>
            <Text accessibilityRole="header" style={s.title}>Delivery #{id}</Text>
            <TripBadge trip={trip} />
          </View>
          <Outlet trip={trip} />
        </Card>
        {!!tripError && <Notice title="Delivery updates interrupted" message={tripError} retry={refresh} />}
        {['assigned', 'in_transit'].includes(trip.status) && !verified && !trip.delivery_code_verified && !tracking?.arrived &&
          <TripMapCard token={token} id={id} tracking={tracking} trackingError={trackingError} />}
        <HandoverPanel token={token} trip={trip} refresh={refresh}
          arrived={verified || trip.delivery_code_verified || !!tracking?.arrived}
          onVerified={() => { setVerified(true); refresh(); }} />
      </>}
  </Screen>;
}
