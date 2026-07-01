import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { getAuthRedirectUrl } from '@/lib/authLinking';
import { parseAuthUrl } from '@/lib/authSession';
import { saveOAuthPortal } from '@/lib/oauthIntent';
import { type MobilePortal } from '@/lib/roles';
import { supabase } from '@/lib/supabase';

export type OAuthProvider = 'google' | 'azure';

export type OAuthStartResult =
  | { status: 'redirecting' } // web — the browser is navigating to the provider
  | { status: 'callback'; code: string; type: string | null } // native — code to exchange
  | { status: 'cancelled' }
  | { status: 'error'; message: string };

// Lets the web popup/redirect flow finish cleanly when it returns to the app.
void WebBrowser.maybeCompleteAuthSession();

/**
 * Starts a Supabase OAuth sign-in (Google / Microsoft).
 *
 * Web: hands off to the browser redirect; Supabase returns to /auth-callback.
 * Native: opens an in-app auth session, then returns the PKCE `code` so the
 * caller can route to the auth-callback screen to exchange + finalize it.
 *
 * The chosen portal (gc/sub) is persisted first so auth-callback can reconcile
 * the account type after the round-trip.
 */
export async function startOAuth(
  provider: OAuthProvider,
  portal: MobilePortal,
): Promise<OAuthStartResult> {
  await saveOAuthPortal(portal);
  const redirectTo = getAuthRedirectUrl('auth-callback');

  if (Platform.OS === 'web') {
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
    if (error) return { status: 'error', message: error.message };
    return { status: 'redirecting' };
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) return { status: 'error', message: error.message };
  if (!data?.url) return { status: 'error', message: 'Could not start sign-in. Please try again.' };

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type === 'cancel' || result.type === 'dismiss') return { status: 'cancelled' };
  if (result.type !== 'success' || !result.url) {
    return { status: 'error', message: 'Sign-in was not completed.' };
  }

  const parsed = parseAuthUrl(result.url);
  if (parsed.error) return { status: 'error', message: parsed.errorDescription ?? parsed.error };
  if (!parsed.code) return { status: 'error', message: 'No sign-in code was returned.' };
  return { status: 'callback', code: parsed.code, type: parsed.type };
}
