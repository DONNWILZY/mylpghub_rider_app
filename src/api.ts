import type { PickupAction, PickupQueue } from './features/pickups/contracts';
import type { AssignedTrip, PickupCode, Position, TrackingStatus } from './features/trips/contracts';

export class ApiError extends Error {
  constructor(message: string, readonly status = 0, readonly code?: string) {
    super(message);
    this.name = 'ApiError';
  }
}

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  code?: string;
  data?: T;
  errors?: Record<string, string[]>;
  requires_2fa?: boolean;
};

export type User = { id: number; name: string; email: string; phone?: string | null };
export type RiderAccount = {
  rider: {
    status: string;
    rider_type?: string | null;
    price_per_km?: string | number | null;
    vehicle_type?: string | null;
    vehicle_number?: string | null;
    is_online?: boolean;
  } | null;
  overview: {
    account_name: string;
    identity_status: string;
    trip_quotes_enabled: boolean;
    can_manage_availability?: boolean;
  };
  onboarding: {
    account_ready: boolean;
    vehicle_ready: boolean;
    required_documents: string[];
    uploaded_document_types: string[];
    review_required: boolean;
    can_submit?: boolean;
  };
  review_history: Array<{ id: number; to_status?: string | null; action: string; reason?: string | null; created_at?: string | null }>;
  onboarding_enabled: boolean;
  portal_available?: boolean;
  dispatch_enabled: boolean;
  payouts_enabled: boolean;
};

type SignInData = { token?: string; user?: User; email?: string };
type SignInResult = { kind: 'challenge'; email: string } | { kind: 'session'; token: string; user: User };

type RequestOptions = {
  token?: string;
  body?: Record<string, unknown> | FormData;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  signal?: AbortSignal;
};

