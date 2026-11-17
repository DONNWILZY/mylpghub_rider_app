import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { randomUUID } from 'expo-crypto';
import * as Location from 'expo-location';
import { ApiError } from '../../api';
import { getErrorMessage, useSession } from '../../session';
import type { Position, TrackingStatus } from './contracts';
import { distanceMeters } from './distance';

type Sharing = { id: string; timer: ReturnType<typeof setInterval>; pending: boolean; sentFix: number };
type Gps = { point: Position | null; distance: number; waiting: boolean; watching: boolean; error: string };
function toPoint(fix: Location.LocationObject): Position | null {
  const { latitude, longitude, accuracy } = fix.coords;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) ||
      Math.abs(latitude) > 90 || Math.abs(longitude) > 180 ||
      !Number.isFinite(fix.timestamp) ||
      (accuracy != null && (!Number.isFinite(accuracy) || accuracy < 0 || accuracy > 100))) return null;
  return { latitude, longitude, accuracy, timestamp: fix.timestamp };
}

const initialGps: Gps = { point: null, distance: 0, waiting: false, watching: false, error: '' };

export function useRiderLocation(token: string, tripId: number, tracking: TrackingStatus | null) {
  const { api } = useSession();
  const [gps, setGps] = useState(initialGps);
  const [sharing, setSharing] = useState(false);
  const [shareStatus, setShareStatus] = useState('');
  const latest = useRef<Position | null>(null);
  const watch = useRef<Location.LocationSubscription | null>(null);
  const starting = useRef(false);
  const generation = useRef(0);
  const session = useRef<Sharing | null>(null);

  const stopSharing = useCallback((message = 'Location sharing stopped.') => {
    const current = session.current;
    if (!current) return;
    session.current = null;
    clearInterval(current.timer);
    setSharing(false);
    setShareStatus(message);
    void api.stopTripSharing(token, tripId, current.id).catch(() => {
      if (!session.current) setShareStatus('Stopped on this phone. Any last shared position will expire shortly.');
    });
  }, [api, token, tripId]);

  const stopGps = useCallback(() => {
    generation.current++;
    starting.current = false;
    watch.current?.remove();
    watch.current = null;
    latest.current = null;
    stopSharing();
    setGps(initialGps);
  }, [stopSharing]);

  useFocusEffect(useCallback(() => {
    const listener = AppState.addEventListener('change', state => {
      if (state === 'background') stopGps();
    });
    const onVisibility = () => { if (document.hidden) stopGps(); };
    if (Platform.OS === 'web') document.addEventListener('visibilitychange', onVisibility);
    return () => {
      listener.remove();
      if (Platform.OS === 'web') document.removeEventListener('visibilitychange', onVisibility);
      stopGps();
    };
  }, [stopGps]));

  const canShare = tracking?.active === true && !tracking.arrived;
  useEffect(() => {
    if (!canShare) stopSharing('Location sharing ended for this delivery.');
  }, [canShare, stopSharing]);

  const arrived = tracking?.arrived === true;
  useEffect(() => {
    if (arrived) stopGps();
  }, [arrived, stopGps]);

  async function startGps() {
    if (starting.current || watch.current || arrived) return;
    starting.current = true;
    const attempt = ++generation.current;
    setGps({ ...initialGps, waiting: true });
    setShareStatus('');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (generation.current !== attempt) return;
      if (!permission.granted) {
        throw new Error(permission.canAskAgain
          ? 'Allow location access to use the trip map.'
          : 'Allow location access for MyQuickGas Rider in your device settings.');
      }
      const subscription = await Location.watchPositionAsync({
        accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 5,
      }, fix => {
        if (generation.current !== attempt) return;
        const point = toPoint(fix);
        if (!point || (latest.current && latest.current.timestamp >= point.timestamp)) return;
        latest.current = point;
        setGps(previous => {
          const delta = previous.point ? distanceMeters(previous.point, point) : 0;
          const minimum = Math.max(8, Math.min(24, (point.accuracy ?? 12) / 2));
          return { point, distance: previous.distance + (delta >= minimum ? delta : 0),
            waiting: false, watching: true, error: '' };
        });
      }, () => {
        if (generation.current !== attempt) return;
        latest.current = null;
        setGps(previous => ({ ...previous, point: null, waiting: false,
          error: 'The phone could not get a GPS fix. Try moving outdoors or restarting GPS.' }));
      });
      if (generation.current !== attempt) {
        subscription.remove();
        return;
      }
      watch.current = subscription;
      setGps(previous => ({ ...previous, watching: true, waiting: false }));
    } catch (error) {
      if (generation.current === attempt) setGps({ ...initialGps, error: getErrorMessage(error) });
    } finally {
      if (generation.current === attempt) starting.current = false;
    }
  }

  function startSharing() {
    if (session.current || !canShare || !latest.current) return;
    const id = randomUUID();
    const interval = Math.max(20, tracking?.interval_seconds ?? 20) * 1000 + 1000;

    async function publish() {
      const current = session.current;
      if (!current || current.id !== id || current.pending) return;
      current.pending = true;
      try {
        let point = latest.current;
        if (!point || Date.now() - point.timestamp > 30000 || point.timestamp <= current.sentFix) {
          point = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
            .then(toPoint).catch(() => null);
        }
        if (session.current !== current) return;
        if (!point || Date.now() - point.timestamp > 30000 || point.timestamp <= current.sentFix) {
          setShareStatus('Waiting for a fresh GPS fix.');
          return;
        }
        await api.publishTripLocation(token, tripId, id, point);
        current.sentFix = point.timestamp;
        if (session.current === current) setShareStatus('Location shared with the customer.');
      } catch (error) {
        if (session.current !== current) return;
        if (error instanceof ApiError && [401, 403, 404, 409].includes(error.status)) {
          stopSharing('Location sharing is unavailable for this delivery.');
        } else {
          setShareStatus(error instanceof ApiError && error.status === 429
            ? 'Waiting to send the next update.'
            : 'Update failed. Checking your connection before the next update.');
        }
      } finally {
        current.pending = false;
      }
    }

    session.current = { id, timer: setInterval(() => void publish(), interval), pending: false, sentFix: 0 };
    setSharing(true);
    setShareStatus('Sending your location…');
    void publish();
  }

  return { gps, sharing, shareStatus, canShare, startGps, stopGps, startSharing, stopSharing };
}
