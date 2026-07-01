import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Btn, Field } from '@/components/ui';
import { WebAutofillTrap } from '@/components/WebAutofillTrap';
import { GoogleIcon, MicrosoftIcon, MicIcon } from '@/components/icons';
import { useAuth } from '@/context/AuthContext';
import { friendlyAuthError } from '@/lib/authErrors';
import { homeRouteForPortal, type MobilePortal } from '@/lib/roles';
import { palette, roleThemes } from '@/theme';

export default function Login() {
  const router = useRouter();
  const params = useLocalSearchParams<{ portal?: string; verified?: string }>();
  const { signIn } = useAuth();
  const [portal, setPortal] = useState<MobilePortal>(params.portal === 'sub' ? 'sub' : 'gc');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const verified = params.verified === '1';
  const theme = roleThemes[portal];

  async function onSubmit() {
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await signIn(email, password, portal);
      router.replace(homeRouteForPortal(res.userType));
    } catch (e) {
      setError(friendlyAuthError(e instanceof Error ? e.message : 'Could not sign in.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          
          <View style={styles.toggle}>
            <Pressable
              style={[styles.toggleItem, portal === 'gc' && { backgroundColor: palette.orangeDim }]}
              onPress={() => setPortal('gc')}
            >
              <Text style={[styles.toggleText, { color: portal === 'gc' ? palette.orange : palette.tx2 }]}>
                General Contractor
              </Text>
            </Pressable>
            <Pressable
              style={[styles.toggleItem, portal === 'sub' && { backgroundColor: palette.purpleDim }]}
              onPress={() => setPortal('sub')}
            >
              <Text style={[styles.toggleText, { color: portal === 'sub' ? palette.purple : palette.tx2 }]}>
                Subcontractor
              </Text>
            </Pressable>
          </View>

          {portal === 'gc' ? (
            <View style={styles.brand}>
              <Text style={styles.kicker}>BYLDGO</Text>
              <Text style={styles.word}>
                <Text style={{ color: palette.orange }}>Field</Text>
                <Text style={{ color: palette.tx }}>Log</Text>
              </Text>
              <Text style={styles.tagline}>AI Daily Logs for Contractors</Text>
            </View>
          ) : (
            <View style={styles.brand}>
              <View style={styles.subMark}>
                <MicIcon size={26} color={palette.purple} />
              </View>
              <Text style={styles.subTitle}>FieldLog</Text>
              <Text style={styles.tagline}>Subcontractor Portal</Text>
            </View>
          )}

          {portal === 'gc' ? (
            <>
              <Btn
                label="Continue with Google"
                variant="secondary"
                icon={<GoogleIcon size={16} />}
                style={{ marginBottom: 9 }}
                textStyle={{ fontWeight: '500' }}
                onPress={() => setError('Enable Google in Supabase Auth to use SSO.')}
              />
              <Btn
                label="Continue with Microsoft"
                variant="secondary"
                icon={<MicrosoftIcon size={15} />}
                style={{ marginBottom: 18 }}
                textStyle={{ fontWeight: '500' }}
                onPress={() => setError('Enable Microsoft in Supabase Auth to use SSO.')}
              />
              <View style={styles.orRow}>
                <View style={styles.orLine} />
                <Text style={styles.orText}>OR</Text>
                <View style={styles.orLine} />
              </View>
            </>
          ) : null}

          {verified ? (
            <View style={styles.verified}>
              <Text style={styles.verifiedText}>
                Your email is confirmed. Sign in with the password you created.
              </Text>
            </View>
          ) : null}

          <WebAutofillTrap />
          <Field label="Email" placeholder="you@company.com" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} accent={theme.accent} />
          <Field label="Password" placeholder="••••••••" secureTextEntry value={password} onChangeText={setPassword} accent={theme.accent} />

          <Text
            style={styles.forgot}
            onPress={() => router.push({ pathname: '/(auth)/forgot-password', params: { portal } })}
          >
            Forgot password?
          </Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Btn
            label={loading ? 'Signing in…' : portal === 'gc' ? 'Log In' : 'Sign In'}
            loading={loading}
            onPress={onSubmit}
            accent={theme.accent}
            onAccent={theme.onAccent}
            style={{ paddingVertical: 13 }}
          />

          <Text style={styles.footer}>
            {portal === 'gc' ? "Don't have an account? " : 'New subcontractor? '}
            <Text
              style={{ color: palette.blueLight, fontWeight: '500' }}
              onPress={() => router.push({ pathname: '/(auth)/signup', params: { portal } })}
            >
              {portal === 'gc' ? 'Create one' : 'Create free account'}
            </Text>
          </Text>

          {portal === 'sub' ? (
            <View style={styles.subNote}>
              <Text style={styles.subNoteText}>
                Sub accounts are always free. You only see projects your GC has assigned to you.
              </Text>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 28 },
  toggle: {
    flexDirection: 'row',
    backgroundColor: palette.bg2,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 10,
    padding: 3,
    marginBottom: 30,
  },
  toggleItem: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  toggleText: { fontSize: 12, fontWeight: '600' },
  brand: { alignItems: 'center', marginBottom: 30 },
  kicker: { fontSize: 13, fontWeight: '700', letterSpacing: 0.8, color: palette.tx3, marginBottom: 4 },
  word: { fontSize: 24, fontWeight: '700' },
  tagline: { fontSize: 12, color: palette.tx3, marginTop: 5 },
  subMark: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: palette.purpleDim,
    borderWidth: 1,
    borderColor: palette.purple,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  subTitle: { fontSize: 19, fontWeight: '600', color: palette.tx, marginBottom: 3 },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 },
  orLine: { flex: 1, height: 1, backgroundColor: palette.border2 },
  orText: { fontSize: 10.5, color: palette.tx3 },
  forgot: { textAlign: 'right', fontSize: 11.5, color: palette.blueLight, marginTop: -2, marginBottom: 16 },
  verified: {
    backgroundColor: palette.greenDim,
    borderWidth: 1,
    borderColor: palette.green,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  verifiedText: { color: palette.tx2, fontSize: 12, lineHeight: 17, textAlign: 'center' },
  error: { color: palette.red, fontSize: 12, marginBottom: 12 },
  footer: { textAlign: 'center', marginTop: 18, fontSize: 12.5, color: palette.tx2 },
  subNote: {
    marginTop: 28,
    padding: 13,
    backgroundColor: palette.bg2,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 12,
  },
  subNoteText: { fontSize: 11, color: palette.tx3, lineHeight: 17, textAlign: 'center' },
});
