import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Screen, AppBar, Breadcrumb } from '@/components/shell';
import { Badge, Btn, Card, Field, HealthBar, Hint, SectionHeader } from '@/components/ui';
import { MicIcon, SparkleIcon, ActivityIcon, ChevronRightIcon } from '@/components/icons';
import { assignSubcontractor, getProjectDetail, type ProjectDetail } from '@/lib/projects';
import { getProjectLogs, type LogListItem } from '@/lib/logs';
import { cityState, dayOf, initials, logDateLabel, relativeTime } from '@/lib/format';
import { palette } from '@/theme';

const TABS = ['Overview', 'GC Logs', 'Sub Logs', 'Team', 'Activity', 'Reports', 'Timeline'] as const;
type Tab = (typeof TABS)[number];

export default function ProjectDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [detail, setDetail] = useState<ProjectDetail | null>(null);
  const [logs, setLogs] = useState<LogListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('Overview');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteTrade, setInviteTrade] = useState('');
  const [inviting, setInviting] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [d, l] = await Promise.all([getProjectDetail(id), getProjectLogs(id).catch(() => [])]);
      setDetail(d);
      setLogs(l);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function submitInvite() {
    if (!id || !inviteEmail.trim()) {
      Alert.alert('Email required', 'Enter the subcontractor’s email.');
      return;
    }
    setInviting(true);
    try {
      await assignSubcontractor(id, inviteEmail.trim(), inviteTrade.trim() || undefined);
      setInviteOpen(false);
      setInviteEmail('');
      setInviteTrade('');
      await load();
    } catch (e) {
      Alert.alert('Could not invite', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setInviting(false);
    }
  }

  if (loading || !detail) {
    return (
      <Screen portal="gc" scroll={false}>
        <AppBar title="Project" />
        <ActivityIndicator color={palette.orange} style={{ marginTop: 40 }} />
      </Screen>
    );
  }

  const p = detail.project;
  const day = dayOf(p.start_date);
  const pending = logs.filter((l) => l.status === 'submitted');

  return (
    <Screen portal="gc" scroll={false}>
      <Breadcrumb
        items={[
          { label: 'Projects', onPress: () => router.replace('/(gc)/projects') },
          { label: p.name },
        ]}
      />
      <AppBar
        title={p.name}
        badge={<Badge tone={p.status === 'archived' ? 'gray' : 'green'}>{p.status === 'archived' ? 'Archived' : 'On Track'}</Badge>}
      />
      <View style={styles.metaBar}>
        <Text style={styles.metaText}>📍 {cityState(p.city, p.state) || '—'}</Text>
        {day ? <Text style={styles.metaText}>📅 Day {day}</Text> : null}
        <Text style={styles.metaText}>👷 {detail.subcontractors.length} subs</Text>
      </View>

      <View style={styles.tabsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {TABS.map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              style={[styles.tab, tab === t && styles.tabActive]}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 16 }} showsVerticalScrollIndicator={false}>
        {tab === 'Overview' ? (
          <>
            <View style={styles.aiCard}>
              <Text style={styles.aiLabel}>✨ AI PROJECT SUMMARY</Text>
              <Text style={styles.aiText}>
                <Text style={{ color: palette.tx, fontWeight: '600' }}>{p.name}</Text> has {logs.length} logged{' '}
                {logs.length === 1 ? 'day' : 'days'} on record, with {pending.length} sub{' '}
                {pending.length === 1 ? 'log' : 'logs'} awaiting your review.
              </Text>
            </View>
            <View style={styles.statRow}>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Logs</Text>
                <Text style={[styles.statValue, { color: palette.green }]}>{logs.length}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Pending Review</Text>
                <Text style={[styles.statValue, { color: palette.orange }]}>{pending.length}</Text>
              </View>
            </View>
            <View style={styles.overviewActions}>
              <Btn label="+ New GC Log" onPress={() => router.push({ pathname: '/(gc)/log/new', params: { projectId: p.id } })} style={{ flex: 1 }} textStyle={{ fontSize: 12 }} />
              <Btn label="Reports" variant="secondary" onPress={() => setTab('Reports')} textStyle={{ fontSize: 12 }} />
              <Btn label="Timeline" variant="secondary" onPress={() => setTab('Timeline')} textStyle={{ fontSize: 12 }} />
            </View>
            <SectionHeader title="Recent Logs" />
            <LogList logs={logs.slice(0, 6)} router={router} />
          </>
        ) : null}

        {tab === 'GC Logs' ? (
          <>
            <LogList logs={logs} router={router} empty="No logs filed for this project yet." />
            <View style={{ padding: 14 }}>
              <Btn label="+ New GC Log" onPress={() => router.push({ pathname: '/(gc)/log/new', params: { projectId: p.id } })} />
            </View>
          </>
        ) : null}

        {tab === 'Sub Logs' ? (
          <>
            <Text style={styles.subHead}>{pending.length} awaiting your approval</Text>
            <LogList logs={pending} router={router} empty="No sub logs awaiting review." purple />
          </>
        ) : null}

        {tab === 'Team' ? (
          <>
            <SectionHeader title="GC Team" />
            <Card flush>
              {detail.members.length === 0 ? (
                <Text style={styles.empty}>No team members yet.</Text>
              ) : (
                detail.members.map((m, i) => (
                  <View key={m.user_id} style={[styles.memberRow, i < detail.members.length - 1 && styles.rowBorder]}>
                    <View style={[styles.avatar, { backgroundColor: palette.blueDim }]}>
                      <Text style={[styles.avatarText, { color: palette.blueLight }]}>{initials(m.full_name || m.email)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.memberName}>{m.full_name || m.email}</Text>
                      <Text style={styles.memberRole}>{m.role}</Text>
                    </View>
                    <Badge tone={m.status === 'active' ? 'green' : 'gray'}>{m.status}</Badge>
                  </View>
                ))
              )}
            </Card>
            <SectionHeader title="Subcontractors" action="+ Invite" onAction={() => setInviteOpen(true)} />
            <Card flush>
              {detail.subcontractors.length === 0 ? (
                <Text style={styles.empty}>No subcontractors assigned yet.</Text>
              ) : (
                detail.subcontractors.map((s, i) => (
                  <View key={s.id} style={[styles.memberRow, i < detail.subcontractors.length - 1 && styles.rowBorder]}>
                    <View style={[styles.avatar, { backgroundColor: palette.purpleDim }]}>
                      <Text style={[styles.avatarText, { color: palette.purple }]}>{initials(s.sub_org_name || s.invited_email)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.memberName}>{s.sub_org_name || s.invited_email}</Text>
                      <Text style={styles.memberRole}>{s.trade || 'Subcontractor'}</Text>
                    </View>
                    <Badge tone={s.status === 'active' ? 'green' : s.status === 'pending' ? 'orange' : 'gray'}>{s.status}</Badge>
                  </View>
                ))
              )}
            </Card>
          </>
        ) : null}

        {tab === 'Activity' ? (
          <LogList logs={logs} router={router} empty="No activity yet." />
        ) : null}

        {tab === 'Reports' ? (
          <>
            <SectionHeader title="AI Reports" />
            <View style={{ paddingHorizontal: 14, gap: 10 }}>
              <Pressable
                style={[styles.reportCard, { borderColor: 'rgba(37,99,235,0.25)' }]}
                onPress={() => router.push({ pathname: '/(gc)/reports/[id]', params: { id: p.id, name: p.name, period: 'weekly' } })}
              >
                <View style={[styles.reportIcon, { backgroundColor: palette.blueDim }]}>
                  <SparkleIcon size={14} color={palette.blueLight} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reportTitle}>Weekly Owner Update</Text>
                  <Text style={styles.reportMeta}>AI compiles the last 7 days of logs · accomplishments · delays</Text>
                </View>
                <ChevronRightIcon size={14} color={palette.tx3} />
              </Pressable>
              <Pressable
                style={[styles.reportCard, { borderColor: 'rgba(16,185,129,0.22)' }]}
                onPress={() => router.push({ pathname: '/(gc)/reports/[id]', params: { id: p.id, name: p.name, period: 'monthly' } })}
              >
                <View style={[styles.reportIcon, { backgroundColor: palette.greenDim }]}>
                  <ActivityIcon size={14} color={palette.green} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reportTitle}>Monthly Executive Summary</Text>
                  <Text style={styles.reportMeta}>AI pulls 30 days · KPI trends · risks · executive narrative</Text>
                </View>
                <ChevronRightIcon size={14} color={palette.tx3} />
              </Pressable>
            </View>
          </>
        ) : null}

        {tab === 'Timeline' ? (
          <>
            <View style={styles.tlNote}>
              <Text style={styles.tlNoteText}>
                Immutable legal record for this project. Every log, AI action, approval, and owner view — timestamped and
                permanent.
              </Text>
            </View>
            <LogList logs={logs} router={router} empty="No timeline records yet." />
          </>
        ) : null}
      </ScrollView>

      <Modal visible={inviteOpen} transparent animationType="slide" onRequestClose={() => setInviteOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setInviteOpen(false)}>
          <Pressable style={styles.modalBox} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Invite Subcontractor</Text>
            <Field label="Email" placeholder="sub@company.com" autoCapitalize="none" keyboardType="email-address" value={inviteEmail} onChangeText={setInviteEmail} />
            <Field label="Trade (optional)" placeholder="Electrical" value={inviteTrade} onChangeText={setInviteTrade} />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
              <Btn label="Cancel" variant="secondary" onPress={() => setInviteOpen(false)} style={{ flex: 1 }} />
              <Btn label={inviting ? 'Sending…' : 'Send Invite'} loading={inviting} onPress={submitInvite} style={{ flex: 1 }} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

