import * as Linking from 'expo-linking';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { getAuthRedirectUrl } from '@/lib/authLinking';
import { saveOAuthPortal } from '@/lib/oauthIntent';
import type { MobilePortal } from '@/lib/roles';
import { supabase } from '@/lib/supabase';
import { palette, radius } from '@/theme';

type Provider = 'google';
type SsoMode = 'login' | 'signup';

type Props = {
  mode?: SsoMode;
  portal: MobilePortal;
};

export function showSsoForPortal(portal: MobilePortal) {
  return portal === 'gc';
}

async function startOAuth(provider: Provider, portal: MobilePortal) {
  await saveOAuthPortal(portal);
  const redirectTo = getAuthRedirectUrl('/auth-callback');

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      queryParams: { prompt: 'select_account' },
    },
  });
  if (error) throw error;
  if (!data?.url) throw new Error('Could not start social sign-in.');

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.location.assign(data.url);
    return;
  }

  await Linking.openURL(data.url);
}

export function SsoButtons({ mode = 'login', portal }: Props) {
  const [busy, setBusy] = useState(false);
  const verb = mode === 'signup' ? 'Sign up with' : 'Continue with';

  if (!showSsoForPortal(portal)) return null;

  async function onPress() {
    if (busy) return;
    setBusy(true);
    try {
      await startOAuth('google', portal);
    } catch (e) {
      Alert.alert(
        `Google ${mode === 'signup' ? 'sign-up' : 'sign-in'} unavailable`,
        e instanceof Error
          ? e.message
          : `Enable Google in your Supabase Auth settings and add ${getAuthRedirectUrl('/auth-callback')} to Redirect URLs.`,
      );
    } finally {
      if (Platform.OS !== 'web') setBusy(false);
    }
  }

  return (
    <View style={styles.group}>
      <Pressable
        style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
        disabled={busy}
        onPress={onPress}
      >
        {busy ? (
          <ActivityIndicator size="small" color={palette.tx} />
        ) : (
          <Svg width={16} height={16} viewBox="0 0 24 24">
            <Path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <Path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <Path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <Path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </Svg>
        )}
        <Text style={styles.label}>{verb} Google</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: 9 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    paddingVertical: 11,
    minHeight: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border2,
    backgroundColor: 'transparent',
  },
  btnPressed: { backgroundColor: palette.bg3, borderColor: palette.blue },
  label: { color: palette.tx, fontSize: 13, fontWeight: '500' },
});
