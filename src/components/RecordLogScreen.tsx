import { useEffect, useRef, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
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
import { AppBar, Breadcrumb } from '@/components/shell';
import { Badge, Btn, Card, Field, Hint, SectionHeader } from '@/components/ui';
import { AlertTriangleIcon, CameraIcon, MicIcon, SparkleIcon } from '@/components/icons';
import { useAuth } from '@/context/AuthContext';
import { structureLog, transcribeAudio, type AiAlert, type StructuredLogResult } from '@/lib/ai';
import { ensureMicPermission, startRecording, stopRecording } from '@/lib/audioRecorder';
import { createDailyLog, requestLogReviewEmail, uploadLogPhoto } from '@/lib/logs';
import { listMyProjects, type ProjectListItem } from '@/lib/projects';
import { palette, roleThemes } from '@/theme';
import type { Audio } from 'expo-av';

type Props = { role: 'gc' | 'sub'; projectId?: string };
type Step = 1 | 2 | 3 | 4;

function fmtTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function RecordLogScreen({ role, projectId }: Props) {
  const { organization } = useAuth();
  const router = useRouter();
  const theme = roleThemes[role];
  const accent = theme.accent;

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

  const recRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    listMyProjects()
      .then((rows) => {
        const active = rows.filter((p) => p.status === 'active');
        setProjects(active);
        setSelectedId((cur) => cur ?? (active.length === 1 ? active[0].id : null));
      })
      .catch(() => {});
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const selectedProject = projects.find((p) => p.id === selectedId) ?? null;
  const step: Step = result ? 3 : transcript.trim() ? 2 : selectedId ? 2 : 1;

  async function onStartRecording() {
    if (!(await ensureMicPermission())) {
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
    setBusy('Processing with AI…');
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
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!res.canceled && res.assets[0]) setPhotos((prev) => [...prev, res.assets[0].uri]);
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
      const created = await createDailyLog({
        projectId: selectedId,
        transcript: transcript.trim() || undefined,
        summary: summary.trim() || undefined,
        structured: result?.structured ?? {},
        crewCount: result?.structured.crew_count ?? null,
        alerts: result?.alerts ?? [],
      });
      for (const uri of photos) {
        try {
          if (organization?.id) await uploadLogPhoto(organization.id, created.id, uri);
        } catch {}
      }
      if (role === 'sub') await requestLogReviewEmail(created.id);
      router.back();
    } catch (e) {
      Alert.alert('Could not submit', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const steps: { n: number; label: string }[] = [
    { n: 1, label: 'Project' },
    { n: 2, label: 'Record' },
    { n: 3, label: 'AI Review' },
    { n: 4, label: 'Submit' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Breadcrumb items={[{ label: role === 'sub' ? 'Log Work' : 'Home', onPress: () => router.back() }, { label: role === 'sub' ? 'Sub Daily Log' : 'GC Daily Log' }]} />
      <AppBar title={role === 'sub' ? '● New Sub Daily Log' : '● New GC Daily Log'} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 28 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          
          <View style={styles.steps}>
            {steps.map((s, i) => {
              const state = step > s.n ? 'done' : step === s.n ? 'act' : 'todo';
              return (
                <View key={s.n} style={styles.step}>
                  {i < steps.length - 1 ? <View style={styles.stepLine} /> : null}
                  <View
                    style={[
                      styles.sn,
                      state === 'done' && { backgroundColor: accent },
                      state === 'act' && { backgroundColor: palette.blue },
                      state === 'todo' && { backgroundColor: palette.bg4 },
                    ]}
                  >
                    <Text style={[styles.snText, { color: state === 'done' ? theme.onAccent : state === 'act' ? '#fff' : palette.tx3 }]}>
                      {state === 'done' ? '✓' : s.n}
                    </Text>
                  </View>
                  <Text style={[styles.slab, state !== 'todo' && { color: state === 'done' ? accent : palette.tx }]}>{s.label}</Text>
                </View>
              );
            })}
          </View>

          
          <SectionHeader title="Project" />
          {projects.length === 0 ? (
            <Text style={styles.muted}>{role === 'gc' ? 'Create a project first to log work.' : 'No projects assigned to you yet.'}</Text>
          ) : (
            <View style={styles.chips}>
              {projects.map((p) => {
                const active = p.id === selectedId;
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => setSelectedId(p.id)}
                    style={[styles.chip, active && { backgroundColor: theme.accentDim, borderColor: accent }]}
                  >
                    <Text style={[styles.chipText, active && { color: accent, fontWeight: '600' }]} numberOfLines={1}>
                      {p.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          
          <View style={styles.recordWrap}>
            <Pressable
              onPress={recording ? onStopRecording : onStartRecording}
              disabled={!!busy}
              style={({ pressed }) => [styles.mic, { backgroundColor: recording ? palette.red : accent }, pressed && { opacity: 0.85 }]}
            >
              {busy ? (
                <ActivityIndicator color={recording ? '#fff' : theme.onAccent} />
              ) : recording ? (
                <View style={styles.stopSquare} />
              ) : (
                <MicIcon size={28} color={theme.onAccent} strokeWidth={2.2} />
              )}
            </Pressable>
            <Text style={styles.recordHint}>
              {busy ? busy : recording ? `Recording… ${fmtTime(seconds)} — tap to stop` : 'Tap to start recording'}
            </Text>
          </View>

          
          <View style={{ marginHorizontal: 14 }}>
            <Field
              label="Transcript"
              placeholder="Tap the mic, or type your log here…"
              value={transcript}
              onChangeText={setTranscript}
              multiline
              style={styles.multiline}
            />
          </View>
          <View style={{ paddingHorizontal: 14 }}>
            <Btn
              label={busy === 'Processing with AI…' ? 'Processing…' : 'Process with AI →'}
              onPress={onGenerate}
              variant="blue"
              loading={busy === 'Processing with AI…'}
              icon={<SparkleIcon size={14} color="#fff" />}
            />
          </View>

          
          {result ? (
            <View style={{ marginTop: 14 }}>
              <SectionHeader title="AI Review" right={<Badge tone="green">Ready</Badge>} />
              <View style={{ marginHorizontal: 14 }}>
                <Field label="Summary" value={summary} onChangeText={setSummary} multiline style={styles.multiline} />
              </View>
              <StructuredPreview result={result} accent={accent} />
              {result.alerts.length > 0 ? (
                <View style={{ marginHorizontal: 14, gap: 8, marginTop: 4 }}>
                  {result.alerts.map((a, i) => (
                    <AlertRow key={i} alert={a} />
                  ))}
                </View>
              ) : null}
            </View>
          ) : null}

          
          <SectionHeader title="Photos" right={<Text style={styles.photoCount}>{photos.length} attached</Text>} />
          <View style={styles.photoGrid}>
            {photos.map((uri) => (
              <Image key={uri} source={{ uri }} style={styles.photo} />
            ))}
            <Pressable style={styles.addPhoto} onPress={onAddPhoto}>
              <CameraIcon size={18} color={palette.tx3} />
              <Text style={styles.addPhotoText}>Add</Text>
            </Pressable>
          </View>

          <View style={{ padding: 14 }}>
            <Btn
              label={submitting ? 'Submitting…' : role === 'sub' ? 'Submit to GC →' : 'Save Daily Log →'}
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
    <Card style={{ gap: 10 }}>
      <View style={styles.metaChips}>
        {s.crew_count != null ? (
          <View style={[styles.metaChip, { backgroundColor: `${accent}22` }]}>
            <Text style={[styles.metaChipText, { color: accent }]}>Crew: {s.crew_count}</Text>
          </View>
        ) : null}
        {s.weather ? (
          <View style={[styles.metaChip, { backgroundColor: palette.bg4 }]}>
            <Text style={[styles.metaChipText, { color: palette.tx2 }]}>{s.weather}</Text>
          </View>
        ) : null}
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
      <AlertTriangleIcon size={15} color={color} />
      <Text style={styles.alertText}>{alert.message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg2 },
  steps: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 16, backgroundColor: palette.bg2, borderBottomWidth: 1, borderBottomColor: palette.border },
  step: { flex: 1, alignItems: 'center', gap: 3 },
  stepLine: { position: 'absolute', top: 9, left: '50%', right: -50, height: 1, backgroundColor: palette.border },
  sn: { width: 19, height: 19, borderRadius: 10, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  snText: { fontSize: 9, fontWeight: '700' },
  slab: { fontSize: 9, color: palette.tx3 },
  muted: { fontSize: 12.5, color: palette.tx3, marginHorizontal: 14, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 14 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: palette.border2, backgroundColor: palette.bg3, maxWidth: 220 },
  chipText: { fontSize: 12.5, color: palette.tx2 },
  recordWrap: { alignItems: 'center', paddingVertical: 22, gap: 12 },
  mic: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center' },
  stopSquare: { width: 26, height: 26, borderRadius: 5, backgroundColor: '#fff' },
  recordHint: { fontSize: 12.5, color: palette.tx2 },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  metaChips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  metaChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  metaChipText: { fontSize: 11, fontWeight: '500' },
  previewLabel: { fontSize: 10.5, fontWeight: '700', color: palette.tx3, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 4 },
  previewItem: { fontSize: 12.5, color: palette.tx, lineHeight: 18 },
  alertRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', padding: 11, borderRadius: 10, borderWidth: 1 },
  alertText: { flex: 1, fontSize: 12, color: palette.tx2, lineHeight: 17 },
  photoCount: { fontSize: 11, color: palette.tx3 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 14 },
  photo: { width: 72, height: 72, borderRadius: 9 },
  addPhoto: { width: 72, height: 72, borderRadius: 9, borderWidth: 1.5, borderColor: palette.border2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 3, backgroundColor: palette.bg3 },
  addPhotoText: { fontSize: 9, color: palette.tx3 },
});
