import { Link, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppModeToggle, type AppMode } from '@/components/AppModeToggle';
import { Button, Field } from '@/components/ui';
import { MicIcon } from '@/components/icons';
import { supabase } from '@/lib/supabase';
import { palette, radius, roleThemes } from '@/theme';

const RESEND_SECONDS = 60;

export default function ForgotPassword() {
  const params = useLocalSearchParams<{ mode?: string; email?: string }>();
  const [mode, setMode] = useState<AppMode>('gc');
  const [email, setEmail] = useState(typeof params.email === 'string' ? params.email : '');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const theme = roleThemes[mode];

  useEffect(() => {
    if (params.mode === 'sub') setMode('sub');
    if (params.mode === 'gc') setMode('gc');
  }, [params.mode]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((value) => (value <= 1 ? 0 : value - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  async function sendReset() {
    if (!email.trim()) {
      setError('Enter your email address.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: 'fieldlog://reset-password',
      });
      if (resetError) {
        setError(resetError.message);
        return;
      }
      setSent(true);
      setCooldown(RESEND_SECONDS);
    } catch {
      setError('Could not reach Supabase. Check your network connection.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <AppModeToggle mode={mode} onChange={setMode} />

          {mode === 'gc' ? (
            <View style={styles.brand}>
              <Text style={styles.kicker}>BYLDGO</Text>
              <Text style={styles.wordmark}>
                <Text style={{ color: palette.orange }}>Field</Text>
                <Text style={{ color: palette.tx }}>Log</Text>
              </Text>
              <Text style={styles.tagline}>Reset your GC password</Text>
            </View>
          ) : (
            <View style={styles.subBrand}>
              <View style={[styles.subMark, { backgroundColor: theme.accentDim, borderColor: theme.accent }]}>
                <MicIcon color={theme.accent} size={26} />
              </View>
              <Text style={[styles.subTitle, { color: palette.tx }]}>FieldLog</Text>
              <Text style={styles.subTagline}>Reset your subcontractor password</Text>
            </View>
          )}

          {sent ? (
            <View style={styles.success}>
              <Text style={styles.successText}>
                If an account exists for <Text style={{ color: palette.tx, fontWeight: '600' }}>{email.trim()}</Text>, a
                reset link was sent. Check your inbox and spam folder.
              </Text>
            </View>
          ) : null}

          <Field
            label="Email"
            placeholder="you@company.com"
            keyboardType="email-address"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            label={
              loading
                ? 'Sending…'
                : sent
                  ? cooldown > 0
                    ? `Resend in ${cooldown}s`
                    : 'Resend reset email'
                  : 'Send reset email'
            }
            onPress={sendReset}
            loading={loading}
            disabled={sent && cooldown > 0}
            accent={theme.accent}
            onAccent={theme.onAccent}
          />

          <Text style={styles.footer}>
            Remember your password?{' '}
            <Link href={`/(auth)/login?mode=${mode}`} style={styles.link}>
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
  brand: { alignItems: 'center', marginBottom: 28 },
  kicker: { fontSize: 13, fontWeight: '700', letterSpacing: 1.5, color: palette.tx3, marginBottom: 4 },
  wordmark: { fontSize: 22, fontWeight: '700' },
  tagline: { fontSize: 12, color: palette.tx3, marginTop: 5 },
  subBrand: { alignItems: 'center', marginBottom: 28 },
  subMark: {
    width: 54,
    height: 54,
    borderRadius: radius.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  subTitle: { fontSize: 19, fontWeight: '600', marginBottom: 3 },
  subTagline: { fontSize: 12.5, color: palette.tx2, textAlign: 'center' },
  success: {
    backgroundColor: palette.greenDim,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.22)',
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 14,
  },
  successText: { fontSize: 12, color: palette.tx2, lineHeight: 18 },
  error: { color: palette.red, fontSize: 12, marginBottom: 12 },
  footer: { textAlign: 'center', marginTop: 18, fontSize: 12, color: palette.tx2 },
  link: { color: palette.blueLight, fontWeight: '500' },
});
