import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertTriangleIcon, CameraIcon, CheckCircleIcon, MicIcon } from '@/components/icons';
import { Badge, Button, Card, Field } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { structureLog, transcribeAudio, type AiAlert, type StructuredLogResult } from '@/lib/ai';
import { ensureMicPermission, startRecording, stopRecording } from '@/lib/audioRecorder';
import { createDailyLog, uploadLogPhoto } from '@/lib/logs';
import { listMyProjects, type ProjectListItem } from '@/lib/projects';
import { palette, radius, roleThemes } from '@/theme';

type Props = { role: 'gc' | 'sub'; projectId?: string };

function fmtTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function RecordLogScreen({ role, projectId }: Props) {
  const { organization } = useAuth();
  const router = useRouter();
  const theme = roleThemes[role];
  const accent = organization?.brand_color ?? theme.accent;

  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(projectId ?? null);

  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);

  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState('');
  const [result, setResult] = useState<StructuredLogResult | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const recRef = useRef<unknown>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    listMyProjects()
      .then((rows) => {
        const active = rows.filter((p) => p.status === 'active');
        setProjects(active);
        if (!selectedId && active.length === 1) setSelectedId(active[0].id);
      })
      .catch(() => {});
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [selectedId]);

  const selectedProject = projects.find((p) => p.id === selectedId) ?? null;

  async function onStartRecording() {
    const granted = await ensureMicPermission();
    if (!granted) {
      Alert.alert('Microphone needed', 'Enable microphone access to record a voice log.');
      return;
    }
    try {
      recRef.current = await startRecording();
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch (e) {
      Alert.alert('Could not start recording', e instanceof Error ? e.message : 'Please try again.');
    }
  }

  async function onStopRecording() {
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
    setBusy('Transcribing your log…');
    try {
      const uri = await stopRecording(recRef.current);
      recRef.current = null;
      if (!uri) throw new Error('No audio was captured.');
      const text = await transcribeAudio(uri);
      setTranscript((prev) => (prev ? `${prev}\n${text}` : text));
    } catch (e) {
      Alert.alert('Transcription failed', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setBusy(null);
    }
  }

  async function onGenerate() {
    if (!transcript.trim()) {
      Alert.alert('Nothing to summarize', 'Record or type your log first.');
      return;
    }
    setBusy('Summarizing with AI…');
    try {
      const res = await structureLog({
        transcript: transcript.trim(),
        projectName: selectedProject?.name,
        trade: selectedProject?.trade ?? undefined,
      });
      setResult(res);
      setSummary(res.summary);
    } catch (e) {
      Alert.alert('Could not summarize', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setBusy(null);
    }
  }

  async function onAddPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotos((prev) => [...prev, result.assets[0].uri]);
    }
  }

  async function onSubmit() {
    if (!selectedId) {
      Alert.alert('Pick a project', 'Choose which project this log is for.');
      return;
    }
    if (!transcript.trim() && !summary.trim()) {
      Alert.alert('Empty log', 'Record or type your log before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      const alerts: AiAlert[] = result?.alerts ?? [];
      const created = await createDailyLog({
        projectId: selectedId,
        transcript: transcript.trim() || undefined,
        summary: summary.trim() || undefined,
        structured: result?.structured ?? {},
        crewCount: result?.structured.crew_count ?? null,
        alerts,
      });

      for (const uri of photos) {
        try {
          await uploadLogPhoto(created.id, uri);
        } catch {
          // A failed photo upload should not block the log submission.
        }
      }

      router.back();
    } catch (e) {
      Alert.alert('Could not submit', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Project picker */}
          <Text style={styles.label}>Project</Text>
          {projects.length === 0 ? (
            <Text style={styles.muted}>
              {role === 'gc' ? 'Create a project first to log work.' : 'No projects assigned to you yet.'}
            </Text>
          ) : (
            <View style={styles.chips}>
              {projects.map((p) => {
                const active = p.id === selectedId;
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => setSelectedId(p.id)}
                    style={[
                      styles.chip,
                      active && { backgroundColor: `${accent}22`, borderColor: accent },
                    ]}
                  >
                    <Text style={[styles.chipText, active && { color: accent, fontWeight: '600' }]} numberOfLines={1}>
                      {p.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Recorder */}
          <View style={styles.recordWrap}>
            <Pressable
              onPress={recording ? onStopRecording : onStartRecording}
              disabled={!!busy}
              style={({ pressed }) => [
                styles.micBtn,
                { backgroundColor: recording ? palette.red : accent },
                pressed && { opacity: 0.85 },
              ]}
            >
              {busy ? (
                <ActivityIndicator color={recording ? '#fff' : theme.onAccent} />
              ) : recording ? (
                <View style={styles.stopSquare} />
              ) : (
                <MicIcon color={theme.onAccent} size={30} strokeWidth={2.2} />
              )}
            </Pressable>
            <Text style={styles.recordHint}>
              {busy ? busy : recording ? `Recording… ${fmtTime(seconds)} — tap to stop` : 'Tap to record your daily log'}
            </Text>
          </View>

          {/* Transcript */}
          <Field
            label="Transcript"
            placeholder="Tap the mic, or type your log here…"
            value={transcript}
            onChangeText={setTranscript}
            multiline
            style={styles.multiline}
          />

          <Button
            label="Summarize with AI"
            onPress={onGenerate}
            variant="secondary"
            loading={busy === 'Summarizing with AI…'}
            icon={<CheckCircleIcon color={palette.tx} size={16} />}
          />

          {/* AI result */}
          {result ? (
            <View style={{ marginTop: 16 }}>
              <Field label="Summary" value={summary} onChangeText={setSummary} multiline style={styles.multiline} />

              <StructuredPreview result={result} accent={accent} />

              {result.alerts.length > 0 ? (
                <View style={{ marginTop: 12, gap: 8 }}>
                  {result.alerts.map((a, i) => (
                    <AlertRow key={i} alert={a} />
                  ))}
                </View>
              ) : null}
            </View>
          ) : null}

          {/* Photos */}
          <View style={{ marginTop: 16 }}>
            <Text style={styles.label}>Photos</Text>
            <View style={styles.photoRow}>
              {photos.map((uri) => (
                <Image key={uri} source={{ uri }} style={styles.photo} />
              ))}
              <Pressable style={styles.addPhoto} onPress={onAddPhoto}>
                <CameraIcon color={palette.tx2} size={20} />
              </Pressable>
            </View>
          </View>

          <View style={{ marginTop: 20 }}>
            <Button
              label={submitting ? 'Submitting…' : role === 'sub' ? 'Submit to GC' : 'Save Daily Log'}
              onPress={onSubmit}
              loading={submitting}
              accent={accent}
              onAccent={theme.onAccent}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function StructuredPreview({ result, accent }: { result: StructuredLogResult; accent: string }) {
  const s = result.structured;
  const sections: { label: string; items: string[] }[] = [
    { label: 'Work completed', items: s.work_completed },
    { label: 'Delays', items: s.delays },
    { label: 'Materials', items: s.materials },
    { label: 'Safety', items: s.safety },
    { label: 'Visitors', items: s.visitors },
  ];
  return (
    <Card style={{ marginTop: 4, gap: 10 }}>
      <View style={styles.metaChips}>
        {s.crew_count != null ? <Badge text={`Crew: ${s.crew_count}`} color={accent} bg={`${accent}22`} /> : null}
        {s.weather ? <Badge text={s.weather} color={palette.tx2} bg={palette.bg4} /> : null}
      </View>
      {sections
        .filter((sec) => sec.items.length > 0)
        .map((sec) => (
          <View key={sec.label}>
            <Text style={styles.previewLabel}>{sec.label}</Text>
            {sec.items.map((item, i) => (
              <Text key={i} style={styles.previewItem}>
                • {item}
              </Text>
            ))}
          </View>
        ))}
    </Card>
  );
}

function AlertRow({ alert }: { alert: AiAlert }) {
  const color = alert.severity === 'warning' ? palette.orange : palette.blueLight;
  return (
    <View style={[styles.alertRow, { backgroundColor: `${color}14`, borderColor: `${color}3a` }]}>
      <AlertTriangleIcon color={color} size={15} />
      <Text style={styles.alertText}>{alert.message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  scroll: { padding: 16, paddingBottom: 40 },
  label: { fontSize: 11, fontWeight: '600', color: palette.tx2, marginBottom: 8 },
  muted: { fontSize: 12.5, color: palette.tx3, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 6 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: palette.border2,
    backgroundColor: palette.bg3,
    maxWidth: 200,
  },
  chipText: { fontSize: 12.5, color: palette.tx2 },
  recordWrap: { alignItems: 'center', paddingVertical: 22, gap: 12 },
  micBtn: { width: 84, height: 84, borderRadius: radius.round, alignItems: 'center', justifyContent: 'center' },
  stopSquare: { width: 26, height: 26, borderRadius: 5, backgroundColor: '#fff' },
  recordHint: { fontSize: 12.5, color: palette.tx2 },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  metaChips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  previewLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: palette.tx3,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  previewItem: { fontSize: 12.5, color: palette.tx, lineHeight: 18 },
  alertRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', padding: 11, borderRadius: radius.md, borderWidth: 1 },
  alertText: { flex: 1, fontSize: 12, color: palette.tx2, lineHeight: 17 },
  photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photo: { width: 64, height: 64, borderRadius: 9 },
  addPhoto: {
    width: 64,
    height: 64,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: palette.border2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.bg3,
  },
});
