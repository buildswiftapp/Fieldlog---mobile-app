import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '@/components/AppHeader';
import { AlertTriangleIcon, MicIcon } from '@/components/icons';
import { Card, Hint, SectionHeader } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { palette, radius, roleThemes } from '@/theme';

export function RoleHome({ role }: { role: 'gc' | 'sub' }) {
  const { profile, organization } = useAuth();
  const theme = roleThemes[role];
  const accent = organization?.brand_color ?? theme.accent;
  const accentDim = `${accent}22`;
  const firstName = profile?.full_name?.split(' ')[0] ?? null;
  const companyName = organization?.name ?? (role === 'gc' ? 'Your Company' : 'Your Trade');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader
        companyName={companyName}
        logoUrl={organization?.logo_url}
        firstName={firstName}
        accent={accent}
        accentDim={accentDim}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={[styles.alert, { backgroundColor: `${accent}12`, borderColor: `${accent}38` }]}>
          <AlertTriangleIcon color={accent} size={16} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.alertTitle, { color: accent }]}>
              {role === 'gc' ? '✨ AI Alert — sample' : '1 log due today — sample'}
            </Text>
            <Text style={styles.alertBody}>
              {role === 'gc'
                ? 'Crew count 33% below 10-day average. Full review arrives with daily logs in Milestone 3.'
                : 'Mesa Retail hasn’t been logged yet. The full voice log flow ships in Milestone 3.'}
            </Text>
          </View>
        </View>

        <Hint>
          {role === 'gc' ? (
            <Text>
              <Text style={styles.hintStrong}>Your morning briefing.</Text> Your company branding and account are
              live. Projects, daily logs, and reports unlock across the next milestones.
            </Text>
          ) : (
            <Text>
              <Text style={styles.hintStrong}>Your daily logging hub.</Text> You only see projects your GC assigns to
              you. Submitting voice logs to your GC arrives in Milestone 3.
            </Text>
          )}
        </Hint>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>{role === 'gc' ? 'Logs Today' : 'Logs This Week'}</Text>
            <Text style={[styles.statValue, { color: accent }]}>0</Text>
            <Text style={styles.statSub}>Starts in M3</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>{role === 'gc' ? 'Pending Review' : 'Awaiting GC'}</Text>
            <Text style={[styles.statValue, { color: palette.tx2 }]}>0</Text>
            <Text style={styles.statSub}>No items yet</Text>
          </View>
        </View>

        <SectionHeader title={role === 'gc' ? 'Your Projects' : 'My Projects'} />
        <Card style={{ marginHorizontal: 14 }}>
          <Text style={styles.emptyTitle}>No projects yet</Text>
          <Text style={styles.emptyBody}>
            {role === 'gc'
              ? 'Create your first project and invite your team in Milestone 2.'
              : 'Projects your GC assigns to you will appear here in Milestone 2.'}
          </Text>
        </Card>

        <SectionHeader title="Log Today's Work" />
        <View style={styles.fabWrap}>
          <View style={[styles.fab, { backgroundColor: accent }]}>
            <MicIcon color={role === 'gc' ? '#000000' : '#FFFFFF'} size={24} strokeWidth={2.4} />
          </View>
          <Text style={styles.fabHint}>Voice logging unlocks in Milestone 3</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  alert: {
    flexDirection: 'row',
    gap: 9,
    alignItems: 'flex-start',
    marginHorizontal: 14,
    marginTop: 11,
    padding: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  alertTitle: { fontSize: 12, fontWeight: '500', marginBottom: 2 },
  alertBody: { fontSize: 11.5, color: palette.tx2, lineHeight: 16 },
  hintStrong: { color: palette.tx2, fontWeight: '500' },
  stats: { flexDirection: 'row', gap: 8, marginHorizontal: 14, marginTop: 11 },
  stat: {
    flex: 1,
    backgroundColor: palette.bg3,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.lg,
    padding: 13,
  },
  statLabel: { fontSize: 10, color: palette.tx3, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase' },
  statValue: { fontSize: 22, fontWeight: '600', marginTop: 5, lineHeight: 24 },
  statSub: { fontSize: 11, color: palette.tx2, marginTop: 3 },
  emptyTitle: { fontSize: 13, fontWeight: '600', color: palette.tx, marginBottom: 4 },
  emptyBody: { fontSize: 12, color: palette.tx2, lineHeight: 17 },
  fabWrap: { alignItems: 'center', paddingVertical: 14, gap: 10 },
  fab: { width: 64, height: 64, borderRadius: radius.round, alignItems: 'center', justifyContent: 'center' },
  fabHint: { fontSize: 11, color: palette.tx3 },
});
