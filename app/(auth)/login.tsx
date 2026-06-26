import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppModeToggle, type AppMode } from '@/components/AppModeToggle';
import { Button, Field } from '@/components/ui';
import { MicIcon } from '@/components/icons';
import { SsoButtons } from '@/components/SsoButtons';
import { useAuth } from '@/context/AuthContext';
import { palette, radius, roleThemes } from '@/theme';

export default function Login() {
  const { signIn } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const [mode, setMode] = useState<AppMode>('gc');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (params.mode === 'sub') setMode('sub');
    if (params.mode === 'gc') setMode('gc');
  }, [params.mode]);

  const theme = roleThemes[mode];

  async function onSubmit() {
    if (!email || !password) {
      Alert.alert('Missing info', 'Enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await signIn(email, password);
      router.replace('/');
    } catch (e) {
      Alert.alert('Could not sign in', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <AppModeToggle mode={mode} onChange={setMode} compact />
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {mode === 'gc' ? (
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

          {mode === 'gc' ? <SsoButtons /> : null}

          {mode === 'gc' ? (
            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.or}>OR</Text>
              <View style={styles.line} />
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
          <Field
            label="Password"
            placeholder="••••••••"
            secureTextEntry
            autoComplete="password"
            value={password}
            onChangeText={setPassword}
          />

          <Text style={styles.forgot}>
            <Link href={`/(auth)/forgot-password?mode=${mode}${email ? `&email=${encodeURIComponent(email)}` : ''}`} style={styles.link}>
              Forgot password?
            </Link>
          </Text>

          <Button
            label={mode === 'gc' ? 'Log In' : 'Sign In'}
            onPress={onSubmit}
            loading={loading}
            accent={theme.accent}
            onAccent={theme.onAccent}
          />

          <Text style={styles.footer}>
            {mode === 'gc' ? "Don't have an account? " : 'New subcontractor? '}
            <Link href={mode === 'gc' ? '/(auth)/signup/gc' : '/(auth)/signup/sub'} style={styles.link}>
              {mode === 'gc' ? 'Create one' : 'Create free account'}
            </Link>
          </Text>

          {mode === 'sub' ? (
            <View style={styles.note}>
              <Text style={styles.noteText}>
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 2,
  },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingTop: 8, paddingBottom: 32 },
  brand: { alignItems: 'center', marginBottom: 34 },
  kicker: { fontSize: 13, fontWeight: '700', letterSpacing: 1.5, color: palette.tx3, marginBottom: 4 },
  wordmark: { fontSize: 26, fontWeight: '700' },
  tagline: { fontSize: 12, color: palette.tx3, marginTop: 5 },
  subBrand: { alignItems: 'center', marginBottom: 34 },
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
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 18 },
  line: { flex: 1, height: 1, backgroundColor: palette.border2 },
  or: { fontSize: 10.5, color: palette.tx3 },
  forgot: { fontSize: 11.5, textAlign: 'right', marginTop: -2, marginBottom: 16 },
  footer: { textAlign: 'center', marginTop: 18, fontSize: 12, color: palette.tx2 },
  link: { color: palette.blueLight, fontWeight: '500' },
  note: {
    marginTop: 28,
    padding: 13,
    backgroundColor: palette.bg2,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.lg,
  },
  noteText: { fontSize: 11, color: palette.tx3, lineHeight: 17, textAlign: 'center' },
});
