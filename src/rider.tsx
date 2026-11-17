import { Text, View } from 'react-native';
import { Account } from './account';
import { useResource } from './resource';
import { useSession } from './session';
import { Badge, Button, Card, Header, Hero, Notice, Result, Screen, naira, readable, s } from './ui';

const documents: Record<string, string> = {
  identity_proof: 'Identity proof', vehicle_proof: 'Vehicle proof', selfie_video: 'Selfie video',
};

export function RiderOverview() {
  return <Account purpose="My Rider Account"><RiderHome /></Account>;
}

function RiderHome() {
  const { session, api } = useSession();
  const token = session!.token;
  const resource = useResource('rider-account', signal => api.riderAccount(token, signal), token);

  return <Screen>
    <Header title="MyQuickGas Rider" action={<Button title="Refresh" onPress={resource.reload} quiet icon="refresh-outline" />} />
    <Hero title="My Rider Account" text="Check your profile, verification checklist, and review status." icon="person-circle-outline" />
    <Result resource={resource}>{data => <>
      <Card>
        <Text style={s.subtitle}>{data.overview.account_name}</Text>
        <View style={s.row}>
          <Badge title={data.rider ? readable(data.rider.status) : 'Profile pending'} positive={data.rider?.status === 'approved'} />
          <Badge title={readable(data.overview.identity_status)} positive={data.overview.identity_status === 'manual_verified'} />
        </View>
        {!!data.rider?.rider_type && <Text style={s.body}>{readable(data.rider.rider_type)} rider</Text>}
        {!!data.rider?.price_per_km && Number(data.rider.price_per_km) > 0 &&
          <Text style={s.body}>Requested rate {naira(data.rider.price_per_km)} / km</Text>}
      </Card>
      {!data.onboarding_enabled && <Notice title="Rider onboarding is closed"
        message="You can still check your profile and verification status." />}
      <Card>
        <Text accessibilityRole="header" style={s.subtitle}>Verification checklist</Text>
        <Check label="Account verification" complete={data.onboarding.account_ready} />
        <Check label="Rider and vehicle details" complete={data.onboarding.vehicle_ready} />
        {data.onboarding.required_documents.map(document => <Check key={document}
          label={documents[document] || readable(document)} complete={data.onboarding.uploaded_document_types.includes(document)} />)}
        {data.onboarding.review_required && <Text style={s.small}>MyQuickGas reviews rider applications manually.</Text>}
      </Card>
      {!!data.review_history.length && <Card>
        <Text accessibilityRole="header" style={s.subtitle}>Review history</Text>
        {data.review_history.map(event => <Text key={event.id} style={s.body}>{readable(event.to_status || event.action)}</Text>)}
      </Card>}
    </>}</Result>
  </Screen>;
}

function Check({ label, complete }: { label: string; complete: boolean }) {
  return <View style={s.between}>
    <Text style={[s.body, s.grow]}>{label}</Text>
    <Badge title={complete ? 'Complete' : 'Pending'} positive={complete} />
  </View>;
}

export function RiderTrips() {
  return <Account purpose="Your trips"><TripAvailability /></Account>;
}

function TripAvailability() {
  const { api, session } = useSession();
  const token = session!.token;
  const resource = useResource('trip-availability', signal => api.riderAccount(token, signal), token);
  return <Screen>
    <Header title="MyQuickGas Rider" action={<Button title="Refresh" onPress={resource.reload} quiet icon="refresh-outline" />} />
    <Text accessibilityRole="header" style={s.title}>Your trips</Text>
    <Result resource={resource}>{data => <Card>
      <View style={s.between}>
        <Text style={[s.body, s.grow]}>Delivery dispatch</Text>
        <Badge title={data.dispatch_enabled ? 'Enabled' : 'Unavailable'} positive={data.dispatch_enabled} />
      </View>
      <View style={s.between}>
        <Text style={[s.body, s.grow]}>Trip quotes</Text>
        <Badge title={data.overview.trip_quotes_enabled ? 'Enabled' : 'Unavailable'} positive={data.overview.trip_quotes_enabled} />
      </View>
      <View style={s.between}>
        <Text style={[s.body, s.grow]}>Rider payouts</Text>
        <Badge title={data.payouts_enabled ? 'Enabled' : 'Unavailable'} positive={data.payouts_enabled} />
      </View>
    </Card>}</Result>
  </Screen>;
}
