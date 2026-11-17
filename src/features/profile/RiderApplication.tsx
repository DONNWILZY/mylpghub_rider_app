import { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { Platform, Text, View } from 'react-native';
import type { RiderAccount } from '../../api';
import { OptionPicker } from '../../components/OptionPicker';
import { Notice } from '../../components/feedback/Notice';
import { ResourceView } from '../../components/feedback/ResourceView';
import { Screen } from '../../components/layout/Screen';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Field } from '../../components/ui/Field';
import { useAction } from '../../hooks/useAction';
import { useResource } from '../../hooks/useResource';
import { readable } from '../../lib/format';
import { useSession } from '../../session';
import { s } from '../../theme/tokens';
import { RequireAccount } from '../account/AccountScreen';
import { Checklist, documentLabels, editableStatus, ProfileSkeleton } from './RiderProfile';

const riderTypes = ['independent', 'employed'].map(value => ({ value, name: readable(value) }));
const vehicles = ['motorcycle','tricycle','car','van','pickup','truck','bicycle','scooter'].map(value => ({ value, name: readable(value) }));

export function RiderApplication() {
  return <RequireAccount title="Rider application" message="Sign in to manage your rider application.">
    <Application />
  </RequireAccount>;
}

function Application() {
  const { api, session } = useSession();
  const token = session!.token;
  const [message, setMessage] = useState('');
  const resource = useResource('application', signal => api.riderAccount(token, signal), token);
  const submit = useAction();
  function refresh(text: string) { setMessage(text); resource.reload(); }

  return <Screen edges={['left','right','bottom']}>
    {!!message && <Text accessibilityLiveRegion="polite" style={s.body}>{message}</Text>}
    <ResourceView resource={resource} label="Loading rider application" placeholder={<ProfileSkeleton />}>{account => {
      const editable = account.onboarding_enabled && (!account.rider || editableStatus.includes(account.rider.status));
      return <>
        <Checklist account={account} />
        {editable ? <>
          <RiderForm rider={account.rider} token={token} saved={() => refresh('Rider details saved.')} />
          {account.rider && <Evidence required={account.onboarding.required_documents} uploaded={account.onboarding.uploaded_document_types}
            token={token} saved={() => refresh('Document uploaded.')} />}
          <Card>
            <Text accessibilityRole="header" style={s.subtitle}>Submit for review</Text>
            {!account.onboarding.can_submit && <Text style={s.body}>Complete your checklist before submitting.</Text>}
            {!!submit.error && <Text accessibilityRole="alert" style={s.error}>{submit.error}</Text>}
            <Button title="Submit rider application" disabled={!account.onboarding.can_submit} busy={submit.busy}
              onPress={() => void submit.run(() => api.submitRider(token), () => refresh('Application submitted for review.'))} />
          </Card>
        </> : <Notice title="Application editing unavailable"
          message={account.onboarding_enabled ? 'Check your current review status in My Rider Account.' : 'Rider onboarding is closed in this environment.'} />}
      </>;
    }}</ResourceView>
  </Screen>;
}

function RiderForm({ rider, token, saved }: { rider: RiderAccount['rider']; token: string; saved: () => void }) {
  const { api } = useSession();
  const [type, setType] = useState(rider?.rider_type || '');
  const [vehicle, setVehicle] = useState(rider?.vehicle_type || '');
  const [number, setNumber] = useState(rider?.vehicle_number || '');
  const [rate, setRate] = useState(rider?.price_per_km == null ? '' : String(rider.price_per_km));
  const action = useAction();
  const registrationValid = /^(?=.{5,20}$)(?=.*[A-Za-z])(?=.*[0-9])[A-Za-z0-9 -]+$/.test(number.trim());
  const rateValid = /^(?:\d+(?:\.\d{1,2})?|\.\d{1,2})$/.test(rate.trim()) && Number(rate) > 0 && Number(rate) <= 9999999.99;
  return <Card>
    <Text accessibilityRole="header" style={s.subtitle}>Rider and vehicle details</Text>
    <OptionPicker label="Rider type" placeholder="Select rider type" options={riderTypes} selected={riderTypes.find(option => option.value === type)}
      disabled={action.busy} searchable={false} clearable={false} onChange={option => { if (option) setType(option.value); }} />
    <OptionPicker label="Vehicle type" placeholder="Select vehicle type" options={vehicles} selected={vehicles.find(option => option.value === vehicle)}
      disabled={action.busy} searchable={false} clearable={false} onChange={option => { if (option) setVehicle(option.value); }} />
    <Field label="Vehicle number" autoCapitalize="characters" value={number} onChangeText={setNumber} maxLength={20} editable={!action.busy} />
    {!!number && !registrationValid && <Text style={s.small}>Enter 5–20 characters with letters and digits.</Text>}
    {type === 'independent' && <Field label="Rate per kilometre (₦)" keyboardType="decimal-pad" value={rate} onChangeText={setRate} editable={!action.busy} />}
    {!!action.error && <Text accessibilityRole="alert" style={s.error}>{action.error}</Text>}
    <Button title="Save rider details" busy={action.busy} disabled={!type || !vehicle || !registrationValid || (type === 'independent' && !rateValid)}
      onPress={() => void action.run(() => api.saveRiderDraft(token, {
        rider_type: type, vehicle_type: vehicle, vehicle_number: number.trim(),
        ...(type === 'independent' ? { price_per_km: Number(rate) } : {}),
      }), saved)} />
  </Card>;
}

function Evidence({ required, uploaded, token, saved }: { required: string[]; uploaded: string[]; token: string; saved: () => void }) {
  const { api } = useSession();
  const options = required.map(value => ({ value, name: documentLabels[value] || readable(value) }));
  const [type, setType] = useState(options[0]?.value || '');
  const action = useAction();
  async function upload() {
    const result = await DocumentPicker.getDocumentAsync({
      type: type === 'selfie_video' ? ['video/mp4','video/quicktime','image/jpeg','image/png']
        : ['application/pdf','image/jpeg','image/png'],
      copyToCacheDirectory: true, multiple: false, base64: false,
    });
    if (result.canceled) return false;
    const asset = result.assets[0];
    if (!asset || (asset.size !== undefined && asset.size > 15 * 1024 * 1024)) throw new Error('Choose a file up to 15 MB.');
    const form = new FormData();
    form.append('document_type', type);
    if (Platform.OS === 'web') {
      if (!asset.file) throw new Error('This browser could not access the selected file.');
      form.append('file', asset.file, asset.name);
    } else {
      form.append('file', { uri: asset.uri, name: asset.name, type: asset.mimeType || 'application/octet-stream' } as unknown as Blob);
    }
    await api.uploadRiderDocument(token, form);
    return true;
  }
  if (!options.length) return null;
  return <Card>
    <Text accessibilityRole="header" style={s.subtitle}>Verification documents</Text>
    <OptionPicker label="Document type" placeholder="Select a document" options={options}
      selected={options.find(option => option.value === type)} searchable={false} clearable={false} disabled={action.busy}
      onChange={option => { if (option) setType(option.value); }} />
    <Text style={s.small}>{type === 'selfie_video' ? 'MP4, MOV, JPG or PNG' : 'PDF, JPG or PNG'} up to 15 MB.</Text>
    {!!action.error && <Text accessibilityRole="alert" style={s.error}>{action.error}</Text>}
    <View style={s.row}><Button title={uploaded.includes(type) ? 'Replace document' : 'Choose and upload document'} quiet
      busy={action.busy} disabled={!type} onPress={() => void action.run(upload, result => { if (result) saved(); })} /></View>
  </Card>;
}
