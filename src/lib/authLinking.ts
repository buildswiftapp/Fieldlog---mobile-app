import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

export type AuthRedirectPath = '/auth-callback' | '/reset-password';

export function getAuthRedirectUrl(path: AuthRedirectPath) {
  const normalized = path.replace(/^\//, '');
  const linked = Linking.createURL(normalized);

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    if (linked.startsWith('http://') || linked.startsWith('https://')) return linked;
    return `${window.location.origin}/${normalized}`;
  }

  return linked;
}

export type AuthUrlParams = {
  code: string | null;
  error: string | null;
  errorDescription: string | null;
  type: string | null;
};

export function readAuthUrlParams(): AuthUrlParams {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    return {
      code: params.get('code'),
      error: params.get('error'),
      errorDescription: params.get('error_description'),
      type: params.get('type'),
    };
  }
  return { code: null, error: null, errorDescription: null, type: null };
}

export function clearAuthUrlParams() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.history.replaceState({}, '', window.location.pathname);
  }
}

export function authCallbackHref(code: string, type?: string | null): string {
  const query = type
    ? `?code=${encodeURIComponent(code)}&type=${encodeURIComponent(type)}`
    : `?code=${encodeURIComponent(code)}`;
  return `/(auth)/auth-callback${query}`;
}

export function resetPasswordHref(code: string): string {
  return `/(auth)/reset-password?code=${encodeURIComponent(code)}`;
}
