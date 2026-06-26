import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Field } from '@/components/ui';
import { SsoButtons } from '@/components/SsoButtons';
import { useAuth } from '@/context/AuthContext';
import { palette, roleThemes } from '@/theme';

export default function GcSignup() {
  const { signUp } = useAuth();
  const router = useRouter();
  const theme = roleThemes.gc;
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
      await signUp({ email, password, fullName: name, companyName: company, userType: 'gc' });
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
          <View style={styles.brand}>
            <Text style={styles.kicker}>BYLDGO</Text>
            <Text style={styles.wordmark}>
              <Text style={{ color: theme.accent }}>Field</Text>
              <Text style={{ color: palette.tx }}>Log</Text>
            </Text>
            <Text style={styles.tagline}>Create your GC account</Text>
          </View>

          <SsoButtons verb="Sign up with" />

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.or}>OR</Text>
            <View style={styles.line} />
          </View>

          <Field label="Company Name" placeholder="Dawson Construction" value={company} onChangeText={setCompany} />
          <Field label="Full Name" placeholder="Jake Dawson" value={name} onChangeText={setName} autoCapitalize="words" />
          <Field label="Email" placeholder="you@company.com" keyboardType="email-address" value={email} onChangeText={setEmail} />
          <Field label="Password" placeholder="Create a password" secureTextEntry value={password} onChangeText={setPassword} />

          <Button label="Create Account" onPress={onSubmit} loading={loading} accent={theme.accent} onAccent={theme.onAccent} />

          <Text style={styles.footer}>
            Already have an account?{' '}
            <Link href="/(auth)/login?mode=gc" style={styles.link}>
              Log in
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
  brand: { alignItems: 'center', marginBottom: 30 },
  kicker: { fontSize: 13, fontWeight: '700', letterSpacing: 1.5, color: palette.tx3, marginBottom: 4 },
  wordmark: { fontSize: 22, fontWeight: '700' },
  tagline: { fontSize: 12, color: palette.tx3, marginTop: 5 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 18 },
  line: { flex: 1, height: 1, backgroundColor: palette.border2 },
  or: { fontSize: 10.5, color: palette.tx3 },
  footer: { textAlign: 'center', marginTop: 18, fontSize: 12.5, color: palette.tx2 },
  link: { color: palette.blueLight, fontWeight: '500' },
});
