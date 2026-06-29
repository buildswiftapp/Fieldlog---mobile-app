import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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
import { clearAuthUrlParams, readAuthUrlParams } from '@/lib/authLinking';
import { forgotPasswordRouteForPortal, loginRouteForPortal } from '@/lib/roles';
import { supabase } from '@/lib/supabase';
import { palette, radius } from '@/theme';

type Stage = 'verifying' | 'form' | 'done' | 'error';

export default function ResetPassword() {
  const params = useLocalSearchParams<{ code?: string }>();
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

    async function init() {
      if (started.current) return;
      started.current = true;

      const urlParams = readAuthUrlParams();
      const code = typeof params.code === 'string' ? params.code : urlParams.code;
      try {
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          clearAuthUrlParams();
          if (exchangeError) throw exchangeError;
          if (active) {
            handled.current = true;
            setStage('form');
          }
          return;
        }

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

    void init();

    const timeout = setTimeout(() => {
      if (active && !handled.current) {
        setError('This reset link is invalid or has expired. Request a new one below.');
        setStage('error');
      }
    }, 12000);

    return () => {
      active = false;
      sub.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [params.code]);

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
                  Your password has been updated. You can now sign in with your new password.
                </Text>
              </View>
              <Button
                label="Continue to app"
                onPress={() => router.replace('/')}
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
