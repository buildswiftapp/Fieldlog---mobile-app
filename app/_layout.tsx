import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { palette } from '@/theme';

function RootNavigator() {
  const { initializing, session, profile } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (initializing) return;

    const group = segments[0];
    const inAuth = group === '(auth)';

    if (!session) {
      if (!inAuth) router.replace('/(auth)/login');
      return;
    }

    const role = profile?.user_type ?? 'gc';
    const target = role === 'sub' ? '(sub)' : '(gc)';
    if (group !== target) {
      router.replace(role === 'sub' ? '/(sub)/home' : '/(gc)/home');
    }
  }, [initializing, session, profile, segments, router]);

  if (initializing) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={palette.orange} />
      </View>
    );
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
