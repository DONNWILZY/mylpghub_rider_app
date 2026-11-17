import { useState } from 'react';
import { Text } from 'react-native';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Field } from '../../components/ui/Field';
import { useAction } from '../../hooks/useAction';
import { useSession } from '../../session';
import { s } from '../../theme/tokens';
import type { AssignedTrip, PickupCode } from './contracts';

export function HandoverPanel({ trip, token, refresh, arrived, onVerified }: {
  trip: AssignedTrip; token: string; refresh: () => void; arrived: boolean; onVerified: () => void;
}) {
  if (trip.status === 'assigned') return <PickupPanel trip={trip} token={token} refresh={refresh} />;
  if (trip.status === 'in_transit' || trip.status === 'completed') {
    return <DropoffPanel trip={trip} token={token} arrived={arrived} onVerified={onVerified} />;
  }
  return null;
}

function PickupPanel({ trip, token, refresh }: { trip: AssignedTrip; token: string; refresh: () => void }) {
  const { api } = useSession();
  const action = useAction();
  const [pickup, setPickup] = useState<PickupCode | null>(null);
  const [collected, setCollected] = useState(false);
  const issued = !!pickup || trip.pickup_code_issued;

  return <Card>
    <Text accessibilityRole="header" style={s.subtitle}>Outlet pickup</Text>
    {collected ? <Text style={s.body}>Collection confirmed. Updating your delivery.</Text>
      : trip.vendor_verified ? <Text style={s.body}>The outlet verified your code. Confirm once you have collected the order.</Text>
      : <Text style={s.body}>Show the pickup code to outlet staff when you collect the order.</Text>}
    {!!trip.pickup_blocker && <Text style={s.small}>{trip.pickup_blocker}</Text>}
    {!!action.error && <Text accessibilityRole="alert" style={s.error}>{action.error}</Text>}
    {pickup && !trip.vendor_verified && !trip.pickup_code_replaceable && !collected && <Text selectable style={s.title}>{pickup.code}</Text>}
    {issued && !pickup && !trip.vendor_verified && !trip.pickup_code_replaceable &&
      <Text style={s.small}>A pickup code has already been issued. A replacement becomes available after expiry or a lockout.</Text>}
    {!collected && trip.pickup_actions_enabled && (trip.vendor_verified
      ? <Button title="Confirm collection" busy={action.busy}
        onPress={() => void action.run(() => api.acknowledgePickup(token, trip.trip_id), () => {
          setCollected(true);
          setPickup(null);
          refresh();
        })} />
      : (!issued || trip.pickup_code_replaceable) && <Button
        title={issued ? 'Replace pickup code' : 'Generate pickup code'} busy={action.busy}
        onPress={() => void action.run(() => api.issuePickup(token, trip.trip_id), code => {
          setPickup(code);
          refresh();
        })} />)}
  </Card>;
}

function DropoffPanel({ trip, token, arrived, onVerified }: {
  trip: AssignedTrip; token: string; arrived: boolean; onVerified: () => void;
}) {
  const { api } = useSession();
  const action = useAction();
  const [code, setCode] = useState('');
  const complete = trip.status === 'completed' || trip.customer_acknowledged;

  return <Card>
    <Text accessibilityRole="header" style={s.subtitle}>Customer drop-off</Text>
    {complete ? <Text style={s.body}>The customer confirmed receipt.</Text>
      : arrived ? <Text style={s.body}>Drop-off verified. Waiting for the customer to confirm receipt.</Text>
      : trip.delivery_actions_enabled && trip.delivery_code_issued ? <>
        <Text style={s.body}>Ask the customer for their eight-digit delivery code at handover.</Text>
        <Field label="Customer delivery code" value={code} inputMode="numeric" maxLength={8}
          onChangeText={value => setCode(value.replace(/\D/g, ''))} />
        <Button title="Verify drop-off" busy={action.busy} disabled={code.length !== 8}
          onPress={() => void action.run(() => api.verifyDropoff(token, trip.trip_id, code), () => {
            setCode('');
            onVerified();
          })} />
      </> : <Text style={s.body}>{trip.delivery_actions_enabled
        ? 'Waiting for the customer to generate a delivery code.' : 'Drop-off actions are currently unavailable.'}</Text>}
    {!!action.error && <Text accessibilityRole="alert" style={s.error}>{action.error}</Text>}
  </Card>;
}
