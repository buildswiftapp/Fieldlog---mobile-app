import type { AlertSeverity, LogStructured } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export type AiAlert = { severity: AlertSeverity; kind: string; message: string };

export type StructuredLogResult = {
  summary: string;
  structured: Required<LogStructured>;
  alerts: AiAlert[];
};

function apiBase() {
  const base = process.env.EXPO_PUBLIC_AUTH_API_URL;
  if (!base) {
    throw new Error('Missing EXPO_PUBLIC_AUTH_API_URL. Point it to your FieldLog web app URL.');
  }
  return base.replace(/\/$/, '');
}

async function accessToken() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('You are signed out. Sign in again to use voice logging.');
  return token;
}

export async function transcribeAudio(uri: string): Promise<string> {
  const token = await accessToken();
  const name = uri.split('/').pop() ?? 'audio.m4a';

  const form = new FormData();
  // React Native FormData accepts a file descriptor object for uploads.
  form.append('file', { uri, name, type: 'audio/m4a' } as unknown as Blob);

  const response = await fetch(`${apiBase()}/api/ai/transcribe`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  const json = (await response.json()) as { text?: string; error?: string };
  if (!response.ok) throw new Error(json.error ?? 'Could not transcribe the recording.');
  return json.text ?? '';
}

export async function structureLog(input: {
  transcript: string;
  projectName?: string;
  trade?: string;
}): Promise<StructuredLogResult> {
  const token = await accessToken();

  const response = await fetch(`${apiBase()}/api/ai/structure-log`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  const json = (await response.json()) as StructuredLogResult & { error?: string };
  if (!response.ok) throw new Error(json.error ?? 'Could not summarize the log.');
  return json;
}
