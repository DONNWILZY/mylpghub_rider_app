import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { ApiError, createApi, type User } from './api';

type Session = { token: string; user: User };
type SessionStatus = 'checking' | 'restore-error' | 'guest' | 'signed-in';

type SessionContext = {
  api: ReturnType<typeof createApi>;
  status: SessionStatus;
  session: Session | null;
  problem: string;
  retry: () => void;
  signIn: (session: Session) => Promise<void>;
  signOut: () => Promise<void>;
  expire: (token: string) => Promise<void>;
};

const Context = createContext<SessionContext | null>(null);

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}

export function SessionProvider({ apiUrl, children }: {
  apiUrl: string | undefined;
  children: ReactNode;
}) {
  const api = useMemo(() => createApi(apiUrl, __DEV__ || Platform.OS === 'web'), [apiUrl]);
  const key = 'myquickgas.session.rider';
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<SessionStatus>('checking');
  const [problem, setProblem] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function restore() {
      let token: string | null = null;
      try {
        if (Platform.OS !== 'web') token = await SecureStore.getItemAsync(key);
        if (!token) {
          if (!controller.signal.aborted) setStatus('guest');
          return;
        }
        const user = await api.me(token, controller.signal);
        if (!controller.signal.aborted) {
          setSession({ token, user });
          setStatus('signed-in');
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        if (error instanceof ApiError && [401, 403].includes(error.status)) {
          try {
            await SecureStore.deleteItemAsync(key);
            if (!controller.signal.aborted) setStatus('guest');
            return;
          } catch {
            if (controller.signal.aborted) return;
          }
        }
        setProblem(getErrorMessage(error));
        setStatus('restore-error');
      }
    }
    void restore();
    return () => controller.abort();
  }, [api, attempt, key]);

  async function signIn(next: Session) {
    try {
      if (Platform.OS !== 'web') await SecureStore.setItemAsync(key, next.token);
    } catch (error) {
      // The token was minted by Laravel even if the device could not save it.
      await api.logout(next.token).catch(() => undefined);
      throw error;
    }
    setSession(next);
    setStatus('signed-in');
  }

  async function clear() {
    if (Platform.OS !== 'web') await SecureStore.deleteItemAsync(key);
    setSession(null);
    setStatus('guest');
  }

  async function signOut() {
    const token = session?.token;
    if (!token) return;
    await api.logout(token).catch(error => {
      if (!(error instanceof ApiError) || error.status !== 401) throw error;
    });
    await clear();
  }

  async function expire(token: string) {
    if (session?.token === token) await clear();
  }

  return <Context.Provider value={{
    api, status, session, problem, signIn, signOut, expire,
    retry: () => {
      setStatus('checking');
      setAttempt(current => current + 1);
    },
  }}>{children}</Context.Provider>;
}

export function useSession() {
  const session = useContext(Context);
  if (!session) throw new Error('SessionProvider is required.');
  return session;
}
