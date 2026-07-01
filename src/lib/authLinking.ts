import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { parseAuthUrl, type AuthUrlParams } from '@/lib/authSession';

export type { AuthUrlParams } from '@/lib/authSession';

export type AuthRedirectPath = 'auth-callback' | 'reset-password';

const APP_SCHEME = process.env.EXPO_PUBLIC_APP_SCHEME ?? 'fieldlog';

export function getAuthRedirectUrl(path: AuthRedirectPath | `/${AuthRedirectPath}`) {
  const normalized = path.replace(/^\//, '') as AuthRedirectPath;
  const override = process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL?.trim();
  if (override) {
    const base = override.replace(/\/$/, '');
    return `${base}/${normalized}`;
  }

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/${normalized}`;
    }
    return Linking.createURL(normalized);
  }

  return `${APP_SCHEME}://${normalized}`;
}

export function listRequiredSupabaseRedirectUrls() {
  const urls = [
    `${APP_SCHEME}://auth-callback`,
    `${APP_SCHEME}://reset-password`,
    'http://localhost:3000/auth/callback',
    'http://localhost:3000/reset-password',
  ];
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    urls.push(`${window.location.origin}/auth-callback`, `${window.location.origin}/reset-password`);
  }
  return urls;
}

export function readAuthUrlParams(): AuthUrlParams {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const parsed = parseAuthUrl(
      `${window.location.origin}${window.location.pathname}${window.location.search}${window.location.hash}`,
    );
    return {
      code: parsed.code,
      error: parsed.error,
      errorDescription: parsed.errorDescription,
      type: parsed.type,
    };
  }
  return { code: null, error: null, errorDescription: null, type: null };
}

export function clearAuthUrlParams() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.history.replaceState({}, '', window.location.pathname);
  }
}

export function mergeAuthParams(
  ...sources: Array<AuthUrlParams | null | undefined>
): AuthUrlParams {
  const merged: AuthUrlParams = { code: null, error: null, errorDescription: null, type: null };
  for (const source of sources) {
    if (!source) continue;
    if (source.code) merged.code = source.code;
    if (source.error) merged.error = source.error;
    if (source.errorDescription) merged.errorDescription = source.errorDescription;
    if (source.type) merged.type = source.type;
  }
  return merged;
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

export function isExpoGo() {
  return Constants.appOwnership === 'expo';
}
