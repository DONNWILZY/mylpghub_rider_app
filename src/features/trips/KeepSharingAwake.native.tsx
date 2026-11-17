import { useKeepAwake } from 'expo-keep-awake';

export function KeepSharingAwake() {
  useKeepAwake('myquickgas-rider-location');
  return null;
}