export function createApi(baseUrl: string | undefined, allowInsecure = false) {
  const base = baseUrl?.trim().replace(/\/+$/, '');

  async function requestJson<T>(
    path: string,
    { token, body, method = 'GET', signal }: RequestOptions = {},
  ): Promise<T> {
    if (!base || !/^https?:\/\/[^/?#\s@]+\/api\/v1$/i.test(base) || (!allowInsecure && !base.startsWith('https://'))) {
      throw new ApiError('Set EXPO_PUBLIC_API_URL to your Laravel API ending in /api/v1.');
    }

    const controller = new AbortController();
    const abort = () => controller.abort();
    if (signal?.aborted) abort();
    signal?.addEventListener('abort', abort, { once: true });
    const multipart = body instanceof FormData;
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, multipart ? 60000 : 15000);

    try {
      const response = await fetch(base + path, {
        method,
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          ...(body && !multipart ? { 'Content-Type': 'application/json' } : {}),
          ...(token ? { Authorization: 'Bearer ' + token } : {}),
        },
        ...(body ? { body: multipart ? body : JSON.stringify(body) } : {}),
      });
      const payload: (T & ApiEnvelope<unknown>) | null = await response.json().catch(() => null);

      if (!response.ok || !payload || payload.success === false) {
        const validation = payload?.errors && Object.values(payload.errors).flat().find(Boolean);
        const fallback = response.status === 429
          ? 'Too many attempts. Please try again shortly.'
          : 'The server could not complete this request.';
        throw new ApiError(validation || payload?.message || fallback, response.status, payload?.code);
      }
      return payload;
    } catch (error) {
      if (timedOut) throw new ApiError('The request timed out. Please try again.');
      if (signal?.aborted || error instanceof ApiError) throw error;
      throw new ApiError('Could not connect. Check your connection and API address.');
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener('abort', abort);
    }
  }

  function request<T>(path: string, options?: RequestOptions) {
    return requestJson<ApiEnvelope<T>>(path, options);
  }

  function data<T>(response: ApiEnvelope<T>): T {
    if (response.data == null) throw new ApiError('The server returned an incomplete response.');
    return response.data;
  }

  function session(response: ApiEnvelope<SignInData>): SignInResult {
    const { token, user } = data(response);
    if (!token || !user) throw new ApiError('The server did not create a session.');
    return { kind: 'session', token, user };
  }

  return {
    async register(input: {
      name: string; username: string; phone: string; email: string; password: string; password_confirmation: string;
    }) {
      await request('/register', { method: 'POST', body: input });
    },
    async login(email: string, password: string): Promise<SignInResult> {
      const response = await request<SignInData>('/login', { method: 'POST', body: { email, password } });
      if (response.requires_2fa) return { kind: 'challenge', email: data(response).email ?? email };
      return session(response);
    },
    async verifySignIn(email: string, code: string, recovery: boolean) {
      const path = recovery ? '/verify-2fa-recovery' : '/verify-2fa';
      const body: Record<string, string> = recovery ? { email, recovery_code: code } : { email, code };
      return session(await request<SignInData>(path, { method: 'POST', body }));
    },
    async verifyEmail(email: string, code: string) {
      await request('/verify-email', { method: 'POST', body: { email, code } });
    },
    async resendVerification(email: string) {
      await request('/resend-verification-otp', { method: 'POST', body: { email } });
    },
    async requestPasswordCode(email: string) {
      await request('/forgot-password', { method: 'POST', body: { email } });
    },
    async verifyPasswordCode(email: string, code: string) {
      const result = data(await request<{ email: string; token: string }>('/verify-reset-otp', {
        method: 'POST', body: { email, code },
      }));
      if (!result.token || !result.email) throw new ApiError('The server did not issue a reset token.');
      return result;
    },
    async resetPassword(email: string, token: string, password: string, confirmation: string) {
      await request('/reset-password', {
        method: 'POST', body: { email, token, password, password_confirmation: confirmation },
      });
    },
    async me(token: string, signal?: AbortSignal) {
      return data(await request<{ user: User }>('/me', { token, signal })).user;
    },
    async logout(token: string) {
      await request('/logout', { token, method: 'POST' });
    },
    async riderAccount(token: string, signal?: AbortSignal) {
      return data(await request<RiderAccount>('/rider/me', { token, signal }));
    },
    async saveRiderDraft(token: string, body: {
      rider_type: string; vehicle_type: string; vehicle_number: string; price_per_km?: number;
    }) {
      await request('/rider/draft', { token, method: 'PUT', body });
    },
    async uploadRiderDocument(token: string, body: FormData) {
      await request('/rider/documents', { token, method: 'POST', body });
    },
    async submitRider(token: string) {
      await request('/rider/submit', { token, method: 'POST' });
    },
    async riderAvailability(token: string, online: boolean) {
      await request('/rider/availability', { token, method: 'PUT', body: { is_online: online } });
    },
    async pickupQueue(token: string, signal?: AbortSignal) {
      const queue = await requestJson<PickupQueue>('/logistics/rider/pickups', { token, signal });
      if (!Array.isArray(queue.nearby) || !Array.isArray(queue.assigned)) {
        throw new ApiError('The server returned an incomplete pickup queue.');
      }
      return queue;
    },
    async pickupAction(token: string, id: string, action: PickupAction) {
      await requestJson('/logistics/rider/pickups/' + encodeURIComponent(id) + '/' + action, { token, method: 'POST' });
    },
    async sharePickupLocation(token: string, latitude: number, longitude: number) {
      await request('/rider/location', { token, method: 'POST', body: { consent: true, latitude, longitude } });
    },
    async assignedTrips(token: string, signal?: AbortSignal) {
      return data(await request<{ trips: AssignedTrip[] }>('/rider/delivery-trips/assigned', { token, signal })).trips;
    },
    async tripTracking(token: string, id: number, signal?: AbortSignal) {
      return data(await request<TrackingStatus>('/rider/delivery-trips/' + id + '/tracking', { token, signal }));
    },
    async publishTripLocation(token: string, id: number, sessionId: string, point: Position) {
      return data(await request<{ recorded_at: string; expires_at: string }>('/rider/delivery-trips/' + id + '/tracking', {
        token, method: 'POST', body: {
          consent: true, session_id: sessionId, latitude: point.latitude, longitude: point.longitude,
          accuracy_meters: point.accuracy != null && point.accuracy >= 0 && point.accuracy <= 1000 ? Math.round(point.accuracy) : null,
        },
      }));
    },
    async stopTripSharing(token: string, id: number, sessionId: string) {
      await request('/rider/delivery-trips/' + id + '/tracking', { token, method: 'DELETE', body: { session_id: sessionId } });
    },
    async issuePickup(token: string, id: number) {
      return data(await request<PickupCode>('/rider/delivery-trips/' + id + '/pickup-code', { token, method: 'POST' }));
    },
    async acknowledgePickup(token: string, id: number) {
      await request('/rider/delivery-trips/' + id + '/acknowledge-pickup', { token, method: 'POST' });
    },
    async verifyDropoff(token: string, id: number, code: string) {
      await request('/rider/delivery-trips/' + id + '/verify-delivery', { token, method: 'POST', body: { code } });
    },
  };
}
