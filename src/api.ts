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
  } | null;
  overview: {
    account_name: string;
    identity_status: string;
    trip_quotes_enabled: boolean;
  };
  onboarding: {
    account_ready: boolean;
    vehicle_ready: boolean;
    required_documents: string[];
    uploaded_document_types: string[];
    review_required: boolean;
  };
  review_history: Array<{ id: number; to_status?: string | null; action: string; created_at?: string | null }>;
  onboarding_enabled: boolean;
  dispatch_enabled: boolean;
  payouts_enabled: boolean;
};

type SignInData = { token?: string; user?: User; email?: string };
type SignInResult = { kind: 'challenge'; email: string } | { kind: 'session'; token: string; user: User };

export function createApi(baseUrl: string | undefined, allowInsecure = false) {
  const base = baseUrl?.trim().replace(/\/+$/, '');

  async function request<T>(
    path: string,
    { token, body, method = 'GET', signal }: {
      token?: string;
      body?: Record<string, string>;
      method?: 'GET' | 'POST';
      signal?: AbortSignal;
    } = {},
  ): Promise<ApiEnvelope<T>> {
    if (!base || !/^https?:\/\/[^/?#\s@]+\/api\/v1$/i.test(base) || (!allowInsecure && !base.startsWith('https://'))) {
      throw new ApiError('Set EXPO_PUBLIC_API_URL to your Laravel API ending in /api/v1.');
    }

    const controller = new AbortController();
    const abort = () => controller.abort();
    if (signal?.aborted) abort();
    signal?.addEventListener('abort', abort, { once: true });
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 15000);

    try {
      const response = await fetch(base + path, {
        method,
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          ...(body ? { 'Content-Type': 'application/json' } : {}),
          ...(token ? { Authorization: 'Bearer ' + token } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      const payload: ApiEnvelope<T> | null = await response.json().catch(() => null);

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
    async me(token: string, signal?: AbortSignal) {
      return data(await request<{ user: User }>('/me', { token, signal })).user;
    },
    async logout(token: string) {
      await request('/logout', { token, method: 'POST' });
    },
    async riderAccount(token: string, signal?: AbortSignal) {
      return data(await request<RiderAccount>('/rider/me', { token, signal }));
    },
  };
}
