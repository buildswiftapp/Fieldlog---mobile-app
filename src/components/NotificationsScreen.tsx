import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import {
  AlertTriangleIcon,
  BellIcon,
  CheckCircleIcon,
  ClipboardIcon,
  HardHatIcon,
} from '@/components/icons';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationsContext';
import type { NotificationKind } from '@/lib/database.types';
import type { NotificationItem } from '@/lib/notifications';
import { palette, radius, roleThemes } from '@/theme';

function timeAgo(value: string) {
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Math.max(0, Date.now() - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function iconFor(kind: NotificationKind, accent: string) {
  switch (kind) {
    case 'log_alert':
      return { Icon: AlertTriangleIcon, color: palette.orange };
    case 'log_reviewed':
      return { Icon: CheckCircleIcon, color: palette.green };
    case 'sub_assigned':
      return { Icon: HardHatIcon, color: accent };
    default:
      return { Icon: ClipboardIcon, color: accent };
  }
}

export function NotificationsScreen({ role }: { role: 'gc' | 'sub' }) {
  const { organization } = useAuth();
  const router = useRouter();
  const theme = roleThemes[role];
  const accent = organization?.brand_color ?? theme.accent;
  const { items, unread, loading, refresh, markRead, markAllRead } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);

  const logsBase = role === 'gc' ? '/(gc)/logs' : '/(sub)/logs';
  const projectsBase = role === 'gc' ? '/(gc)/projects' : '/(sub)/projects';

  function onPressItem(n: NotificationItem) {
    if (!n.read_at) markRead(n.id);
    if (n.log_id) router.push(`${logsBase}/${n.log_id}` as '/');
    else if (n.project_id) router.push(`${projectsBase}/${n.project_id}` as '/');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Alerts</Text>
        {unread > 0 ? (
          <Pressable hitSlop={8} onPress={markAllRead}>
            <Text style={[styles.markAll, { color: accent }]}>Mark all read</Text>
          </Pressable>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={accent} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <View style={[styles.emptyIcon, { backgroundColor: `${accent}1a` }]}>
            <BellIcon color={accent} size={26} />
          </View>
          <Text style={styles.emptyTitle}>You’re all caught up</Text>
          <Text style={styles.emptyBody}>
            {role === 'gc'
              ? 'Sub submissions, AI flags, and reviews will show up here.'
              : 'Assignments and log reviews from your GC will show up here.'}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              tintColor={palette.tx2}
              onRefresh={async () => {
                setRefreshing(true);
                await refresh();
                setRefreshing(false);
              }}
            />
          }
        >
          {items.map((n) => {
            const { Icon, color } = iconFor(n.kind, accent);
            const unreadItem = !n.read_at;
            return (
              <Pressable
                key={n.id}
                onPress={() => onPressItem(n)}
                style={({ pressed }) => [
                  styles.row,
                  unreadItem && styles.rowUnread,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <View style={[styles.rowIcon, { backgroundColor: `${color}1a` }]}>
                  <Icon color={color} size={17} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {n.title}
                  </Text>
                  <Text style={styles.rowBody} numberOfLines={2}>
                    {n.body}
                  </Text>
                  <Text style={styles.rowTime}>{timeAgo(n.created_at)}</Text>
                </View>
                {unreadItem ? <View style={[styles.dot, { backgroundColor: accent }]} /> : null}
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: palette.bg2,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  title: { fontSize: 15, fontWeight: '600', color: palette.tx },
  markAll: { fontSize: 12.5, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36, gap: 10 },
  emptyIcon: { width: 56, height: 56, borderRadius: radius.round, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: palette.tx, marginTop: 4 },
  emptyBody: { fontSize: 12.5, color: palette.tx2, textAlign: 'center', lineHeight: 18 },
  scroll: { padding: 12 },
  row: {
    flexDirection: 'row',
    gap: 12,
    padding: 13,
    borderRadius: radius.lg,
    backgroundColor: palette.bg2,
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  rowUnread: { backgroundColor: palette.bg3, borderColor: palette.border2 },
  rowIcon: { width: 36, height: 36, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 13.5, fontWeight: '600', color: palette.tx },
  rowBody: { fontSize: 12.5, color: palette.tx2, marginTop: 2, lineHeight: 17 },
  rowTime: { fontSize: 11, color: palette.tx3, marginTop: 5 },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
});
