import { Redirect, useGlobalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { BrandLoader } from '@/components/BrandLoader';
import { useAuth } from '@/context/AuthContext';
import { authCallbackHref, readAuthUrlParams, resetPasswordHref } from '@/lib/authLinking';
import { homeRouteForPortal, loginRouteForPortal, resolveUserType } from '@/lib/roles';

export default function Index() {
  const { session, profile, profileLoading, organization } = useAuth();
  const router = useRouter();
  const globalParams = useGlobalSearchParams<{ code?: string; type?: string }>();
  const urlParams = readAuthUrlParams();
  const authCode =
    (typeof globalParams.code === 'string' ? globalParams.code : null) ?? urlParams.code;
  const authType =
    (typeof globalParams.type === 'string' ? globalParams.type : null) ?? urlParams.type;
  const userType = resolveUserType(session, profile, organization);

  useEffect(() => {
    if (!authCode) return;
    router.replace(
      (authType === 'recovery' ? resetPasswordHref(authCode) : authCallbackHref(authCode, authType)) as '/',
    );
  }, [authCode, authType, router]);

  if (authCode) {
    return <BrandLoader message="Confirming your email…" sub="AI daily logs for the field" />;
  }

  if (!session) return <Redirect href={loginRouteForPortal('gc')} />;
  if (profileLoading && !organization) {
    return <BrandLoader message="Loading your account…" sub="AI daily logs for the field" />;
  }
  if (userType === 'owner') return <Redirect href={loginRouteForPortal('gc')} />;
  if (!organization) return <Redirect href="/(auth)/onboarding" />;
  if (userType !== 'gc' && userType !== 'sub') return <Redirect href="/(auth)/onboarding" />;

  return <Redirect href={homeRouteForPortal(userType)} />;
}
