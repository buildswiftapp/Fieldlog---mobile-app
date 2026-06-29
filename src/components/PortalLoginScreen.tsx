import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Field } from '@/components/ui';
import { AuthOrDivider } from '@/components/AuthOrDivider';
import { LegalLinks } from '@/components/LegalLinks';
import { SsoButtons, showSsoForPortal } from '@/components/SsoButtons';
import { MicIcon } from '@/components/icons';
import { useAuth } from '@/context/AuthContext';
import { forgotPasswordRouteForPortal, loginRouteForPortal, signupRouteForPortal, type MobilePortal } from '@/lib/roles';
import { palette, radius, roleThemes } from '@/theme';

type Props = {
  portal: MobilePortal;
};

export function PortalLoginScreen({ portal }: Props) {
  const { signIn } = useAuth();
  const theme = roleThemes[portal];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await signIn(email, password, portal);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const otherPortal: MobilePortal = portal === 'gc' ? 'sub' : 'gc';

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {portal === 'gc' ? (
            <View style={styles.brand}>
              <Text style={styles.kicker}>BYLDGO</Text>
              <Text style={styles.wordmark}>
                <Text style={{ color: palette.orange }}>Field</Text>
                <Text style={{ color: palette.tx }}>Log</Text>
              </Text>
              <Text style={styles.tagline}>AI Daily Logs for Contractors</Text>
            </View>
          ) : (
            <View style={styles.subBrand}>
              <View style={[styles.subMark, { backgroundColor: theme.accentDim, borderColor: theme.accent }]}>
                <MicIcon color={theme.accent} size={26} />
              </View>
              <Text style={[styles.subTitle, { color: palette.tx }]}>FieldLog</Text>
              <Text style={styles.subTagline}>Subcontractor Portal</Text>
            </View>
          )}

          {showSsoForPortal(portal) ? (
            <>
              <SsoButtons mode="login" portal={portal} />
              <AuthOrDivider />
            </>
          ) : null}


          <Field
            label="Email"
            placeholder="you@company.com"
            keyboardType="email-address"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
          />
          <Field
            label="Password"
            placeholder="••••••••"
            secureTextEntry
            autoComplete="password"
            value={password}
            onChangeText={setPassword}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Text style={styles.forgot}>
            <Link
              href={
                `${forgotPasswordRouteForPortal(portal)}${email ? `?email=${encodeURIComponent(email)}` : ''}` as '/'
              }
              style={styles.link}
            >
              Forgot password?
            </Link>
          </Text>

          <Button
            label={portal === 'gc' ? 'Log In' : 'Sign In'}
            onPress={onSubmit}
            loading={loading}
            accent={theme.accent}
            onAccent={theme.onAccent}
          />

          <Text style={styles.footer}>
            {portal === 'gc' ? "Don't have an account? " : 'New subcontractor? '}
            <Link href={signupRouteForPortal(portal)} style={styles.link}>
              {portal === 'gc' ? 'Create one' : 'Create free account'}
            </Link>
          </Text>

          <Text style={styles.switchPortal}>
            {otherPortal === 'sub' ? 'Subcontractor?' : 'General contractor?'}{' '}
            <Link href={loginRouteForPortal(otherPortal)} style={styles.link}>
              {otherPortal === 'sub' ? 'Go to Sub Portal' : 'Go to GC Portal'}
            </Link>
          </Text>

          {portal === 'sub' ? (
            <View style={styles.note}>
              <Text style={styles.noteText}>
                Sub accounts are always free. You only see projects your GC has assigned to you.
              </Text>
            </View>
          ) : null}

          {portal === 'gc' ? <LegalLinks compact portal="gc" /> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingTop: 8, paddingBottom: 32 },
  brand: { alignItems: 'center', marginBottom: 24 },
  kicker: { fontSize: 13, fontWeight: '700', letterSpacing: 1.5, color: palette.tx3, marginBottom: 4 },
  wordmark: { fontSize: 26, fontWeight: '700' },
  tagline: { fontSize: 12, color: palette.tx3, marginTop: 5 },
  portalHint: {
    fontSize: 11.5,
    color: palette.tx3,
    textAlign: 'center',
    marginBottom: 22,
    lineHeight: 17,
  },
  subBrand: { alignItems: 'center', marginBottom: 24 },
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
  subTagline: { fontSize: 12.5, color: palette.tx2 },
  error: { color: palette.red, fontSize: 12.5, marginBottom: 12, lineHeight: 18 },
  forgot: { fontSize: 11.5, textAlign: 'right', marginTop: -2, marginBottom: 16 },
  footer: { textAlign: 'center', marginTop: 18, fontSize: 12, color: palette.tx2 },
  switchPortal: { textAlign: 'center', marginTop: 14, fontSize: 11.5, color: palette.tx3 },
  link: { color: palette.blueLight, fontWeight: '500' },
  note: {
    marginTop: 20,
    padding: 13,
    backgroundColor: palette.bg2,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.lg,
  },
  noteText: { fontSize: 11, color: palette.tx3, lineHeight: 17, textAlign: 'center' },
});