function LogList({
  logs,
  router,
  empty,
  purple,
}: {
  logs: LogListItem[];
  router: ReturnType<typeof useRouter>;
  empty?: string;
  purple?: boolean;
}) {
  if (logs.length === 0) {
    return (
      <Card>
        <Text style={styles.empty}>{empty ?? 'Nothing here yet.'}</Text>
      </Card>
    );
  }
  return (
    <Card flush>
      {logs.map((log, i) => (
        <Pressable
          key={log.id}
          style={[styles.logRow, i < logs.length - 1 && styles.rowBorder]}
          onPress={() => router.push(`/(gc)/logs/${log.id}`)}
        >
          <View style={[styles.logIcon, { backgroundColor: purple ? palette.purpleDim : palette.orangeDim }]}>
            <MicIcon size={13} color={purple ? palette.purple : palette.orange} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.logName, purple && { color: palette.purple }]} numberOfLines={1}>
              {purple ? '' : 'GC Log — '}
              {log.project_name} {logDateLabel(log.log_date)}
            </Text>
            <Text style={styles.logMeta} numberOfLines={1}>
              {log.crew_count ? `${log.crew_count} crew · ` : ''}
              {log.summary ?? relativeTime(log.created_at)}
            </Text>
          </View>
          <Badge tone={log.status === 'reviewed' ? 'green' : log.status === 'rejected' ? 'red' : log.status === 'submitted' ? 'orange' : 'gray'}>
            {log.status === 'reviewed' ? '✓' : log.status === 'rejected' ? 'Rejected' : log.status === 'submitted' ? 'Review' : 'Draft'}
          </Badge>
        </Pressable>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  metaBar: {
    backgroundColor: palette.bg2,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    paddingVertical: 8,
    paddingHorizontal: 14,
    flexDirection: 'row',
    gap: 14,
  },
  metaText: { fontSize: 11, color: palette.tx2 },
  tabsWrap: { backgroundColor: palette.bg2, borderBottomWidth: 1, borderBottomColor: palette.border },
  tabs: { paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
  tab: { paddingVertical: 5, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: palette.border2 },
  tabActive: { borderColor: palette.orange, backgroundColor: palette.orangeDim },
  tabText: { fontSize: 12, color: palette.tx2 },
  tabTextActive: { color: palette.orange, fontWeight: '500' },
  aiCard: {
    backgroundColor: palette.bg3,
    borderWidth: 1,
    borderColor: 'rgba(37,99,235,0.2)',
    borderRadius: 12,
    padding: 11,
    paddingHorizontal: 12,
    marginHorizontal: 14,
    marginTop: 11,
    marginBottom: 9,
  },
  aiLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.6, color: palette.blueLight, marginBottom: 7 },
  aiText: { fontSize: 12, color: palette.tx2, lineHeight: 19 },
  statRow: { flexDirection: 'row', gap: 8, marginHorizontal: 14, marginBottom: 10 },
  stat: { flex: 1, backgroundColor: palette.bg3, borderWidth: 1, borderColor: palette.border, borderRadius: 10, padding: 11 },
  statLabel: { fontSize: 10, color: palette.tx3, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: '600' },
  overviewActions: { flexDirection: 'row', gap: 8, paddingHorizontal: 14, marginBottom: 10 },
  subHead: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: palette.orange, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 6 },
  logRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, paddingHorizontal: 14 },
  logIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  logName: { fontSize: 12.5, fontWeight: '500', color: palette.tx },
  logMeta: { fontSize: 10.5, color: palette.tx2, marginTop: 1 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: palette.border },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, paddingHorizontal: 14 },
  avatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 11, fontWeight: '700' },
  memberName: { fontSize: 13, fontWeight: '500', color: palette.tx },
  memberRole: { fontSize: 11, color: palette.tx2, textTransform: 'capitalize' },
  tlNote: { marginHorizontal: 14, marginTop: 10, backgroundColor: palette.bg3, borderWidth: 1, borderColor: palette.border, borderRadius: 10, padding: 9, paddingHorizontal: 12 },
  tlNoteText: { fontSize: 11.5, color: palette.tx2, lineHeight: 16 },
  empty: { fontSize: 12, color: palette.tx2, lineHeight: 18, padding: 14 },
  reportCard: { flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: palette.bg2, borderWidth: 1, borderRadius: 12, padding: 13 },
  reportIcon: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  reportTitle: { fontSize: 13.5, fontWeight: '600', color: palette.tx },
  reportMeta: { fontSize: 11, color: palette.tx2, marginTop: 2, lineHeight: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: palette.bg2, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 18, paddingBottom: 28 },
  modalTitle: { fontSize: 14, fontWeight: '600', color: palette.tx, marginBottom: 14 },
});
