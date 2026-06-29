import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Field } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { loginRouteForPortal } from '@/lib/roles';
import { palette, radius, roleThemes } from '@/theme';

export default function SubSignup() {
  const { signUp } = useAuth();
  const router = useRouter();
  const theme = roleThemes.sub;
  const [company, setCompany] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [awaitingVerification, setAwaitingVerification] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  async function onSubmit() {
    if (!company || !name || !email || !password) {
      Alert.alert('Missing info', 'Please complete every field.');
      return;
    }
    setLoading(true);
    try {
      const result = await signUp({ email, password, fullName: name, companyName: company, userType: 'sub' });
      if (result.needsEmailConfirmation) {
        setSubmittedEmail(email.trim());
        setAwaitingVerification(true);
        return;
      }
      router.replace('/');
    } catch (e) {
      Alert.alert('Could not create account', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (awaitingVerification) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.brand}>
            <Text style={styles.title}>Check your email</Text>
            <Text style={styles.tagline}>We sent a verification link to</Text>
            <Text style={styles.email}>{submittedEmail}</Text>
          </View>

          <View style={styles.successBox}>
            <Text style={styles.successText}>
              Open the link in that email to verify your account. After verifying, sign in and your company details
              will be saved automatically.
            </Text>
          </View>

          <Button
            label="Go to Sign In"
            onPress={() => router.replace(loginRouteForPortal('sub'))}
            accent={theme.accent}
            onAccent={theme.onAccent}
          />

          <Text style={styles.resendHint}>
            Didn&apos;t get it? Check spam, or wait a minute and try creating the account again with the same email.
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <Text style={styles.title}>Create Your Account</Text>
            <Text style={styles.tagline}>Free for subcontractors · invited by your GC</Text>
          </View>

          <Field label="Company Name" placeholder="Mesa Electric" value={company} onChangeText={setCompany} />
          <Field label="Your Name" placeholder="Carlos Mendez" value={name} onChangeText={setName} autoCapitalize="words" />
          <Field label="Email" placeholder="you@company.com" keyboardType="email-address" value={email} onChangeText={setEmail} />
          <Field label="Password" placeholder="Create a password" secureTextEntry value={password} onChangeText={setPassword} />

          <Button
            label="Create Account"
            onPress={onSubmit}
            loading={loading}
            accent={theme.accent}
            onAccent={theme.onAccent}
          />

          <Text style={styles.footer}>
            Already have an account?{' '}
            <Link href={loginRouteForPortal('sub')} style={styles.link}>
              Sign in
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
  title: { fontSize: 19, fontWeight: '600', marginBottom: 3, color: palette.tx },
  tagline: { fontSize: 12.5, color: palette.tx, textAlign: 'center', opacity: 0.88 },
  email: { fontSize: 14, fontWeight: '600', color: palette.tx, marginTop: 8 },
  successBox: {
    backgroundColor: palette.greenDim,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.22)',
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 18,
  },
  successText: { fontSize: 12.5, color: palette.tx2, lineHeight: 18, textAlign: 'center' },
  resendHint: { marginTop: 16, fontSize: 11.5, color: palette.tx3, textAlign: 'center', lineHeight: 17 },
  footer: { textAlign: 'center', marginTop: 18, fontSize: 12, color: palette.tx2 },
  link: { color: palette.blueLight, fontWeight: '500' },
});
