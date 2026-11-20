export type NearbyPickup = { id: string; parcel: string };
export type AssignedPickup = NearbyPickup & {
  pickup_address: string;
  dropoff_address: string;
  contact_phone: string;
  status: 'accepted' | 'collected';
};

export type PickupQueue = { nearby: NearbyPickup[]; assigned: AssignedPickup[] };
export type PickupAction = 'accept' | 'collect' | 'deliver';
