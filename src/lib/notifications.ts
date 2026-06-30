import type { NotificationKind } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export type NotificationItem = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  project_id: string | null;
  log_id: string | null;
  project_name: string | null;
  read_at: string | null;
  created_at: string;
};

export async function listNotifications(limit = 50): Promise<NotificationItem[]> {
  const { data, error } = await supabase.rpc('fl_my_notifications', { p_limit: limit });
  if (error) throw error;
  return (data as NotificationItem[]) ?? [];
}

export async function unreadNotificationCount(): Promise<number> {
  const { data, error } = await supabase.rpc('fl_unread_notification_count');
  if (error) throw error;
  return (data as number) ?? 0;
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase.rpc('fl_mark_notification_read', { p_id: id });
  if (error) throw error;
}

export async function markAllNotificationsRead() {
  const { error } = await supabase.rpc('fl_mark_all_notifications_read');
  if (error) throw error;
}
