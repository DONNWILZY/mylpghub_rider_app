export type Point = { latitude: number; longitude: number };
export type Position = Point & { accuracy: number | null; timestamp: number };
export type Destination = Point & { label: string };

export type AssignedTrip = {
  trip_id: number;
  status: string;
  pickup_outlet?: { name: string; address?: string | null; city?: string | null; state?: string | null } | null;
  pickup_blocker?: string | null;
  pickup_code_issued: boolean;
  pickup_code_replaceable: boolean;
  vendor_verified: boolean;
  pickup_acknowledged: boolean;
  delivery_code_issued: boolean;
  delivery_code_verified: boolean;
  customer_acknowledged: boolean;
  pickup_actions_enabled: boolean;
  delivery_actions_enabled: boolean;
};

export type TrackingStatus = {
  trip_id: number;
  status: string;
  active: boolean;
  arrived: boolean;
  destination: Destination | null;
  location: (Point & { recorded_at: string; expires_at: string; accuracy_meters: number | null }) | null;
  remaining_distance_meters: number | null;
  interval_seconds: number;
  expires_in_seconds: number;
};

export type PickupCode = { trip_id: number; code: string; expires_at: string };
