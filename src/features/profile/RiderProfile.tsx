import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import type { RiderAccount } from '../../api';
import { ActionIcon } from '../../components/ActionIcon';
import { Brand } from '../../components/Brand';
import { Notice } from '../../components/feedback/Notice';
import { ResourceView } from '../../components/feedback/ResourceView';
import { Skeleton } from '../../components/feedback/Skeleton';
import { Screen } from '../../components/layout/Screen';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useAction } from '../../hooks/useAction';
import { useRefreshOnReturn } from '../../hooks/useRefreshOnReturn';
import { useResource } from '../../hooks/useResource';
import { readable } from '../../lib/format';
import { useSession } from '../../session';
import { s } from '../../theme/tokens';
import { RequireAccount } from '../account/AccountScreen';

export const documentLabels: Record<string, string> = {
  identity_proof: 'Identity proof', vehicle_proof: 'Vehicle proof', selfie_video: 'Selfie video',
};
export const editableStatus = ['draft', 'needs_information'];

export function RiderProfile() {
  return <RequireAccount title="My Rider Account" message="Sign in to manage verification and your delivery trips.">
    <Overview />
  </RequireAccount>;
}

function Overview() {
  const { api, session } = useSession();
  const router = useRouter();
  const token = session!.token;
  const resource = useResource('rider-account', signal => api.riderAccount(token, signal), token);
  useRefreshOnReturn(resource.reload);
  return <Screen>
    <View style={s.between}>
      <Brand tagline />
      <ActionIcon icon="refresh-outline" label="Refresh rider account" onPress={resource.reload} />
    </View>
    <Text accessibilityRole="header" style={s.title}>My Rider Account</Text>
    <ResourceView resource={resource} label="Loading rider account" placeholder={<ProfileSkeleton />}>{account => <>
      <Card>
        <Text style={s.subtitle}>{account.overview.account_name}</Text>
        <View style={s.row}>
          <Badge title={account.rider ? readable(account.rider.status) : 'Profile pending'} positive={account.rider?.status === 'approved'} />
          <Badge title={readable(account.overview.identity_status)} positive={account.overview.identity_status === 'manual_verified'} />
        </View>
        {!!account.rider?.rider_type && <Text style={s.body}>{readable(account.rider.rider_type)} rider</Text>}
        {!!account.rider?.price_per_km && <Text style={s.body}>Requested rate ₦{account.rider.price_per_km} per km</Text>}
      </Card>
      {!account.onboarding_enabled && <Notice title="Rider onboarding is closed" message="You can still view your current verification status." />}
      <Checklist account={account} />
      {account.onboarding_enabled && (!account.rider || editableStatus.includes(account.rider.status)) &&
        <Button title={account.rider ? 'Continue rider application' : 'Start rider application'} onPress={() => router.push('/rider-application')} />}
      {account.overview.can_manage_availability && <Availability token={token} online={!!account.rider?.is_online} saved={resource.reload} />}
      {account.review_history.length > 0 && <Card>
        <Text accessibilityRole="header" style={s.subtitle}>Review history</Text>
        {account.review_history.map(event => <View key={event.id} style={s.stack}>
          <Text style={s.label}>{readable(event.to_status || event.action)}</Text>
          {!!event.reason && <Text style={s.body}>{event.reason}</Text>}
        </View>)}
      </Card>}
    </>}</ResourceView>
  </Screen>;
}

export function Checklist({ account }: { account: RiderAccount }) {
  const checklist = account.onboarding;
  const rows: [string, boolean][] = [
    ['Account verification', checklist.account_ready],
    ['Rider and vehicle details', checklist.vehicle_ready],
    ...checklist.required_documents.map((type): [string, boolean] =>
      [documentLabels[type] || readable(type), checklist.uploaded_document_types.includes(type)]),
  ];
  return <Card>
    <Text accessibilityRole="header" style={s.subtitle}>Verification checklist</Text>
    {rows.map(([label, ready]) => <View key={label} style={s.between}>
      <Text style={[s.body, s.grow]}>{label}</Text>
      <Badge title={ready ? 'Complete' : 'Pending'} positive={ready} />
    </View>)}
    {checklist.review_required && <Text style={s.small}>Rider applications are reviewed manually.</Text>}
  </Card>;
}

function Availability({ token, online, saved }: { token: string; online: boolean; saved: () => void }) {
  const { api } = useSession();
  const action = useAction();
  return <Card>
    <View style={s.between}>
      <Text accessibilityRole="header" style={s.subtitle}>Availability</Text>
      <Badge title={online ? 'Online' : 'Offline'} positive={online} />
    </View>
    {!!action.error && <Text accessibilityRole="alert" style={s.error}>{action.error}</Text>}
    <Button title={online ? 'Go offline' : 'Go online'} quiet busy={action.busy}
      onPress={() => void action.run(() => api.riderAvailability(token, !online), saved)} />
  </Card>;
}

export function ProfileSkeleton() {
  return <Card><Skeleton width="58%" height={22} /><Skeleton width="75%" /><Skeleton height={34} /></Card>;
}
