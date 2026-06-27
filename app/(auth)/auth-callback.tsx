import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { BrandLoader } from '@/components/BrandLoader';
import { supabase } from '@/lib/supabase';
import { consumePendingUserType } from '@/lib/pendingAuth';

export default function AuthCallback() {
  const params = useLocalSearchParams<{ code?: string; error?: string; error_description?: string }>();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    let active = true;

    async function run() {
      if (started.current) return;
      started.current = true;

      const code = typeof params.code === 'string' ? params.code : null;
      const oauthError = typeof params.error === 'string' ? params.error : null;
      const errorDescription =
        typeof params.error_description === 'string' ? params.error_description : null;

      if (oauthError || errorDescription) {
        await consumePendingUserType();
        if (active) setError(errorDescription ?? oauthError ?? 'Sign-in was cancelled.');
        setTimeout(() => active && router.replace('/(auth)/login'), 2200);
        return;
      }

      if (!code) {
        await consumePendingUserType();
        router.replace('/(auth)/login');
        return;
      }

      const { data: existing } = await supabase.auth.getSession();
      if (existing.session) {
        await consumePendingUserType();
        router.replace('/');
        return;
      }

      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) {
        await consumePendingUserType();
        if (active) setError(exchangeError.message);
        setTimeout(() => active && router.replace('/(auth)/login'), 2200);
        return;
      }

      const pendingType = await consumePendingUserType();
      if (pendingType && data.session?.user) {
        await supabase.from('profiles').update({ user_type: pendingType }).eq('id', data.session.user.id);
      }

      router.replace('/');
    }

    void run();
    return () => {
      active = false;
    };
  }, [params.code, params.error, params.error_description, router]);

  return <BrandLoader message={error ?? 'Signing you in…'} sub={error ? 'Returning to sign in…' : undefined} />;
}
