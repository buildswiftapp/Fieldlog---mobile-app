import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function Index() {
  const { session, profile } = useAuth();
  if (!session) return <Redirect href="/(auth)/login" />;
  return <Redirect href={profile?.user_type === 'sub' ? '/(sub)/home' : '/(gc)/home'} />;
}
