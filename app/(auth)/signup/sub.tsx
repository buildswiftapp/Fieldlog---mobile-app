import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Field } from '@/components/ui';
import { AppModeToggle } from '@/components/AppModeToggle';
import { useAuth } from '@/context/AuthContext';
import { loginRouteForPortal, signupRouteForPortal } from '@/lib/roles';
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

  async function onSubmit() {
    if (!company || !name || !email || !password) {
      Alert.alert('Missing info', 'Please complete every field.');
      return;
    }
    setLoading(true);
    try {
      const result = await signUp({ email, password, fullName: name, companyName: company, userType: 'sub' });
      if (result.needsEmailConfirmation) {
        router.replace(
          `/(auth)/login/sub?checkEmail=1&email=${encodeURIComponent(email.trim())}` as '/',
        );
        return;
      }
      router.replace('/');
    } catch (e) {
      Alert.alert('Could not create account', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.toggleRow}>
            <AppModeToggle mode="sub" onChange={(mode) => mode === 'gc' && router.replace(signupRouteForPortal('gc'))} />
          </View>

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
  toggleRow: { alignItems: 'center', marginBottom: 20 },
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
