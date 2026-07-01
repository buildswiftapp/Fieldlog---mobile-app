import { Redirect } from 'expo-router';
import { BrandLoader } from '@/components/BrandLoader';
import { useAuth } from '@/context/AuthContext';
import { homeRouteForPortal, resolveUserType } from '@/lib/roles';

export default function Index() {
  const { initializing, session, profile, organization } = useAuth();

  if (initializing) {
    return <BrandLoader message="Setting up your site…" sub="AI daily logs for the field" />;
  }
  if (!session) return <Redirect href="/(auth)/login" />;

  const userType = resolveUserType(session, profile, organization);
  if (userType === 'sub') return <Redirect href={homeRouteForPortal('sub')} />;
  if (userType === 'gc') return <Redirect href={homeRouteForPortal('gc')} />;
  return <Redirect href="/(auth)/onboarding" />;
}
