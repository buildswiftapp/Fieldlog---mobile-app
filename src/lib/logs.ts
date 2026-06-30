import type { AlertSeverity, LogStatus, LogStructured } from '@/lib/database.types';
import type { AiAlert } from '@/lib/ai';
import { supabase } from '@/lib/supabase';

const PHOTO_BUCKET = 'photos';

export type LogListItem = {
  id: string;
  project_id: string;
  project_name: string;
  log_date: string;
  status: LogStatus;
  summary: string | null;
  crew_count: number | null;
  author_name: string | null;
  created_at: string;
};

export type LogPhoto = { id: string; storage_path: string; caption: string | null };
export type LogAlertRow = { id: string; severity: AlertSeverity; kind: string | null; message: string };

export type LogDetail = {
  log: {
    id: string;
    project_id: string;
    log_date: string;
    status: LogStatus;
    transcript: string | null;
    summary: string | null;
    structured: LogStructured;
    crew_count: number | null;
    author_org_id: string | null;
  };
  project_name: string;
  author_name: string | null;
  photos: LogPhoto[];
  alerts: LogAlertRow[];
};

export type HomeAlert = {
  id: string;
  severity: AlertSeverity;
  message: string;
  project_name: string;
  project_id: string;
  log_id: string;
  created_at: string;
};

export type HomeStats = {
  logs_today: number;
  pending_review: number;
  week_logs: number;
  alerts: HomeAlert[];
};

export type CreateLogInput = {
  projectId: string;
  transcript?: string;
  summary?: string;
  structured?: LogStructured;
  crewCount?: number | null;
  alerts?: AiAlert[];
  status?: LogStatus;
};

export async function createDailyLog(input: CreateLogInput): Promise<{ id: string }> {
  const { data, error } = await supabase.rpc('fl_create_daily_log', {
    p_project_id: input.projectId,
    p_transcript: input.transcript ?? null,
    p_summary: input.summary ?? null,
    p_structured: input.structured ?? {},
    p_crew_count: input.crewCount ?? null,
    p_alerts: input.alerts ?? [],
    p_status: input.status ?? 'submitted',
  });
  if (error) throw error;
  return data as { id: string };
}

export async function listRecentLogs(limit = 12): Promise<LogListItem[]> {
  const { data, error } = await supabase.rpc('fl_my_recent_logs', { p_limit: limit });
  if (error) throw error;
  return (data as LogListItem[]) ?? [];
}

export async function getProjectLogs(projectId: string): Promise<LogListItem[]> {
  const { data, error } = await supabase.rpc('fl_project_logs', { p_project_id: projectId });
  if (error) throw error;
  return (data as LogListItem[]) ?? [];
}

export async function getLogDetail(id: string): Promise<LogDetail> {
  const { data, error } = await supabase.rpc('fl_log_detail', { p_id: id });
  if (error) throw error;
  return data as LogDetail;
}

export async function reviewLog(id: string) {
  const { error } = await supabase.rpc('fl_review_log', { p_id: id });
  if (error) throw error;
}

export async function getHomeStats(): Promise<HomeStats> {
  const { data, error } = await supabase.rpc('fl_home_stats');
  if (error) throw error;
  return data as HomeStats;
}

// After a sub submits a log, ask the web app to email the GC a review link.
// Best-effort: if the web URL or Resend isn't configured, this silently no-ops.
export async function requestLogReviewEmail(logId: string) {
  const base = process.env.EXPO_PUBLIC_AUTH_API_URL?.replace(/\/$/, '');
  if (!base) return;
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;
  if (!accessToken) return;
  try {
    await fetch(`${base}/api/review/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ logId }),
    });
  } catch {
    // Non-fatal — the GC can still review the log in-app.
  }
}

// `photos` is a private, org-folder-scoped bucket, so reads need a signed URL.
export async function getLogPhotoUrl(storagePath: string, expiresInSeconds = 3600) {
  const { data, error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);
  if (error || !data) return null;
  return data.signedUrl;
}

// Object paths must begin with the owning organization id to satisfy the
// storage RLS policy (photos_member_rw): {org_id}/{log_id}/{file}.
export async function uploadLogPhoto(orgId: string, logId: string, uri: string) {
  const ext = uri.match(/\.([a-zA-Z0-9]+)(?:\?|$)/)?.[1]?.toLowerCase() ?? 'jpg';
  const path = `${orgId}/${logId}/${Date.now()}.${ext}`;
  const response = await fetch(uri);
  const arrayBuffer = await response.arrayBuffer();
  const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';

  const { error: uploadError } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, arrayBuffer, { upsert: true, contentType });
  if (uploadError) throw uploadError;

  const { error } = await supabase.rpc('fl_add_log_photo', { p_log_id: logId, p_path: path });
  if (error) throw error;
  return path;
}
