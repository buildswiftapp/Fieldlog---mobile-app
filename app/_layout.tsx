import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BrandLoader } from '@/components/BrandLoader';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { roleThemes } from '@/theme';

const SESSION_AUTH_ROUTES = new Set(['reset-password', 'auth-callback', 'onboarding']);

function homeForRole(userType: string | undefined) {
  if (userType === 'sub') return '/(sub)/home';
  return '/(gc)/home';
}

function RootNavigator() {
  const { initializing, profileLoading, session, profile, organization } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (initializing || (session && profileLoading)) return;

    const group = segments[0];
    const authScreen = segments[1];
    const inAuth = group === '(auth)';
    const onSessionAuthRoute = inAuth && typeof authScreen === 'string' && SESSION_AUTH_ROUTES.has(authScreen);

    if (!session) {
      if (!inAuth) router.replace('/(auth)/login');
      return;
    }

    if (onSessionAuthRoute) return;

    if (profile?.user_type === 'owner') {
      router.replace('/(auth)/login');
      return;
    }

    if (inAuth && authScreen === 'onboarding') {
      if (organization) router.replace(homeForRole(profile?.user_type));
      return;
    }

    if (profile && !organization) {
      router.replace('/(auth)/onboarding');
      return;
    }

    if (inAuth) {
      router.replace(homeForRole(profile?.user_type));
      return;
    }

    const role = profile?.user_type;
    if (!role) return;

    const targetGroup = role === 'sub' ? '(sub)' : '(gc)';
    if (group !== targetGroup) {
      router.replace(homeForRole(role));
    }
  }, [initializing, profileLoading, session, profile, organization, segments, router]);

  if (initializing || (session && profileLoading && !profile)) {
    const accent = profile?.user_type === 'sub' ? roleThemes.sub.accent : roleThemes.gc.accent;
    return <BrandLoader accent={accent} message="Setting up your site…" sub="AI daily logs for the field" />;
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
