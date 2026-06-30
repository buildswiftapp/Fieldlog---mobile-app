import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ClipboardIcon, MailIcon, MapPinIcon, MicIcon, PlusIcon, TrashIcon } from '@/components/icons';
import { Badge, Button, Card, Field } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import {
  assignSubcontractor,
  getProjectDetail,
  inviteMember,
  removeSubcontractor,
  setProjectStatus,
  type ProjectDetail,
} from '@/lib/projects';
import { getProjectLogs, type LogListItem } from '@/lib/logs';
import { palette, radius, roleThemes } from '@/theme';

function formatLogDate(value: string) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

type Props = { role: 'gc' | 'sub'; projectId: string };

function statusColor(status: string) {
  if (status === 'active') return palette.green;
  if (status === 'pending') return palette.orange;
  return palette.tx2;
}

export function ProjectDetailScreen({ role, projectId }: Props) {
  const { organization } = useAuth();
  const router = useRouter();
  const theme = roleThemes[role];
  const accent = organization?.brand_color ?? theme.accent;
  const logsBase = role === 'gc' ? '/(gc)/logs' : '/(sub)/logs';

  const [detail, setDetail] = useState<ProjectDetail | null>(null);
  const [logs, setLogs] = useState<LogListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [subEmail, setSubEmail] = useState('');
  const [subTrade, setSubTrade] = useState('');
  const [subBusy, setSubBusy] = useState(false);

  const [memberEmail, setMemberEmail] = useState('');
  const [memberBusy, setMemberBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [d, l] = await Promise.all([getProjectDetail(projectId), getProjectLogs(projectId).catch(() => [])]);
      setDetail(d);
      setLogs(l);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load this project.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function onAssignSub() {
    if (!subEmail.trim()) return;
    setSubBusy(true);
    try {
      await assignSubcontractor(projectId, subEmail, subTrade);
      setSubEmail('');
      setSubTrade('');
      await load();
    } catch (e) {
      Alert.alert('Could not assign', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setSubBusy(false);
    }
  }

  function onRemoveSub(id: string, label: string) {
    Alert.alert('Remove subcontractor', `Remove ${label} from this project?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeSubcontractor(id);
            await load();
          } catch (e) {
            Alert.alert('Could not remove', e instanceof Error ? e.message : 'Please try again.');
          }
        },
      },
    ]);
  }

  async function onInviteMember() {
    if (!memberEmail.trim()) return;
    setMemberBusy(true);
    try {
      await inviteMember(memberEmail);
      setMemberEmail('');
      Alert.alert('Invite sent', 'They will join your team when they sign in with that email.');
      await load();
    } catch (e) {
      Alert.alert('Could not invite', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setMemberBusy(false);
    }
  }

  function onToggleArchive() {
    if (!detail) return;
    const next = detail.project.status === 'archived' ? 'active' : 'archived';
    Alert.alert(
      next === 'archived' ? 'Archive project' : 'Restore project',
      next === 'archived'
        ? 'Archived projects are hidden from active lists. You can restore them anytime.'
        : 'This project will return to your active list.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: next === 'archived' ? 'Archive' : 'Restore',
          onPress: async () => {
            try {
              await setProjectStatus(projectId, next);
              await load();
            } catch (e) {
              Alert.alert('Could not update', e instanceof Error ? e.message : 'Please try again.');
            }
          },
        },
      ],
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]} edges={['bottom']}>
        <ActivityIndicator color={accent} />
      </SafeAreaView>
    );
  }

  if (!detail) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]} edges={['bottom']}>
        <Text style={styles.error}>{error ?? 'Project not found.'}</Text>
      </SafeAreaView>
    );
  }

  const { project, subcontractors, members } = detail;
  const location = [project.address, project.city, project.state].filter(Boolean).join(', ');
  const isGc = role === 'gc' && detail.viewer_role === 'gc';

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={palette.tx2}
          />
        }
      >
        <View style={styles.headerCard}>
          <View style={styles.titleRow}>
            <Text style={styles.projectName}>{project.name}</Text>
            {project.status === 'archived' ? <Badge text="Archived" color={palette.tx2} bg={palette.bg4} /> : null}
          </View>
          {location ? (
            <View style={styles.metaRow}>
              <MapPinIcon color={palette.tx3} size={13} />
              <Text style={styles.meta}>{location}</Text>
            </View>
          ) : null}
        </View>

        {/* Daily logs */}
        <View style={styles.logHeader}>
          <Text style={styles.sectionTitle}>Daily Logs</Text>
          {project.status === 'active' ? (
            <Pressable
              style={({ pressed }) => [styles.logAdd, { borderColor: accent }, pressed && { opacity: 0.7 }]}
              onPress={() => router.push(`${logsBase}/new?projectId=${projectId}` as '/')}
            >
              <MicIcon color={accent} size={14} strokeWidth={2.3} />
              <Text style={[styles.logAddText, { color: accent }]}>Record</Text>
            </Pressable>
          ) : null}
        </View>
        {logs.length === 0 ? (
          <Text style={styles.emptyLine}>No logs yet. Tap Record to capture today’s work.</Text>
        ) : (
          logs.slice(0, 6).map((log) => (
            <Card key={log.id} style={{ marginBottom: 8 }} onPress={() => router.push(`${logsBase}/${log.id}` as '/')}>
              <View style={styles.subRow}>
                <View style={[styles.logIcon, { backgroundColor: `${accent}22` }]}>
                  <ClipboardIcon color={accent} size={15} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.subName} numberOfLines={1}>
                    {log.summary || 'Daily log'}
                  </Text>
                  <Text style={styles.subMeta}>
                    {formatLogDate(log.log_date)}
                    {log.author_name ? ` · ${log.author_name}` : ''}
                  </Text>
                </View>
                <Badge
                  text={log.status === 'reviewed' ? 'Reviewed' : 'Submitted'}
                  color={log.status === 'reviewed' ? palette.green : palette.orange}
                  bg={log.status === 'reviewed' ? palette.greenDim : palette.orangeDim}
                />
              </View>
            </Card>
          ))
        )}

        {/* Subcontractors */}
        <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Subcontractors</Text>
        {subcontractors.length === 0 ? (
          <Text style={styles.emptyLine}>No subcontractors assigned yet.</Text>
        ) : (
          subcontractors.map((s) => (
            <Card key={s.id} style={{ marginBottom: 8 }}>
              <View style={styles.subRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.subName}>{s.sub_org_name ?? s.invited_email}</Text>
                  <Text style={styles.subMeta}>
                    {s.trade ? `${s.trade} · ` : ''}
                    {s.sub_org_name ? s.invited_email : 'Invitation pending'}
                  </Text>
                </View>
                <Badge
                  text={s.status === 'active' ? 'Active' : s.status === 'pending' ? 'Pending' : 'Removed'}
                  color={statusColor(s.status)}
                  bg={`${statusColor(s.status)}22`}
                />
                {isGc ? (
                  <Pressable hitSlop={8} onPress={() => onRemoveSub(s.id, s.sub_org_name ?? s.invited_email)}>
                    <TrashIcon color={palette.tx3} size={16} />
                  </Pressable>
                ) : null}
              </View>
            </Card>
          ))
        )}

        {isGc ? (
          <Card style={styles.formCard}>
            <Text style={styles.formTitle}>Assign a subcontractor</Text>
            <Field
              label="Their email"
              placeholder="foreman@mesaelectric.com"
              keyboardType="email-address"
              value={subEmail}
              onChangeText={setSubEmail}
            />
            <Field label="Trade (optional)" placeholder="Electrical" value={subTrade} onChangeText={setSubTrade} />
            <Button
              label={subBusy ? 'Assigning…' : 'Assign subcontractor'}
              onPress={onAssignSub}
              loading={subBusy}
              accent={accent}
              onAccent={theme.onAccent}
              icon={<PlusIcon color={theme.onAccent} size={15} strokeWidth={2.6} />}
            />
          </Card>
        ) : null}

        {/* Team (GC only) */}
        {isGc ? (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Your Team</Text>
            {members.map((m) => (
              <Card key={m.user_id} style={{ marginBottom: 8 }}>
                <View style={styles.subRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.subName}>{m.full_name ?? m.email}</Text>
                    <Text style={styles.subMeta}>
                      {m.email} · {m.role}
                    </Text>
                  </View>
                  {m.status !== 'active' ? (
                    <Badge text="Invited" color={palette.orange} bg={palette.orangeDim} />
                  ) : null}
                </View>
              </Card>
            ))}

            <Card style={styles.formCard}>
              <Text style={styles.formTitle}>Invite a teammate</Text>
              <Field
                label="Their email"
                placeholder="pm@yourcompany.com"
                keyboardType="email-address"
                value={memberEmail}
                onChangeText={setMemberEmail}
              />
              <Button
                label={memberBusy ? 'Inviting…' : 'Send invite'}
                onPress={onInviteMember}
                loading={memberBusy}
                variant="secondary"
                icon={<MailIcon color={palette.tx} size={15} />}
              />
            </Card>

            <View style={{ marginTop: 18 }}>
              <Button
                label={project.status === 'archived' ? 'Restore project' : 'Archive project'}
                onPress={onToggleArchive}
                variant="secondary"
              />
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 16, paddingBottom: 36 },
  headerCard: { marginBottom: 18 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  projectName: { fontSize: 20, fontWeight: '700', color: palette.tx, flexShrink: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  meta: { fontSize: 12.5, color: palette.tx2 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: palette.tx3,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    marginBottom: 9,
  },
  emptyLine: { fontSize: 12.5, color: palette.tx2, marginBottom: 8 },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  subName: { fontSize: 14, fontWeight: '600', color: palette.tx },
  subMeta: { fontSize: 12, color: palette.tx2, marginTop: 2 },
  formCard: { marginTop: 6, gap: 2 },
  formTitle: { fontSize: 13, fontWeight: '600', color: palette.tx, marginBottom: 10 },
  error: { color: palette.red, fontSize: 13, textAlign: 'center', paddingHorizontal: 24 },
  logHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    marginBottom: 9,
  },
  logAddText: { fontSize: 12, fontWeight: '600' },
  logIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});
