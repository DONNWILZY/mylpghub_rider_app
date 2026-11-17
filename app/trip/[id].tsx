import { useLocalSearchParams } from 'expo-router';
import { DeliveryTripScreen } from '../../src/features/trips/DeliveryTripScreen';
import { validId } from '../../src/lib/format';

export default function TripRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <DeliveryTripScreen id={validId(typeof id === 'string' ? id : undefined)} />;
}
