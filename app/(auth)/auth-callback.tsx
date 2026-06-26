import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { BrandLoader } from '@/components/BrandLoader';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const params = useLocalSearchParams<{ code?: string; error_description?: string }>();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function run() {
      const code = typeof params.code === 'string' ? params.code : null;
      const errorDescription =
        typeof params.error_description === 'string' ? params.error_description : null;

      if (errorDescription) {
        if (active) setError(errorDescription);
        setTimeout(() => active && router.replace('/(auth)/login'), 2200);
        return;
      }

      if (!code) {
        router.replace('/(auth)/login');
        return;
      }

      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) {
        if (active) setError(exchangeError.message);
        setTimeout(() => active && router.replace('/(auth)/login'), 2200);
        return;
      }

      router.replace('/');
    }

    void run();
    return () => {
      active = false;
    };
  }, [params.code, params.error_description, router]);

  return <BrandLoader message={error ?? 'Signing you in…'} sub={error ? 'Returning to sign in…' : undefined} />;
}
