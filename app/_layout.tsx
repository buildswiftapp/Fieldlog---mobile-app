import { Slot, useGlobalSearchParams, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BrandLoader } from '@/components/BrandLoader';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { authCallbackHref, readAuthUrlParams, resetPasswordHref } from '@/lib/authLinking';
import { homeRouteForPortal, loginRouteForPortal, resolveUserType } from '@/lib/roles';
import { roleThemes } from '@/theme';

const SESSION_AUTH_ROUTES = new Set(['reset-password', 'auth-callback', 'onboarding']);

function RootNavigator() {
  const { initializing, verifying, profileLoading, session, profile, organization } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const globalParams = useGlobalSearchParams<{ code?: string; type?: string }>();
  const userType = resolveUserType(session, profile, organization);

  const urlParams = readAuthUrlParams();
  const authCode =
    (typeof globalParams.code === 'string' ? globalParams.code : null) ?? urlParams.code;
  const authType =
    (typeof globalParams.type === 'string' ? globalParams.type : null) ?? urlParams.type;

  useEffect(() => {
    if (initializing || verifying || profileLoading) return;

    const group = segments[0];
    const authScreen = segments[1];
    const inAuth = group === '(auth)';
    const onSessionAuthRoute = inAuth && typeof authScreen === 'string' && SESSION_AUTH_ROUTES.has(authScreen);

    if (authCode && !onSessionAuthRoute) {
      router.replace(
        (authType === 'recovery' ? resetPasswordHref(authCode) : authCallbackHref(authCode, authType)) as '/',
      );
      return;
    }

    if (!session) {
      if (!inAuth) router.replace(loginRouteForPortal('gc'));
      return;
    }

    if (onSessionAuthRoute) {
      if (inAuth && authScreen === 'onboarding' && organization && (userType === 'gc' || userType === 'sub')) {
        router.replace(homeRouteForPortal(userType));
        return;
      }
      if (inAuth && authScreen === 'auth-callback' && session) {
      } else {
        return;
      }
    }

    if (userType === 'owner') {
      router.replace(loginRouteForPortal('gc'));
      return;
    }

    if (!organization) {
      router.replace('/(auth)/onboarding');
      return;
    }

    if (inAuth) {
      if (userType === 'gc' || userType === 'sub') {
        router.replace(homeRouteForPortal(userType));
      }
      return;
    }

    if (userType !== 'gc' && userType !== 'sub') {
      router.replace('/(auth)/onboarding');
      return;
    }

    const targetGroup = userType === 'sub' ? '(sub)' : '(gc)';
    if (group !== targetGroup) {
      router.replace(homeRouteForPortal(userType));
    }
  }, [
    initializing,
    verifying,
    profileLoading,
    session,
    profile,
    organization,
    userType,
    segments,
    router,
    authCode,
    authType,
  ]);

  if (initializing) {
    const accent = userType === 'sub' ? roleThemes.sub.accent : roleThemes.gc.accent;
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
