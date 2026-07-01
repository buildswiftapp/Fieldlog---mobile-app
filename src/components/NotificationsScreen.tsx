import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen, AppBar, Breadcrumb } from '@/components/shell';
import { Card } from '@/components/ui';
import { AlertTriangleIcon, CheckCircleIcon, FileTextIcon, BellIcon, SparkleIcon } from '@/components/icons';
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from '@/lib/notifications';
import { relativeTime } from '@/lib/format';
import { palette, roleThemes } from '@/theme';
import type { MobilePortal } from '@/lib/roles';

function iconFor(kind: NotificationItem['kind'], color: string) {
  switch (kind) {
    case 'log_alert':
      return <AlertTriangleIcon size={14} color={palette.orange} />;
    case 'log_reviewed':
      return <CheckCircleIcon size={14} color={palette.green} />;
    case 'log_submitted':
      return <FileTextIcon size={14} color={color} />;
    default:
      return <SparkleIcon size={14} color={color} />;
  }
}

export function NotificationsScreen({ portal }: { portal: MobilePortal }) {
  const router = useRouter();
  const accent = roleThemes[portal].accent;
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await listNotifications();
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const open = async (n: NotificationItem) => {
    if (!n.read_at) {
      markNotificationRead(n.id).catch(() => {});
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x)));
    }
    const base = portal === 'sub' ? '/(sub)' : '/(gc)';
    if (n.log_id) router.push(`${base}/logs/${n.log_id}` as never);
    else if (n.project_id) router.push(`${base}/projects/${n.project_id}` as never);
  };

  const markAll = async () => {
    await markAllNotificationsRead().catch(() => {});
    setItems((prev) => prev.map((x) => ({ ...x, read_at: x.read_at ?? new Date().toISOString() })));
  };

  const hasUnread = items.some((x) => !x.read_at);

  return (
    <Screen portal={portal}>
      <Breadcrumb items={[{ label: 'Home', onPress: () => router.back() }, { label: 'Notifications' }]} />
      <AppBar
        title="Notifications"
        right={
          hasUnread ? (
            <Pressable onPress={markAll} hitSlop={8}>
              <Text style={[styles.markAll, { color: accent }]}>Mark all read</Text>
            </Pressable>
          ) : undefined
        }
      />
      {loading ? (
        <ActivityIndicator color={accent} style={{ marginVertical: 24 }} />
      ) : items.length === 0 ? (
        <View style={styles.emptyWrap}>
          <BellIcon size={28} color={palette.tx3} />
          <Text style={styles.emptyText}>You're all caught up</Text>
          <Text style={styles.emptySub}>New logs, approvals, and AI alerts will appear here.</Text>
        </View>
      ) : (
        <Card flush style={{ marginTop: 10 }}>
          {items.map((n, i) => (
            <Pressable
              key={n.id}
              style={[styles.row, i < items.length - 1 && styles.rowBorder, !n.read_at && { backgroundColor: 'rgba(255,255,255,0.02)' }]}
              onPress={() => open(n)}
            >
              <View style={[styles.dot, { backgroundColor: palette.bg4 }]}>{iconFor(n.kind, accent)}</View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.title} numberOfLines={1}>
                  {n.title}
                </Text>
                {n.body ? (
                  <Text style={styles.body} numberOfLines={2}>
                    {n.body}
                  </Text>
                ) : null}
                <Text style={styles.meta}>
                  {n.project_name ? `${n.project_name} · ` : ''}
                  {relativeTime(n.created_at)}
                </Text>
              </View>
              {!n.read_at ? <View style={[styles.unread, { backgroundColor: accent }]} /> : null}
            </Pressable>
          ))}
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  markAll: { fontSize: 12, fontWeight: '600' },
  emptyWrap: { alignItems: 'center', paddingVertical: 50, gap: 8 },
  emptyText: { fontSize: 14, fontWeight: '600', color: palette.tx },
  emptySub: { fontSize: 12, color: palette.tx2, textAlign: 'center', paddingHorizontal: 40, lineHeight: 17 },
  row: { flexDirection: 'row', gap: 11, padding: 12, paddingHorizontal: 14, alignItems: 'center' },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: palette.border },
  dot: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 13, fontWeight: '500', color: palette.tx },
  body: { fontSize: 11.5, color: palette.tx2, marginTop: 2, lineHeight: 16 },
  meta: { fontSize: 10.5, color: palette.tx3, marginTop: 3 },
  unread: { width: 8, height: 8, borderRadius: 4 },
});
