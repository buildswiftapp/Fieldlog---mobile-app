import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Field } from '@/components/ui';
import { LegalLinks } from '@/components/LegalLinks';
import { SsoButtons } from '@/components/SsoButtons';
import { useAuth } from '@/context/AuthContext';
import { palette, roleThemes } from '@/theme';

export default function SubSignup() {
  const { signUp } = useAuth();
  const router = useRouter();
  const theme = roleThemes.sub;
  const [company, setCompany] = useState('');
  const [name, setName] = useState('');
  const [trade, setTrade] = useState('');
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
      const result = await signUp({
        email,
        password,
        fullName: name,
        companyName: company,
        userType: 'sub',
        trade: trade.trim() || undefined,
      });
      if (result.needsEmailConfirmation) {
        Alert.alert('Check your email', 'Confirm your account from the email we sent, then sign in.');
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
          <View style={styles.brand}>
            <Text style={styles.title}>Create Your Account</Text>
            <Text style={styles.tagline}>Free for subcontractors · invited by your GC</Text>
          </View>

          <SsoButtons verb="Sign up with" userType="sub" />

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.or}>OR</Text>
            <View style={styles.line} />
          </View>

          <Field label="Company Name" placeholder="Mesa Electric" value={company} onChangeText={setCompany} />
          <Field label="Trade" placeholder="Electrical" value={trade} onChangeText={setTrade} autoCapitalize="words" />
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
            <Link href="/(auth)/login?mode=sub" style={styles.link}>
              Sign in
            </Link>
          </Text>

          <LegalLinks compact />
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
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 18 },
  line: { flex: 1, height: 1, backgroundColor: palette.border2 },
  or: { fontSize: 10.5, color: palette.tx3 },
  footer: { textAlign: 'center', marginTop: 18, fontSize: 12, color: palette.tx2 },
  link: { color: palette.blueLight, fontWeight: '500' },
});
