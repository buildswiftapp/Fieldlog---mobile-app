import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '@/components/shell';
import { Badge, Card, HealthBar, Hint, SectionHeader } from '@/components/ui';
import { AlertTriangleIcon, MicIcon, CheckCircleIcon, SparkleIcon, BellIcon } from '@/components/icons';
import { useAuth } from '@/context/AuthContext';
import { getHomeStats, listRecentLogs, type HomeStats, type LogListItem } from '@/lib/logs';
import { unreadNotificationCount } from '@/lib/notifications';
import { listMyProjects, type ProjectListItem } from '@/lib/projects';
import { cityState, dayOf, firstName, greeting, initials, logDateLabel, relativeTime, shortDateTime } from '@/lib/format';
import { palette } from '@/theme';

export default function GcHome() {
  const router = useRouter();
  const { profile, organization } = useAuth();
  const [stats, setStats] = useState<HomeStats | null>(null);
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [recent, setRecent] = useState<LogListItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [s, p, r, u] = await Promise.all([
        getHomeStats().catch(() => null),
        listMyProjects().catch(() => []),
        listRecentLogs(5).catch(() => []),
        unreadNotificationCount().catch(() => 0),
      ]);
      setStats(s);
      setProjects(p);
      setRecent(r);
      setUnread(u);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const orgName = organization?.name ?? 'Your Company';
  const topAlert = stats?.alerts?.[0];

  return (
    <Screen nav navActive="home" portal="gc">
     
      <View style={styles.header}>
        <Pressable style={styles.mark} onPress={() => router.push('/(gc)/settings')}>
          <Text style={styles.markText}>{initials(orgName)}</Text>
        </Pressable>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.companyName} numberOfLines={1}>
            {orgName}
          </Text>
          <Text style={styles.greeting} numberOfLines={1}>
            {greeting()}, {firstName(profile?.full_name)} 👋
          </Text>
          <Text style={styles.date}>{shortDateTime()}</Text>
        </View>
        <Pressable style={styles.bell} onPress={() => router.push('/(gc)/notifications')} hitSlop={8}>
          <BellIcon size={19} color={palette.tx2} />
          {unread > 0 ? (
            <View style={styles.bellDot}>
              <Text style={styles.bellDotText}>{unread > 9 ? '9+' : unread}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      {topAlert ? (
        <Pressable
          style={styles.alert}
          onPress={() => router.push(`/(gc)/logs/${topAlert.log_id}`)}
        >
          <AlertTriangleIcon size={15} color={palette.orange} />
          <View style={{ flex: 1 }}>
            <Text style={styles.alertTitle}>✨ AI Alert — {topAlert.project_name}</Text>
            <Text style={styles.alertBody}>{topAlert.message}</Text>
          </View>
        </Pressable>
      ) : null}

      <Hint>
        <Text style={{ fontWeight: '600', color: palette.tx2 }}>Your morning briefing. </Text>
        Tap a project to open it. Tap the orange mic to start today's log. Logs, tasks, activity, and reports all live
        inside each project.
      </Hint>

      <View style={styles.statRow}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Logs Today</Text>
          <Text style={[styles.statValue, { color: palette.orange }]}>{stats?.logs_today ?? 0}</Text>
          <Text style={styles.statSub}>{stats?.week_logs ?? 0} this week</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Pending Review</Text>
          <Text style={[styles.statValue, { color: palette.purple }]}>{stats?.pending_review ?? 0}</Text>
          <Text style={styles.statSub}>Sub logs</Text>
        </View>
      </View>

      <SectionHeader title="Project Health" action="View all →" onAction={() => router.push('/(gc)/projects')} />
      {loading ? (
        <ActivityIndicator color={palette.orange} style={{ marginVertical: 20 }} />
      ) : projects.length === 0 ? (
        <Card>
          <Text style={styles.empty}>No projects yet. Tap New on the Projects tab to create your first one.</Text>
        </Card>
      ) : (
        projects.slice(0, 3).map((p) => {
          const day = dayOf(p.start_date);
          return (
            <Card key={p.id} onPress={() => router.push(`/(gc)/projects/${p.id}`)}>
              <View style={styles.cardTop}>
                <Text style={styles.cardName}>{p.name}</Text>
                <Badge tone={p.status === 'archived' ? 'gray' : 'green'}>
                  {p.status === 'archived' ? 'Archived' : 'On Track'}
                </Badge>
              </View>
              <Text style={styles.cardMeta}>
                {cityState(p.city, p.state) || 'No location'}
                {day ? ` · Day ${day}` : ''}
              </Text>
              <HealthBar pct={p.status === 'archived' ? 100 : 72} color={p.status === 'archived' ? palette.tx3 : palette.green} />
              <View style={styles.cardFoot}>
                <Text style={styles.cardFootText}>{p.subcontractor_count ?? 0} subs</Text>
                <Text style={[styles.cardFootText, { color: palette.orange }]}>Open ›</Text>
              </View>
            </Card>
          );
        })
      )}

      <SectionHeader title="New Log" style={{ paddingTop: 4 }} />
      <View style={styles.micWrap}>
        <Pressable style={styles.mic} onPress={() => router.push('/(gc)/log/new')}>
          <MicIcon size={22} color="#000" strokeWidth={2.5} />
        </Pressable>
      </View>

      <SectionHeader title="Recent Activity" action="All →" onAction={() => router.push('/(gc)/activity')} style={{ paddingTop: 4 }} />
      <Card flush>
        {recent.length === 0 ? (
          <Text style={[styles.empty, { padding: 14 }]}>No recent activity yet.</Text>
        ) : (
          recent.map((log, i) => (
            <Pressable
              key={log.id}
              style={[styles.activityRow, i < recent.length - 1 && styles.rowBorder]}
              onPress={() => router.push(`/(gc)/logs/${log.id}`)}
            >
              <View style={[styles.actDot, { backgroundColor: log.status === 'reviewed' ? palette.greenDim : palette.blueDim }]}>
                {log.status === 'reviewed' ? (
                  <CheckCircleIcon size={12} color={palette.green} />
                ) : (
                  <SparkleIcon size={12} color={palette.blueLight} />
                )}
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.actText} numberOfLines={1}>
                  <Text style={{ color: palette.tx, fontWeight: '500' }}>{log.project_name}</Text>
                  {` — ${log.summary ? 'log updated' : 'daily log'}`}
                </Text>
                <Text style={styles.actMeta}>
                  {logDateLabel(log.log_date)} · {relativeTime(log.created_at)}
                </Text>
              </View>
              <Badge tone={log.status === 'reviewed' ? 'green' : log.status === 'rejected' ? 'red' : 'orange'}>
                {log.status === 'reviewed' ? 'Reviewed' : log.status === 'rejected' ? 'Rejected' : 'Submitted'}
              </Badge>
            </Pressable>
          ))
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: palette.bg2,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  mark: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: palette.blueDim,
    borderWidth: 1,
    borderColor: palette.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markText: { fontSize: 10, fontWeight: '700', color: palette.blueLight },
  bell: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  bellDot: { position: 'absolute', top: 3, right: 3, minWidth: 15, height: 15, paddingHorizontal: 3, borderRadius: 8, backgroundColor: palette.orange, alignItems: 'center', justifyContent: 'center' },
  bellDotText: { fontSize: 9, fontWeight: '700', color: '#000' },
  companyName: { fontSize: 13, fontWeight: '600', color: palette.tx },
  greeting: { fontSize: 10, color: palette.tx3, marginTop: 1 },
  date: { fontSize: 11, color: palette.tx3, marginTop: 3 },
  alert: {
    marginHorizontal: 14,
    marginTop: 11,
    backgroundColor: 'rgba(245,158,11,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.22)',
    borderRadius: 12,
    padding: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
  },
  alertTitle: { fontSize: 12, fontWeight: '500', color: palette.orange, marginBottom: 2 },
  alertBody: { fontSize: 11.5, color: palette.tx2, lineHeight: 16 },
  statRow: { flexDirection: 'row', gap: 8, marginHorizontal: 14, marginTop: 11 },
  stat: {
    flex: 1,
    backgroundColor: palette.bg3,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 12,
    padding: 12,
    paddingHorizontal: 13,
  },
  statLabel: { fontSize: 10, color: palette.tx3, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 5 },
  statValue: { fontSize: 22, fontWeight: '600', lineHeight: 24 },
  statSub: { fontSize: 11, color: palette.tx2, marginTop: 3 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  cardName: { fontSize: 13, fontWeight: '500', color: palette.tx, flex: 1, paddingRight: 8 },
  cardMeta: { fontSize: 11, color: palette.tx2, marginBottom: 1 },
  cardFoot: { flexDirection: 'row', justifyContent: 'space-between' },
  cardFootText: { fontSize: 11, color: palette.tx2 },
  micWrap: { alignItems: 'center', paddingVertical: 8, paddingBottom: 14 },
  mic: { width: 60, height: 60, borderRadius: 30, backgroundColor: palette.orange, alignItems: 'center', justifyContent: 'center' },
  activityRow: { flexDirection: 'row', gap: 10, padding: 10, paddingHorizontal: 14, alignItems: 'center' },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: palette.border },
  actDot: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  actText: { fontSize: 12, color: palette.tx2, lineHeight: 17 },
  actMeta: { fontSize: 10.5, color: palette.tx3, marginTop: 2 },
  empty: { fontSize: 12, color: palette.tx2, lineHeight: 18 },
});
