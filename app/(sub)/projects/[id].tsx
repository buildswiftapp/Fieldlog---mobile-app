import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Screen, AppBar, Breadcrumb } from '@/components/shell';
import { Badge, Btn, Card, Hint, SectionHeader } from '@/components/ui';
import { MicIcon } from '@/components/icons';
import { getProjectDetail, type ProjectDetail } from '@/lib/projects';
import { getProjectLogs, type LogListItem } from '@/lib/logs';
import { cityState, dayOf, logDateLabel, relativeTime } from '@/lib/format';
import { palette } from '@/theme';

export default function SubProjectHome() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [detail, setDetail] = useState<ProjectDetail | null>(null);
  const [logs, setLogs] = useState<LogListItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading || !detail) {
    return (
      <Screen portal="sub" scroll={false}>
        <AppBar title="Project" />
        <ActivityIndicator color={palette.purple} style={{ marginTop: 40 }} />
      </Screen>
    );
  }

  const p = detail.project;
  const day = dayOf(p.start_date);

  return (
    <Screen portal="sub" scroll={false}>
      <Breadcrumb items={[{ label: 'My Projects', onPress: () => router.replace('/(sub)/projects') }, { label: p.name }]} />
      <AppBar title={p.name} badge={<Badge tone="purple">{detail.viewer_role === 'sub' ? 'Sub' : 'GC'}</Badge>} />
      <View style={styles.metaBar}>
        <Text style={styles.metaText}>📍 {cityState(p.city, p.state) || '—'}</Text>
        {day ? <Text style={styles.metaText}>📅 Day {day}</Text> : null}
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 16 }} showsVerticalScrollIndicator={false}>
        <Hint>
          <Text style={{ fontWeight: '600', color: palette.tx2 }}>Your work on this project. </Text>
          Log today's work and review your submission history. Everything goes to the GC for approval.
        </Hint>

        <View style={{ paddingHorizontal: 14, marginTop: 6, gap: 8 }}>
          <Btn
            label="Log Today's Work"
            variant="purple"
            icon={<MicIcon size={14} color="#fff" />}
            onPress={() => router.push({ pathname: '/(sub)/log/new', params: { projectId: p.id } })}
          />
        </View>

        <SectionHeader title="My Log History" />
        {logs.length === 0 ? (
          <Card>
            <Text style={styles.empty}>No logs filed for this project yet. Tap “Log Today's Work” to start.</Text>
          </Card>
        ) : (
          <Card flush>
            {logs.map((log, i) => (
              <Pressable
                key={log.id}
                style={[styles.row, i < logs.length - 1 && styles.rowBorder]}
                onPress={() => router.push(`/(sub)/logs/${log.id}`)}
              >
                <View style={styles.logIcon}>
                  <MicIcon size={13} color={palette.purple} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.logName} numberOfLines={1}>
                    {p.name} — {logDateLabel(log.log_date)}
                  </Text>
                  <Text style={styles.logMeta} numberOfLines={1}>
                    {log.crew_count ? `${log.crew_count} crew · ` : ''}
                    {relativeTime(log.created_at)}
                  </Text>
                </View>
                <Badge tone={log.status === 'reviewed' ? 'green' : log.status === 'rejected' ? 'red' : 'orange'}>
                  {log.status === 'reviewed' ? 'Approved' : log.status === 'rejected' ? 'Rejected' : 'Pending'}
                </Badge>
              </Pressable>
            ))}
          </Card>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  metaBar: { backgroundColor: palette.bg2, borderBottomWidth: 1, borderBottomColor: palette.border, paddingVertical: 8, paddingHorizontal: 14, flexDirection: 'row', gap: 14 },
  metaText: { fontSize: 11, color: palette.tx2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, paddingHorizontal: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: palette.border },
  logIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.purpleDim },
  logName: { fontSize: 12.5, fontWeight: '500', color: palette.tx },
  logMeta: { fontSize: 10.5, color: palette.tx2, marginTop: 1 },
  empty: { fontSize: 12, color: palette.tx2, lineHeight: 18 },
});
