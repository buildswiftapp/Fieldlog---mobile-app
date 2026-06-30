import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '@/components/AppHeader';
import { AlertTriangleIcon, ChevronRightIcon, ClipboardIcon, MapPinIcon, MicIcon, PlusIcon } from '@/components/icons';
import { Card, SectionHeader } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { acceptMyInvites, listMyProjects, type ProjectListItem } from '@/lib/projects';
import { getHomeStats, listRecentLogs, type HomeStats, type LogListItem } from '@/lib/logs';
import { palette, radius, roleThemes } from '@/theme';

function formatDate(value: string) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function RoleHome({ role }: { role: 'gc' | 'sub' }) {
  const { profile, organization } = useAuth();
  const router = useRouter();
  const theme = roleThemes[role];
  const accent = organization?.brand_color ?? theme.accent;
  const accentDim = `${accent}22`;
  const firstName = profile?.full_name?.split(' ')[0] ?? null;
  const companyName = organization?.name ?? (role === 'gc' ? 'Your Company' : 'Your Trade');
  const base = role === 'gc' ? '/(gc)/projects' : '/(sub)/projects';
  const logsBase = role === 'gc' ? '/(gc)/logs' : '/(sub)/logs';

  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [stats, setStats] = useState<HomeStats | null>(null);
  const [recentLogs, setRecentLogs] = useState<LogListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      await acceptMyInvites().catch(() => {});
      const [proj, st, logs] = await Promise.all([
        listMyProjects(),
        getHomeStats().catch(() => null),
        listRecentLogs(4).catch(() => []),
      ]);
      setProjects(proj);
      setStats(st);
      setRecentLogs(logs);
    } catch {
      // Home stays usable even if a data source fails to load.
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const activeProjects = projects.filter((p) => p.status === 'active');
  const canLog = activeProjects.length > 0;
  const secondStatLabel = role === 'gc' ? 'Logs Today' : 'Logs This Week';
  const secondStatValue = role === 'gc' ? stats?.logs_today ?? 0 : stats?.week_logs ?? 0;
  const thirdStatLabel = role === 'gc' ? 'Pending Review' : 'Awaiting GC';
  const thirdStatValue = stats?.pending_review ?? 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader
        companyName={companyName}
        logoUrl={organization?.logo_url}
        firstName={firstName}
        accent={accent}
        accentDim={accentDim}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 28 }}>
        {/* Record a daily log */}
        <Pressable
          style={({ pressed }) => [
            styles.record,
            { backgroundColor: accent },
            (pressed || !canLog) && { opacity: canLog ? 0.9 : 0.5 },
          ]}
          disabled={!canLog}
          onPress={() => router.push(`${logsBase}/new` as '/')}
        >
          <View style={[styles.recordIcon, { backgroundColor: 'rgba(0,0,0,0.14)' }]}>
            <MicIcon color={theme.onAccent} size={20} strokeWidth={2.3} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.recordTitle, { color: theme.onAccent }]}>Record Daily Log</Text>
            <Text style={[styles.recordSub, { color: theme.onAccent }]}>
              {canLog ? 'Speak your update — AI writes the report' : 'Add a project to start logging'}
            </Text>
          </View>
        </Pressable>

        {/* Stats */}
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>{role === 'gc' ? 'Active Projects' : 'Assigned'}</Text>
            <Text style={[styles.statValue, { color: accent }]}>{activeProjects.length}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>{secondStatLabel}</Text>
            <Text style={[styles.statValue, { color: palette.tx }]}>{secondStatValue}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>{thirdStatLabel}</Text>
            <Text style={[styles.statValue, { color: thirdStatValue > 0 ? palette.orange : palette.tx }]}>
              {thirdStatValue}
            </Text>
          </View>
        </View>

        {/* AI alerts (GC) */}
        {role === 'gc' && stats?.alerts?.length ? (
          <>
            <SectionHeader title="Alerts" />
            <View style={{ marginHorizontal: 14, gap: 8 }}>
              {stats.alerts.map((a) => (
                <Pressable
                  key={a.id}
                  onPress={() => router.push(`${logsBase}/${a.log_id}` as '/')}
                  style={[styles.alert, { borderColor: `${palette.orange}3a`, backgroundColor: palette.orangeDim }]}
                >
                  <AlertTriangleIcon color={palette.orange} size={15} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.alertText}>{a.message}</Text>
                    <Text style={styles.alertMeta}>{a.project_name}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}

        {/* Recent logs */}
        {recentLogs.length > 0 ? (
          <>
            <SectionHeader title="Recent Logs" />
            {recentLogs.map((log) => (
              <Card
                key={log.id}
                style={{ marginHorizontal: 14, marginBottom: 9 }}
                onPress={() => router.push(`${logsBase}/${log.id}` as '/')}
              >
                <View style={styles.logRow}>
                  <View style={[styles.logIcon, { backgroundColor: accentDim }]}>
                    <ClipboardIcon color={accent} size={16} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.logProject} numberOfLines={1}>
                      {log.project_name}
                    </Text>
                    <Text style={styles.logSummary} numberOfLines={1}>
                      {log.summary || 'Daily log'}
                    </Text>
                  </View>
                  <Text style={styles.logDate}>{formatDate(log.log_date)}</Text>
                </View>
              </Card>
            ))}
          </>
        ) : null}

        {/* Projects */}
        <SectionHeader
          title={role === 'gc' ? 'Your Projects' : 'My Projects'}
          action={projects.length > 0 ? 'View all' : undefined}
          onAction={() => router.push(base as '/')}
        />

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={accent} />
          </View>
        ) : projects.length === 0 ? (
          <Card style={{ marginHorizontal: 14 }}>
            <Text style={styles.emptyTitle}>No projects yet</Text>
            <Text style={styles.emptyBody}>
              {role === 'gc'
                ? 'Create your first project, then assign subcontractors and invite your team.'
                : 'Projects your GC assigns to you will appear here.'}
            </Text>
            {role === 'gc' ? (
              <Pressable
                style={({ pressed }) => [styles.cta, { backgroundColor: accent }, pressed && { opacity: 0.85 }]}
                onPress={() => router.push(`${base}/new` as '/')}
              >
                <PlusIcon color={theme.onAccent} size={15} strokeWidth={2.6} />
                <Text style={[styles.ctaText, { color: theme.onAccent }]}>New Project</Text>
              </Pressable>
            ) : null}
          </Card>
        ) : (
          activeProjects.slice(0, 4).map((p) => (
            <Card
              key={p.id}
              style={{ marginHorizontal: 14, marginBottom: 9 }}
              onPress={() => router.push(`${base}/${p.id}` as '/')}
            >
              <View style={styles.projectRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.projectName} numberOfLines={1}>
                    {p.name}
                  </Text>
                  <View style={styles.metaRow}>
                    {[p.city, p.state].filter(Boolean).length ? (
                      <>
                        <MapPinIcon color={palette.tx3} size={12} />
                        <Text style={styles.meta}>{[p.city, p.state].filter(Boolean).join(', ')}</Text>
                      </>
                    ) : (
                      <Text style={styles.meta}>
                        {role === 'gc'
                          ? `${p.subcontractor_count ?? 0} subcontractor${(p.subcontractor_count ?? 0) === 1 ? '' : 's'}`
                          : (p.gc_org_name ?? 'General contractor')}
                      </Text>
                    )}
                  </View>
                </View>
                <ChevronRightIcon color={palette.tx3} size={18} />
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  record: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 14,
    marginTop: 12,
    padding: 14,
    borderRadius: radius.lg,
  },
  recordIcon: { width: 40, height: 40, borderRadius: radius.round, alignItems: 'center', justifyContent: 'center' },
  recordTitle: { fontSize: 15, fontWeight: '700' },
  recordSub: { fontSize: 12, marginTop: 2, opacity: 0.85 },
  stats: { flexDirection: 'row', gap: 8, marginHorizontal: 14, marginTop: 10 },
  stat: {
    flex: 1,
    backgroundColor: palette.bg3,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.lg,
    padding: 12,
  },
  statLabel: { fontSize: 9.5, color: palette.tx3, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
  statValue: { fontSize: 22, fontWeight: '600', marginTop: 5, lineHeight: 24 },
  alert: { flexDirection: 'row', gap: 9, alignItems: 'flex-start', padding: 11, borderRadius: radius.md, borderWidth: 1 },
  alertText: { fontSize: 12.5, color: palette.tx, lineHeight: 17 },
  alertMeta: { fontSize: 11, color: palette.tx2, marginTop: 2 },
  loading: { paddingVertical: 28, alignItems: 'center' },
  emptyTitle: { fontSize: 13, fontWeight: '600', color: palette.tx, marginBottom: 4 },
  emptyBody: { fontSize: 12, color: palette.tx2, lineHeight: 17 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  ctaText: { fontSize: 13, fontWeight: '600' },
  logRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  logIcon: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  logProject: { fontSize: 14, fontWeight: '600', color: palette.tx },
  logSummary: { fontSize: 12, color: palette.tx2, marginTop: 2 },
  logDate: { fontSize: 11.5, color: palette.tx3 },
  projectRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  projectName: { fontSize: 15, fontWeight: '600', color: palette.tx },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 },
  meta: { fontSize: 12, color: palette.tx2, flexShrink: 1 },
});
