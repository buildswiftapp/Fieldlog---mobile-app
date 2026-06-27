import { Redirect } from 'expo-router';
import { BrandLoader } from '@/components/BrandLoader';
import { useAuth } from '@/context/AuthContext';

export default function Index() {
  const { session, profile, profileLoading, organization } = useAuth();

  if (!session) return <Redirect href="/(auth)/login" />;
  if (profileLoading || !profile) return <BrandLoader message="Loading your account…" />;
  if (profile.user_type === 'owner') return <Redirect href="/(auth)/login" />;
  if (!organization) return <Redirect href="/(auth)/onboarding" />;

  return <Redirect href={profile.user_type === 'sub' ? '/(sub)/home' : '/(gc)/home'} />;
}
