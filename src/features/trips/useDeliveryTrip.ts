import { useCallback, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { ApiError } from '../../api';
import { getErrorMessage, useSession } from '../../session';
import type { AssignedTrip, TrackingStatus } from './contracts';

export function useDeliveryTrip(token: string, id: number) {
  const { api, expire } = useSession();
  const expireSession = useRef(expire);
  expireSession.current = expire;
  const [trip, setTrip] = useState<AssignedTrip | null>(null);
  const [tracking, setTracking] = useState<TrackingStatus | null>(null);
  const [tripError, setTripError] = useState('');
  const [trackingError, setTrackingError] = useState('');
  const [waiting, setWaiting] = useState(true);
  const refreshRef = useRef<() => void>(() => {});

  useFocusEffect(useCallback(() => {
    const controller = new AbortController();
    let pending = false;
    let refreshQueued = false;

    async function refresh() {
      if (controller.signal.aborted || AppState.currentState === 'background') return;
      if (pending) {
        refreshQueued = true;
        return;
      }

      pending = true;
      try {
        const assigned = await api.assignedTrips(token, controller.signal);
        if (controller.signal.aborted) return;
        const current = assigned.find(candidate => candidate.trip_id === id) ?? null;
        setTrip(current);
        setTripError(current ? '' : 'This delivery is no longer assigned to your rider account.');
        setWaiting(false);
        if (!current || !['assigned', 'in_transit'].includes(current.status) || current.delivery_code_verified) {
          setTracking(null);
          setTrackingError('');
          return;
        }
        try {
          const data = await api.tripTracking(token, id, controller.signal);
          if (!controller.signal.aborted) {
            setTracking(data);
            setTrackingError('');
          }
        } catch (error) {
          if (controller.signal.aborted) return;
          if (error instanceof ApiError && error.status === 401) throw error;
          setTracking(null);
          setTrackingError(error instanceof ApiError && [403, 404, 409].includes(error.status)
            ? 'Live tracking is unavailable for this delivery.' : getErrorMessage(error));
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        setTracking(null);
        setWaiting(false);
        setTripError(getErrorMessage(error));
        if (error instanceof ApiError && [401, 403, 404].includes(error.status)) setTrip(null);
        if (error instanceof ApiError && error.status === 401) {
          await expireSession.current(token).catch(failure => {
            if (!controller.signal.aborted) setTripError(getErrorMessage(failure));
          });
        }
      } finally {
        pending = false;
        if (refreshQueued && !controller.signal.aborted) {
          refreshQueued = false;
          void refresh();
        }
      }
    }

    refreshRef.current = () => { void refresh(); };
    void refresh();
    const interval = setInterval(() => void refresh(), 10000);
    const appState = AppState.addEventListener('change', state => { if (state === 'active') void refresh(); });
    return () => {
      controller.abort();
      clearInterval(interval);
      appState.remove();
      refreshRef.current = () => {};
    };
  }, [api, token, id]));

  return { trip, tripError, waiting, tracking, trackingError, refresh: () => refreshRef.current() };
}
