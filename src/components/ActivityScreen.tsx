import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen, AppBar, Breadcrumb } from '@/components/shell';
import { Badge, Card } from '@/components/ui';
import { CheckCircleIcon, MicIcon } from '@/components/icons';
import { listRecentLogs, type LogListItem } from '@/lib/logs';
import { logDateLabel, relativeTime } from '@/lib/format';
import { palette, roleThemes } from '@/theme';
import type { MobilePortal } from '@/lib/roles';

export function ActivityScreen({ portal }: { portal: MobilePortal }) {
  const router = useRouter();
  const base = portal === 'sub' ? '/(sub)' : '/(gc)';
  const theme = roleThemes[portal];
  const [logs, setLogs] = useState<LogListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      listRecentLogs(30)
        .then(setLogs)
        .catch(() => setLogs([]))
        .finally(() => setLoading(false));
    }, []),
  );

  return (
    <Screen portal={portal}>
      <Breadcrumb items={[{ label: 'Home', onPress: () => router.back() }, { label: 'Activity' }]} />
      <AppBar title="Activity" />
      {loading ? (
        <ActivityIndicator color={theme.accent} style={{ marginTop: 30 }} />
      ) : logs.length === 0 ? (
        <Card>
          <Text style={styles.empty}>No activity yet. Filed logs and approvals show up here.</Text>
        </Card>
      ) : (
        <Card flush style={{ marginTop: 11 }}>
          {logs.map((log, i) => (
            <Pressable
              key={log.id}
              style={[styles.row, i < logs.length - 1 && styles.rowBorder]}
              onPress={() => router.push(`${base}/logs/${log.id}` as never)}
            >
              <View style={[styles.dot, { backgroundColor: log.status === 'reviewed' ? palette.greenDim : theme.accentDim }]}>
                {log.status === 'reviewed' ? <CheckCircleIcon size={12} color={palette.green} /> : <MicIcon size={12} color={theme.accent} />}
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.text} numberOfLines={1}>
                  <Text style={{ color: palette.tx, fontWeight: '500' }}>{log.project_name}</Text>
                  {` — ${log.author_name ?? 'log'}`}
                </Text>
                <Text style={styles.meta}>
                  {logDateLabel(log.log_date)} · {relativeTime(log.created_at)}
                </Text>
              </View>
              <Badge tone={log.status === 'reviewed' ? 'green' : log.status === 'rejected' ? 'red' : log.status === 'submitted' ? 'orange' : 'gray'}>
                {log.status === 'reviewed' ? 'Approved' : log.status === 'rejected' ? 'Rejected' : log.status === 'submitted' ? 'Pending' : 'Draft'}
              </Badge>
            </Pressable>
          ))}
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, padding: 10, paddingHorizontal: 14, alignItems: 'center' },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: palette.border },
  dot: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 12, color: palette.tx2 },
  meta: { fontSize: 10.5, color: palette.tx3, marginTop: 2 },
  empty: { fontSize: 12, color: palette.tx2, lineHeight: 18 },
});
