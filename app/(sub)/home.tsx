import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '@/components/shell';
import { Badge, Card, Hint, SectionHeader } from '@/components/ui';
import { AlertTriangleIcon, CheckCircleIcon, MicIcon, BellIcon } from '@/components/icons';
import { useAuth } from '@/context/AuthContext';
import { getHomeStats, listRecentLogs, type HomeStats, type LogListItem } from '@/lib/logs';
import { unreadNotificationCount } from '@/lib/notifications';
import { listMyProjects, type ProjectListItem } from '@/lib/projects';
import { cityState, firstName, greeting, initials, logDateLabel, relativeTime, shortDateTime } from '@/lib/format';
import { palette } from '@/theme';

export default function SubHome() {
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
  const due = projects.length - (stats?.logs_today ?? 0);

  return (
    <Screen nav navActive="home" portal="sub">
      <View style={styles.header}>
        <Pressable style={styles.mark} onPress={() => router.push('/(sub)/settings')}>
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
        <Pressable style={styles.bell} onPress={() => router.push('/(sub)/notifications')} hitSlop={8}>
          <BellIcon size={19} color={palette.tx2} />
          {unread > 0 ? (
            <View style={styles.bellDot}>
              <Text style={styles.bellDotText}>{unread > 9 ? '9+' : unread}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <Pressable style={styles.alert} onPress={() => router.push('/(sub)/log/new')}>
        <AlertTriangleIcon size={15} color={palette.purple} />
        <View style={{ flex: 1 }}>
          <Text style={styles.alertTitle}>{Math.max(0, due)} log{due === 1 ? '' : 's'} due today</Text>
          <Text style={styles.alertBody}>Tap to log today's work for a project assigned to you.</Text>
        </View>
      </Pressable>

      <Hint>
        <Text style={{ fontWeight: '600', color: palette.tx2 }}>Your daily logging hub. </Text>
        Tap the purple mic to log today's work. Everything you submit goes to the GC for approval.
      </Hint>

      <View style={styles.statRow}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Logs This Week</Text>
          <Text style={[styles.statValue, { color: palette.purple }]}>{stats?.week_logs ?? 0}</Text>
          <Text style={styles.statSub}>Across {projects.length} projects</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Awaiting GC</Text>
          <Text style={[styles.statValue, { color: palette.orange }]}>{stats?.pending_review ?? 0}</Text>
          <Text style={styles.statSub}>Pending review</Text>
        </View>
      </View>

      <SectionHeader title="My Projects" action="View all →" onAction={() => router.push('/(sub)/projects')} />
      {loading ? (
        <ActivityIndicator color={palette.purple} style={{ marginVertical: 20 }} />
      ) : projects.length === 0 ? (
        <Card>
          <Text style={styles.empty}>No projects yet. Your GC will assign you to projects you can log to.</Text>
        </Card>
      ) : (
        projects.slice(0, 3).map((p) => (
          <Card key={p.id} onPress={() => router.push(`/(sub)/projects/${p.id}`)}>
            <View style={styles.cardTop}>
              <Text style={styles.cardName}>{p.name}</Text>
              <Badge tone="gray">{p.gc_org_name ?? 'GC'}</Badge>
            </View>
            <Text style={styles.cardMeta}>
              {cityState(p.city, p.state) || 'No location'}
              {p.trade ? ` · ${p.trade}` : ''}
            </Text>
            <View style={styles.cardFoot}>
              <Text style={styles.cardFootText}>Tap to log work</Text>
              <Text style={[styles.cardFootText, { color: palette.purple }]}>Open ›</Text>
            </View>
          </Card>
        ))
      )}

      <SectionHeader title="Log Today's Work" style={{ paddingTop: 4 }} />
      <View style={styles.micWrap}>
        <Pressable style={styles.mic} onPress={() => router.push('/(sub)/log/new')}>
          <MicIcon size={22} color="#fff" strokeWidth={2.5} />
        </Pressable>
      </View>

      <SectionHeader title="Recent Activity" action="All →" onAction={() => router.push('/(sub)/activity')} style={{ paddingTop: 4 }} />
      <Card flush>
        {recent.length === 0 ? (
          <Text style={[styles.empty, { padding: 14 }]}>No recent activity yet.</Text>
        ) : (
          recent.map((log, i) => (
            <Pressable
              key={log.id}
              style={[styles.activityRow, i < recent.length - 1 && styles.rowBorder]}
              onPress={() => router.push(`/(sub)/logs/${log.id}`)}
            >
              <View style={[styles.actDot, { backgroundColor: log.status === 'reviewed' ? palette.greenDim : palette.purpleDim }]}>
                {log.status === 'reviewed' ? <CheckCircleIcon size={12} color={palette.green} /> : <MicIcon size={12} color={palette.purple} />}
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.actText} numberOfLines={1}>
                  <Text style={{ color: palette.tx, fontWeight: '500' }}>{log.project_name}</Text>
                  {log.status === 'reviewed' ? ' — approved' : ' — submitted'}
                </Text>
                <Text style={styles.actMeta}>
                  {logDateLabel(log.log_date)} · {relativeTime(log.created_at)}
                </Text>
              </View>
              <Badge tone={log.status === 'reviewed' ? 'green' : 'orange'}>
                {log.status === 'reviewed' ? 'Approved' : 'Pending'}
              </Badge>
            </Pressable>
          ))
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 8, backgroundColor: palette.bg2, borderBottomWidth: 1, borderBottomColor: palette.border },
  mark: { width: 32, height: 32, borderRadius: 10, backgroundColor: palette.purpleDim, borderWidth: 1, borderColor: palette.purple, alignItems: 'center', justifyContent: 'center' },
  markText: { fontSize: 10, fontWeight: '700', color: palette.purple },
  bell: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  bellDot: { position: 'absolute', top: 3, right: 3, minWidth: 15, height: 15, paddingHorizontal: 3, borderRadius: 8, backgroundColor: palette.purple, alignItems: 'center', justifyContent: 'center' },
  bellDotText: { fontSize: 9, fontWeight: '700', color: '#fff' },
  companyName: { fontSize: 13, fontWeight: '600', color: palette.tx },
  greeting: { fontSize: 10, color: palette.tx3, marginTop: 1 },
  date: { fontSize: 11, color: palette.tx3, marginTop: 3 },
  alert: { marginHorizontal: 14, marginTop: 11, backgroundColor: 'rgba(139,92,246,0.07)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.22)', borderRadius: 12, padding: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  alertTitle: { fontSize: 12, fontWeight: '500', color: palette.purple, marginBottom: 2 },
  alertBody: { fontSize: 11.5, color: palette.tx2, lineHeight: 16 },
  statRow: { flexDirection: 'row', gap: 8, marginHorizontal: 14, marginTop: 11 },
  stat: { flex: 1, backgroundColor: palette.bg3, borderWidth: 1, borderColor: palette.border, borderRadius: 12, padding: 12, paddingHorizontal: 13 },
  statLabel: { fontSize: 10, color: palette.tx3, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 5 },
  statValue: { fontSize: 22, fontWeight: '600', lineHeight: 24 },
  statSub: { fontSize: 11, color: palette.tx2, marginTop: 3 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  cardName: { fontSize: 13, fontWeight: '500', color: palette.tx, flex: 1, paddingRight: 8 },
  cardMeta: { fontSize: 11, color: palette.tx2, marginBottom: 7 },
  cardFoot: { flexDirection: 'row', justifyContent: 'space-between' },
  cardFootText: { fontSize: 11, color: palette.tx2 },
  micWrap: { alignItems: 'center', paddingVertical: 8, paddingBottom: 14 },
  mic: { width: 60, height: 60, borderRadius: 30, backgroundColor: palette.purple, alignItems: 'center', justifyContent: 'center' },
  activityRow: { flexDirection: 'row', gap: 10, padding: 10, paddingHorizontal: 14, alignItems: 'center' },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: palette.border },
  actDot: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  actText: { fontSize: 12, color: palette.tx2, lineHeight: 17 },
  actMeta: { fontSize: 10.5, color: palette.tx3, marginTop: 2 },
  empty: { fontSize: 12, color: palette.tx2, lineHeight: 18 },
});
