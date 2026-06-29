import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { BrandLoader } from '@/components/BrandLoader';
import { clearAuthUrlParams, readAuthUrlParams } from '@/lib/authLinking';
import { finalizeOAuthSession } from '@/lib/oauthSession';
import { loginRouteForPortal } from '@/lib/roles';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const params = useLocalSearchParams<{ code?: string; error?: string; error_description?: string; type?: string }>();
  const router = useRouter();
  const [message, setMessage] = useState('Confirming your sign-in…');
  const [isError, setIsError] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    let active = true;
    let redirectTimer: ReturnType<typeof setTimeout> | undefined;

    async function run() {
      if (started.current) return;
      started.current = true;

      const urlParams = readAuthUrlParams();
      const code = typeof params.code === 'string' ? params.code : urlParams.code;
      const oauthError = typeof params.error === 'string' ? params.error : urlParams.error;
      const errorDescription =
        typeof params.error_description === 'string' ? params.error_description : urlParams.errorDescription;
      const type = typeof params.type === 'string' ? params.type : urlParams.type;

      if (oauthError || errorDescription) {
        clearAuthUrlParams();
        if (active) {
          setIsError(true);
          setMessage(errorDescription ?? oauthError ?? 'Sign-in was cancelled.');
        }
        redirectTimer = setTimeout(() => active && router.replace(loginRouteForPortal('gc')), 2200);
        return;
      }

      if (type === 'recovery' && code) {
        clearAuthUrlParams();
        redirectTimer = setTimeout(
          () => active && router.replace(`/(auth)/reset-password?code=${encodeURIComponent(code)}`),
          0,
        );
        return;
      }

      if (!code) {
        clearAuthUrlParams();
        if (active) {
          setIsError(true);
          setMessage('Missing sign-in confirmation code.');
        }
        redirectTimer = setTimeout(() => active && router.replace(loginRouteForPortal('gc')), 2200);
        return;
      }

      const { data: existing, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        clearAuthUrlParams();
        if (active) {
          setIsError(true);
          setMessage(sessionError.message);
        }
        redirectTimer = setTimeout(() => active && router.replace(loginRouteForPortal('gc')), 2200);
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
          redirectTimer = setTimeout(() => active && router.replace(loginRouteForPortal('gc')), 2200);
          return;
        }
        session = data.session;
      } else {
        clearAuthUrlParams();
      }

      if (!session) {
        if (active) {
          setIsError(true);
          setMessage('Could not establish a session.');
        }
        redirectTimer = setTimeout(() => active && router.replace(loginRouteForPortal('gc')), 2200);
        return;
      }

      const result = await finalizeOAuthSession(session);
      if (!result.ok) {
        if (active) {
          setIsError(true);
          setMessage(result.message);
        }
        redirectTimer = setTimeout(
          () => active && router.replace(loginRouteForPortal(result.returnPortal)),
          2200,
        );
        return;
      }

      if (active) setMessage('Signed in. Finishing setup…');
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
