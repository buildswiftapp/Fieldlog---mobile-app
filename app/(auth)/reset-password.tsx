import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import * as Linking from 'expo-linking';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandLoader } from '@/components/BrandLoader';
import { Button, Field } from '@/components/ui';
import { clearAuthUrlParams, mergeAuthParams, readAuthUrlParams, type AuthUrlParams } from '@/lib/authLinking';
import {
  establishAuthSessionFromParams,
  hasAuthPayload,
  parseAuthUrl,
  readNativeLinkingAuthUrl,
  type ParsedAuthUrl,
} from '@/lib/authSession';
import { forgotPasswordRouteForPortal, loginRouteForPortal } from '@/lib/roles';
import { supabase } from '@/lib/supabase';
import { palette, radius } from '@/theme';

type Stage = 'verifying' | 'form' | 'done' | 'error';

function paramsFromRouter(params: Record<string, string | string[] | undefined>): AuthUrlParams {
  const pick = (key: string) => {
    const value = params[key];
    return typeof value === 'string' ? value : null;
  };
  return {
    code: pick('code'),
    error: pick('error'),
    errorDescription: pick('error_description'),
    type: pick('type'),
  };
}

function toParsed(params: AuthUrlParams, linkingUrl: string | null): ParsedAuthUrl {
  const fromLink = linkingUrl ? parseAuthUrl(linkingUrl) : null;
  const merged = mergeAuthParams(params, fromLink ?? undefined, readAuthUrlParams());
  return {
    ...merged,
    accessToken: fromLink?.accessToken ?? null,
    refreshToken: fromLink?.refreshToken ?? null,
    tokenHash: fromLink?.tokenHash ?? null,
  };
}

export default function ResetPassword() {
  const params = useLocalSearchParams<{
    code?: string;
    error?: string;
    error_description?: string;
    type?: string;
  }>();
  const router = useRouter();
  const [stage, setStage] = useState<Stage>('verifying');
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const handled = useRef(false);
  const started = useRef(false);

  useEffect(() => {
    let active = true;

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active || handled.current) return;
      if (event === 'PASSWORD_RECOVERY' && session) {
        handled.current = true;
        setStage('form');
      }
    });

    async function verifyFromParams(linkingUrl: string | null) {
      const parsed = toParsed(paramsFromRouter(params), linkingUrl);
      if (!hasAuthPayload(parsed)) return false;

      const result = await establishAuthSessionFromParams(supabase, parsed);
      clearAuthUrlParams();
      if (!result.ok) throw new Error(result.message);
      if (active) {
        handled.current = true;
        setStage('form');
      }
      return true;
    }

    async function init(linkingUrl: string | null) {
      if (started.current) return;
      started.current = true;

      try {
        const verified = await verifyFromParams(linkingUrl);
        if (verified) return;

        const { data } = await supabase.auth.getSession();
        if (data.session?.user?.recovery_sent_at && active) {
          handled.current = true;
          setStage('form');
        }
      } catch (e) {
        if (active) {
          setError(e instanceof Error ? e.message : 'This reset link is invalid or has expired.');
          setStage('error');
        }
      }
    }

    void readNativeLinkingAuthUrl().then((initialUrl) => {
      if (active) void init(initialUrl);
    });

    const linkSub = Linking.addEventListener('url', ({ url }) => {
      if (!active || handled.current) return;
      void verifyFromParams(url).catch((e) => {
        if (active) {
          setError(e instanceof Error ? e.message : 'This reset link is invalid or has expired.');
          setStage('error');
        }
      });
    });

    const timeout = setTimeout(() => {
      if (active && !handled.current) {
        setError('This reset link is invalid or has expired. Request a new one below.');
        setStage('error');
      }
    }, 15000);

    return () => {
      active = false;
      sub.subscription.unsubscribe();
      linkSub.remove();
      clearTimeout(timeout);
    };
  }, [params.code, params.error, params.error_description, params.type]);

  async function onSubmit() {
    if (password.length < 8) {
      Alert.alert('Weak password', 'Use at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Passwords do not match', 'Re-enter the same password in both fields.');
      return;
    }
    setSaving(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      await supabase.auth.signOut();
      setStage('done');
    } catch (e) {
      Alert.alert('Could not update password', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (stage === 'verifying') {
    return <BrandLoader accent={palette.blue} message="Verifying your reset link…" />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <Text style={styles.wordmark}>
              <Text style={{ color: palette.blue }}>Field</Text>
              <Text style={{ color: palette.tx }}>Log</Text>
            </Text>
            <Text style={styles.tagline}>
              {stage === 'done' ? 'Password updated' : stage === 'error' ? 'Reset link problem' : 'Set a new password'}
            </Text>
          </View>

          {stage === 'form' ? (
            <>
              <Field
                label="New password"
                placeholder="At least 8 characters"
                secureTextEntry
                autoComplete="new-password"
                value={password}
                onChangeText={setPassword}
              />
              <Field
                label="Confirm new password"
                placeholder="Re-enter your password"
                secureTextEntry
                autoComplete="new-password"
                value={confirm}
                onChangeText={setConfirm}
              />
              <Button
                label={saving ? 'Saving…' : 'Update password'}
                onPress={onSubmit}
                loading={saving}
                accent={palette.blue}
                onAccent="#FFFFFF"
              />
            </>
          ) : null}

          {stage === 'done' ? (
            <>
              <View style={styles.success}>
                <Text style={styles.successText}>
                  Your password has been updated. Sign in with your new password.
                </Text>
              </View>
              <Button
                label="Continue to sign in"
                onPress={() => router.replace(loginRouteForPortal('gc'))}
                accent={palette.blue}
                onAccent="#FFFFFF"
              />
            </>
          ) : null}

          {stage === 'error' ? (
            <>
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Button
                label="Request a new reset link"
                onPress={() => router.replace(forgotPasswordRouteForPortal('gc'))}
                accent={palette.blue}
                onAccent="#FFFFFF"
              />
            </>
          ) : null}

          <Text style={styles.footer}>
            Remember your password?{' '}
            <Link href={loginRouteForPortal('gc')} style={styles.link}>
              Back to sign in
            </Link>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 32 },
  brand: { alignItems: 'center', marginBottom: 26 },
  wordmark: { fontSize: 24, fontWeight: '700', marginBottom: 6 },
  tagline: { fontSize: 12.5, color: palette.tx2 },
  success: {
    backgroundColor: palette.greenDim,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.22)',
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 14,
  },
  successText: { fontSize: 12.5, color: palette.tx2, lineHeight: 18 },
  error: { color: palette.red, fontSize: 12.5, marginBottom: 14, lineHeight: 18 },
  footer: { textAlign: 'center', marginTop: 18, fontSize: 12, color: palette.tx2 },
  link: { color: palette.blueLight, fontWeight: '500' },
});
