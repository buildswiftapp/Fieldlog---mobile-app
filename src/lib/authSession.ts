import type { SupabaseClient } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

export type AuthUrlParams = {
  code: string | null;
  error: string | null;
  errorDescription: string | null;
  type: string | null;
};

export type ParsedAuthUrl = AuthUrlParams & {
  accessToken: string | null;
  refreshToken: string | null;
  tokenHash: string | null;
};

const EMPTY: ParsedAuthUrl = {
  code: null,
  error: null,
  errorDescription: null,
  type: null,
  accessToken: null,
  refreshToken: null,
  tokenHash: null,
};

function readParam(params: URLSearchParams, key: string) {
  return params.get(key) ?? params.get(key.replace(/_/g, ''));
}

/** Parse query + hash params from a Supabase auth redirect URL. */
export function parseAuthUrl(rawUrl: string): ParsedAuthUrl {
  if (!rawUrl) return { ...EMPTY };

  const hashIndex = rawUrl.indexOf('#');
  const queryIndex = rawUrl.indexOf('?');
  const queryPart =
    queryIndex >= 0 ? rawUrl.slice(queryIndex + 1, hashIndex >= 0 ? hashIndex : undefined) : '';
  const hashPart = hashIndex >= 0 ? rawUrl.slice(hashIndex + 1) : '';

  const query = new URLSearchParams(queryPart);
  const hash = new URLSearchParams(hashPart);

  const pick = (key: string) => readParam(query, key) ?? readParam(hash, key);

  return {
    code: pick('code'),
    error: pick('error'),
    errorDescription: pick('error_description'),
    type: pick('type'),
    accessToken: pick('access_token'),
    refreshToken: pick('refresh_token'),
    tokenHash: pick('token_hash'),
  };
}

export function parseAuthUrlParams(input: AuthUrlParams | ParsedAuthUrl): ParsedAuthUrl {
  return {
    ...EMPTY,
    ...input,
    accessToken: 'accessToken' in input ? input.accessToken : null,
    refreshToken: 'refreshToken' in input ? input.refreshToken : null,
    tokenHash: 'tokenHash' in input ? input.tokenHash : null,
  };
}

export function hasAuthPayload(parsed: ParsedAuthUrl) {
  return Boolean(
    parsed.code ||
      parsed.tokenHash ||
      (parsed.accessToken && parsed.refreshToken) ||
      parsed.error,
  );
}

export async function readNativeLinkingAuthUrl(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  try {
    return await Linking.getInitialURL();
  } catch {
    return null;
  }
}

function otpTypeFromAuthType(type: string | null): 'recovery' | 'signup' | 'email' | 'invite' | null {
  if (type === 'recovery') return 'recovery';
  if (type === 'signup') return 'signup';
  if (type === 'invite') return 'invite';
  if (type === 'email' || type === 'magiclink') return 'email';
  return null;
}

/**
 * Turn Supabase redirect params into a session (PKCE code, OTP token hash, or implicit tokens).
 */
export async function establishAuthSessionFromParams(
  supabase: SupabaseClient,
  input: AuthUrlParams | ParsedAuthUrl,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const parsed = parseAuthUrlParams(input);

  if (parsed.error) {
    return { ok: false, message: parsed.errorDescription ?? parsed.error };
  }

  if (parsed.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(parsed.code);
    if (error) return { ok: false, message: error.message };
    return { ok: true };
  }

  const otpType = otpTypeFromAuthType(parsed.type);
  if (parsed.tokenHash && otpType) {
    const { error } = await supabase.auth.verifyOtp({ type: otpType, token_hash: parsed.tokenHash });
    if (error) return { ok: false, message: error.message };
    return { ok: true };
  }

  if (parsed.accessToken && parsed.refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: parsed.accessToken,
      refresh_token: parsed.refreshToken,
    });
    if (error) return { ok: false, message: error.message };
    return { ok: true };
  }

  return { ok: false, message: 'Missing confirmation code.' };
}
