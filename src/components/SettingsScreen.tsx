import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { palette, roleThemes } from '@/theme';

export function SettingsScreen({ role }: { role: 'gc' | 'sub' }) {
  const { profile, organization, signOut } = useAuth();
  const [busy, setBusy] = useState(false);
  const theme = roleThemes[role];

  async function onSignOut() {
    setBusy(true);
    try {
      await signOut();
    } catch (e) {
      Alert.alert('Sign out failed', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 14, gap: 12 }}>
        <Card>
          <Text style={styles.section}>Account</Text>
          <Row label="Name" value={profile?.full_name ?? '—'} />
          <Row label="Email" value={profile?.email ?? '—'} />
          <Row label="Role" value={theme.label} accent={theme.accent} />
        </Card>

        <Card>
          <Text style={styles.section}>Company</Text>
          <Row label="Name" value={organization?.name ?? '—'} />
          {organization?.trade ? <Row label="Trade" value={organization.trade} /> : null}
          {organization?.license_number ? <Row label="License" value={organization.license_number} /> : null}
        </Card>

        <Button label="Sign Out" variant="secondary" onPress={onSignOut} loading={busy} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, accent && { color: accent }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: palette.bg2,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  title: { fontSize: 15, fontWeight: '600', color: palette.tx },
  section: { fontSize: 10.5, fontWeight: '700', color: palette.tx3, letterSpacing: 0.7, textTransform: 'uppercase', marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7, gap: 12 },
  rowLabel: { fontSize: 12.5, color: palette.tx2 },
  rowValue: { fontSize: 12.5, color: palette.tx, fontWeight: '500', flexShrink: 1, textAlign: 'right' },
});
