import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Btn, Field } from '@/components/ui';
import { WebAutofillTrap } from '@/components/WebAutofillTrap';
import { MicIcon } from '@/components/icons';
import { useAuth } from '@/context/AuthContext';
import { friendlyAuthError } from '@/lib/authErrors';
import { type MobilePortal } from '@/lib/roles';
import { palette, roleThemes } from '@/theme';

export default function Signup() {
  const router = useRouter();
  const params = useLocalSearchParams<{ portal?: string }>();
  const portal: MobilePortal = params.portal === 'sub' ? 'sub' : 'gc';
  const theme = roleThemes[portal];
  const { signUp } = useAuth();

  const [company, setCompany] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [trade, setTrade] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit() {
    if (!company.trim() || !name.trim() || !email.trim() || !password) {
      setError('Fill in all fields to create your account.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signUp({
        email,
        password,
        fullName: name,
        companyName: company,
        userType: portal,
        trade: portal === 'sub' ? trade : undefined,
      });
      setSent(true);
    } catch (e) {
      setError(friendlyAuthError(e instanceof Error ? e.message : 'Could not create account.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {portal === 'gc' ? (
            <View style={styles.brand}>
              <Text style={styles.kicker}>BYLDGO</Text>
              <Text style={styles.word}>
                <Text style={{ color: palette.orange }}>Field</Text>
                <Text style={{ color: palette.tx }}>Log</Text>
              </Text>
              <Text style={styles.tagline}>Create your GC account</Text>
            </View>
          ) : (
            <View style={styles.brand}>
              <View style={styles.subMark}>
                <MicIcon size={26} color={palette.purple} />
              </View>
              <Text style={styles.subTitle}>Create Your Account</Text>
              <Text style={styles.tagline}>Free for subcontractors · invited by your GC</Text>
            </View>
          )}

          {sent ? (
            <View style={styles.success}>
              <Text style={styles.successText}>
                Check your inbox at <Text style={{ color: palette.tx, fontWeight: '600' }}>{email.trim()}</Text> and tap
                the confirmation link to finish creating your account, then sign in.
              </Text>
              <Btn
                label="Back to sign in"
                variant="secondary"
                style={{ marginTop: 12 }}
                onPress={() => router.replace({ pathname: '/(auth)/login', params: { portal } })}
              />
            </View>
          ) : (
            <>
              <WebAutofillTrap />
              <Field label="Company Name" placeholder={portal === 'sub' ? 'Mesa Electric' : 'Dawson Construction'} value={company} onChangeText={setCompany} accent={theme.accent} />
              <Field label={portal === 'sub' ? 'Your Name' : 'Full Name'} placeholder={portal === 'sub' ? 'Carlos Mendez' : 'Jake Dawson'} value={name} onChangeText={setName} accent={theme.accent} />
              {portal === 'sub' ? (
                <Field label="Trade" placeholder="Electrical" value={trade} onChangeText={setTrade} accent={theme.accent} />
              ) : null}
              <Field label="Email" placeholder="you@company.com" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} accent={theme.accent} />
              <Field label="Password" placeholder="Create a password" secureTextEntry value={password} onChangeText={setPassword} accent={theme.accent} />

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Btn
                label={loading ? 'Creating…' : 'Create Account'}
                loading={loading}
                onPress={onSubmit}
                accent={theme.accent}
                onAccent={theme.onAccent}
                style={{ paddingVertical: 13, marginTop: 4 }}
              />

              <Text style={styles.footer}>
                Already have an account?{' '}
                <Text
                  style={{ color: palette.blueLight, fontWeight: '500' }}
                  onPress={() => router.replace({ pathname: '/(auth)/login', params: { portal } })}
                >
                  Sign in
                </Text>
              </Text>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 28 },
  brand: { alignItems: 'center', marginBottom: 26 },
  kicker: { fontSize: 13, fontWeight: '700', letterSpacing: 0.8, color: palette.tx3, marginBottom: 4 },
  word: { fontSize: 22, fontWeight: '700' },
  tagline: { fontSize: 12, color: palette.tx3, marginTop: 5, textAlign: 'center' },
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
  error: { color: palette.red, fontSize: 12, marginBottom: 12 },
  footer: { textAlign: 'center', marginTop: 18, fontSize: 12.5, color: palette.tx2 },
  success: {
    backgroundColor: palette.greenDim,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.22)',
    borderRadius: 12,
    padding: 14,
  },
  successText: { fontSize: 12.5, color: palette.tx2, lineHeight: 19 },
});
