import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Field } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { palette, roleThemes } from '@/theme';

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
      await signUp({ email, password, fullName: name, companyName: company, userType: 'sub' });
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

          <Field label="Company Name" placeholder="Mesa Electric" value={company} onChangeText={setCompany} style={styles.input} />
          <Field label="Your Name" placeholder="Carlos Mendez" value={name} onChangeText={setName} autoCapitalize="words" style={styles.input} />
          <Field label="Email" placeholder="you@company.com" keyboardType="email-address" value={email} onChangeText={setEmail} style={styles.input} />
          <Field label="Password" placeholder="Create a password" secureTextEntry value={password} onChangeText={setPassword} style={styles.input} />

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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 32 },
  brand: { alignItems: 'center', marginBottom: 26 },
  title: { fontSize: 19, fontWeight: '600', marginBottom: 3 },
  tagline: { fontSize: 12.5, color: palette.tx2, textAlign: 'center' },
  input: { paddingVertical: 13, paddingHorizontal: 12 },
  footer: { textAlign: 'center', marginTop: 18, fontSize: 12, color: palette.tx2 },
  link: { color: palette.blueLight, fontWeight: '500' },
});
