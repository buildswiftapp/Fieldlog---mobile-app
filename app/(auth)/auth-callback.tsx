import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { BrandLoader } from '@/components/BrandLoader';
import { clearAuthUrlParams, mergeAuthParams, readAuthUrlParams } from '@/lib/authLinking';
import { loadOAuthPortal } from '@/lib/oauthIntent';
import { finalizeOAuthSession } from '@/lib/oauthSession';
import { loadPendingSignup, loadSignupPortal, resolveSignupPortal } from '@/lib/pendingSignup';
import { type MobilePortal } from '@/lib/roles';
import {
  establishAuthSessionFromParams,
  hasAuthPayload,
  parseAuthUrl,
  readNativeLinkingAuthUrl,
} from '@/lib/authSession';
import { supabase } from '@/lib/supabase';

async function defaultPortal(): Promise<MobilePortal> {
  const saved = await loadSignupPortal();
  if (saved) return saved;
  const pending = await loadPendingSignup();
  return pending?.userType === 'sub' ? 'sub' : 'gc';
}

export default function AuthCallback() {
  const params = useLocalSearchParams<{ code?: string; error?: string; error_description?: string; type?: string }>();
  const router = useRouter();
  const [message, setMessage] = useState('Confirming your email…');
  const [isError, setIsError] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    let active = true;
    let redirectTimer: ReturnType<typeof setTimeout> | undefined;

    async function goToLogin(portal: MobilePortal, verified = false) {
      redirectTimer = setTimeout(
        () =>
          active &&
          router.replace({
            pathname: '/(auth)/login',
            params: verified ? { portal, verified: '1' } : { portal },
          }),
        verified ? 0 : 2200,
      );
    }

    async function run() {
      if (started.current) return;
      started.current = true;

      const urlParams = readAuthUrlParams();
      const linkingUrl = await readNativeLinkingAuthUrl();
      const fromLink = linkingUrl ? parseAuthUrl(linkingUrl) : null;
      const merged = mergeAuthParams(
        {
          code: typeof params.code === 'string' ? params.code : null,
          error: typeof params.error === 'string' ? params.error : null,
          errorDescription:
            typeof params.error_description === 'string' ? params.error_description : null,
          type: typeof params.type === 'string' ? params.type : null,
        },
        urlParams,
        fromLink ?? undefined,
      );
      const code = merged.code;
      const oauthError = merged.error;
      const errorDescription = merged.errorDescription;
      const type = merged.type ?? fromLink?.type;
      const portal = await defaultPortal();

      if (type === 'recovery' && fromLink && hasAuthPayload(fromLink)) {
        clearAuthUrlParams();
        const result = await establishAuthSessionFromParams(supabase, fromLink);
        if (!result.ok) {
          if (active) {
            setIsError(true);
            setMessage(result.message);
          }
          redirectTimer = setTimeout(() => active && router.replace('/(auth)/reset-password' as '/'), 0);
          return;
        }
        redirectTimer = setTimeout(() => active && router.replace('/(auth)/reset-password' as '/'), 0);
        return;
      }

      if (oauthError || errorDescription) {
        clearAuthUrlParams();
        if (active) {
          setIsError(true);
          setMessage(errorDescription ?? oauthError ?? 'Email confirmation failed.');
        }
        await goToLogin(portal);
        return;
      }

      if (type === 'recovery') {
        clearAuthUrlParams();
        const href = code
          ? `/(auth)/reset-password?code=${encodeURIComponent(code)}`
          : '/(auth)/reset-password';
        redirectTimer = setTimeout(() => active && router.replace(href as '/'), 0);
        return;
      }

      if (!code) {
        clearAuthUrlParams();
        if (active) {
          setIsError(true);
          setMessage('Missing confirmation code.');
        }
        await goToLogin(portal);
        return;
      }

      const oauthPortal = await loadOAuthPortal();
      const { data: existing, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        clearAuthUrlParams();
        if (active) {
          setIsError(true);
          setMessage(sessionError.message);
        }
        await goToLogin(portal);
        return;
      }

      let session = existing.session;
      if (!session) {
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        clearAuthUrlParams();
        if (exchangeError) {
          if (active) {
            setIsError(true);
            setMessage(exchangeError.message);
          }
          await goToLogin(portal);
          return;
        }
        session = data.session;
      } else {
        clearAuthUrlParams();
      }

      if (!session) {
        if (active) {
          setIsError(true);
          setMessage('Could not confirm your email.');
        }
        await goToLogin(portal);
        return;
      }

      if (oauthPortal) {
        const result = await finalizeOAuthSession(session);
        if (!result.ok) {
          if (active) {
            setIsError(true);
            setMessage(result.message);
          }
          await goToLogin(result.returnPortal);
          return;
        }
        if (active) setMessage('Signed in. Finishing setup…');
        redirectTimer = setTimeout(() => active && router.replace('/'), 0);
        return;
      }

      const loginPortal = await resolveSignupPortal(session);
      await supabase.auth.signOut();
      if (active) {
        setMessage('Email confirmed. Opening sign in…');
        setIsError(false);
      }
      await goToLogin(loginPortal, true);
    }

    void run();
    return () => {
      active = false;
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [params.code, params.error, params.error_description, params.type, router]);

  return (
    <BrandLoader
      message={message}
      sub={isError ? 'Returning to sign in…' : 'AI daily logs for the field'}
    />
  );
}
