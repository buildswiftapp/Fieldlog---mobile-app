import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Btn, Field } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { homeRouteForPortal, type MobilePortal } from '@/lib/roles';
import { palette, roleThemes } from '@/theme';

export default function Onboarding() {
  const router = useRouter();
  const { bootstrapOrganization, signOut } = useAuth();
  const [portal, setPortal] = useState<MobilePortal>('gc');
  const [company, setCompany] = useState('');
  const [trade, setTrade] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const theme = roleThemes[portal];

  async function finish() {
    if (!company.trim()) {
      setError('Enter your company name.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await bootstrapOrganization({ companyName: company, userType: portal, trade: portal === 'sub' ? trade : undefined });
      router.replace(homeRouteForPortal(portal));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not finish setup.');
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
          <Text style={styles.tagline}>Finish setting up your organization</Text>
        </View>

        <Text style={styles.label}>I am a…</Text>
        <View style={styles.toggle}>
          <Btn label="General Contractor" variant={portal === 'gc' ? 'primary' : 'secondary'} accent={palette.orange} onAccent="#000" style={{ flex: 1 }} onPress={() => setPortal('gc')} />
          <Btn label="Subcontractor" variant={portal === 'sub' ? 'purple' : 'secondary'} style={{ flex: 1 }} onPress={() => setPortal('sub')} />
        </View>

        <Field label="Company Name" placeholder={portal === 'sub' ? 'Mesa Electric' : 'Dawson Construction'} value={company} onChangeText={setCompany} />
        {portal === 'sub' ? <Field label="Trade" placeholder="Electrical" value={trade} onChangeText={setTrade} /> : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Btn label={loading ? 'Setting up…' : 'Continue'} loading={loading} onPress={finish} accent={theme.accent} onAccent={theme.onAccent} style={{ paddingVertical: 13, marginTop: 4 }} />
        <Text style={styles.footer} onPress={() => signOut().then(() => router.replace('/(auth)/login'))}>
          Sign out
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
  tagline: { fontSize: 12.5, color: palette.tx2, textAlign: 'center' },
  label: { fontSize: 11, fontWeight: '500', color: palette.tx2, marginBottom: 8 },
  toggle: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  error: { color: palette.red, fontSize: 12, marginBottom: 12 },
  footer: { textAlign: 'center', marginTop: 20, fontSize: 12, color: palette.tx3 },
});
