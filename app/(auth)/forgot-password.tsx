import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Btn, Field } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { getAuthRedirectUrl } from '@/lib/authLinking';
import { friendlyAuthError } from '@/lib/authErrors';
import { saveSignupPortal } from '@/lib/pendingSignup';
import { type MobilePortal } from '@/lib/roles';
import { palette, roleThemes } from '@/theme';

export default function ForgotPassword() {
  const router = useRouter();
  const params = useLocalSearchParams<{ portal?: string }>();
  const portal: MobilePortal = params.portal === 'sub' ? 'sub' : 'gc';
  const theme = roleThemes[portal];
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    if (!email.trim()) {
      setError('Enter your email address.');
      return;
    }
    setError(null)
    setLoading(true);
    try {
      await saveSignupPortal(portal);
      const { error: e } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: getAuthRedirectUrl('auth-callback'),
      });
      if (e) throw e;
      setSent(true);
    } catch (e) {
      setError(friendlyAuthError(e instanceof Error ? e.message : 'Could not send reset email.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.brand}>
          <Text style={styles.word}>
            <Text style={{ color: theme.accent }}>Field</Text>
            <Text style={{ color: palette.tx }}>Log</Text>
          </Text>
          <Text style={styles.tagline}>Reset your password</Text>
        </View>
        {sent ? (
          <View style={styles.success}>
            <Text style={styles.successText}>
              If an account exists for <Text style={{ color: palette.tx, fontWeight: '600' }}>{email.trim()}</Text>, a
              reset link was sent. Check your inbox and spam folder.
            </Text>
          </View>
        ) : null}
        <Field label="Email" placeholder="you@company.com" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Btn
          label={loading ? 'Sending…' : sent ? 'Resend reset email' : 'Send reset email'}
          loading={loading}
          onPress={send}
          accent={theme.accent}
          onAccent={theme.onAccent}
        />
        <Text style={styles.footer}>
          Remember your password?{' '}
          <Text style={{ color: palette.blueLight, fontWeight: '500' }} onPress={() => router.back()}>
            Back to sign in
          </Text>
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 28 },
  brand: { alignItems: 'center', marginBottom: 26 },
  word: { fontSize: 24, fontWeight: '700', marginBottom: 6 },
  tagline: { fontSize: 12.5, color: palette.tx2 },
  error: { color: palette.red, fontSize: 12, marginBottom: 12 },
  footer: { textAlign: 'center', marginTop: 18, fontSize: 12, color: palette.tx2 },
  success: {
    backgroundColor: palette.greenDim,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.22)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  successText: { fontSize: 12, color: palette.tx2, lineHeight: 18 },
});
