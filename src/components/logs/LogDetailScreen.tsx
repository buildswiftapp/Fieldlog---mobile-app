import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertTriangleIcon } from '@/components/icons';
import { Badge, Button, Card } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { getLogDetail, getLogPhotoUrl, reviewLog, type LogDetail } from '@/lib/logs';
import { palette, radius, roleThemes } from '@/theme';

type Props = { role: 'gc' | 'sub'; logId: string };

function formatDate(value: string) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString(undefined, { dateStyle: 'medium' });
}

export function LogDetailScreen({ role, logId }: Props) {
  const { organization } = useAuth();
  const theme = roleThemes[role];
  const accent = organization?.brand_color ?? theme.accent;

  const [detail, setDetail] = useState<LogDetail | null>(null);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const next = await getLogDetail(logId);
      setDetail(next);
      const entries = await Promise.all(
        next.photos.map(async (p) => [p.id, await getLogPhotoUrl(p.storage_path)] as const),
      );
      setPhotoUrls(Object.fromEntries(entries.filter(([, url]) => url) as [string, string][]));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load this log.');
    } finally {
      setLoading(false);
    }
  }, [logId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function onReview() {
    setReviewing(true);
    try {
      await reviewLog(logId);
      await load();
    } finally {
      setReviewing(false);
    }
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
        <Text style={styles.error}>{error ?? 'Log not found.'}</Text>
      </SafeAreaView>
    );
  }

  const { log, project_name, author_name, photos, alerts } = detail;
  const s = log.structured ?? {};
  const sections: { label: string; items: string[] }[] = [
    { label: 'Work completed', items: s.work_completed ?? [] },
    { label: 'Delays', items: s.delays ?? [] },
    { label: 'Materials', items: s.materials ?? [] },
    { label: 'Safety', items: s.safety ?? [] },
    { label: 'Visitors', items: s.visitors ?? [] },
  ].filter((sec) => sec.items.length > 0);

  const canReview = role === 'gc' && log.status === 'submitted' && log.author_org_id !== organization?.id;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.project}>{project_name}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.meta}>{formatDate(log.log_date)}</Text>
            {author_name ? <Text style={styles.meta}>· {author_name}</Text> : null}
            <Badge
              text={log.status === 'reviewed' ? 'Reviewed' : log.status === 'submitted' ? 'Submitted' : 'Draft'}
              color={log.status === 'reviewed' ? palette.green : palette.orange}
              bg={log.status === 'reviewed' ? palette.greenDim : palette.orangeDim}
            />
          </View>
        </View>

        {alerts.length > 0 ? (
          <View style={{ gap: 8, marginBottom: 14 }}>
            {alerts.map((a) => {
              const color = a.severity === 'warning' ? palette.orange : palette.blueLight;
              return (
                <View key={a.id} style={[styles.alertRow, { backgroundColor: `${color}14`, borderColor: `${color}3a` }]}>
                  <AlertTriangleIcon color={color} size={15} />
                  <Text style={styles.alertText}>{a.message}</Text>
                </View>
              );
            })}
          </View>
        ) : null}

        {(s.crew_count != null || s.weather) ? (
          <View style={styles.chips}>
            {s.crew_count != null ? <Badge text={`Crew: ${s.crew_count}`} color={accent} bg={`${accent}22`} /> : null}
            {s.weather ? <Badge text={s.weather} color={palette.tx2} bg={palette.bg4} /> : null}
          </View>
        ) : null}

        {log.summary ? (
          <Card style={{ marginBottom: 14 }}>
            <Text style={styles.sectionLabel}>Summary</Text>
            <Text style={styles.body}>{log.summary}</Text>
          </Card>
        ) : null}

        {sections.map((sec) => (
          <Card key={sec.label} style={{ marginBottom: 10 }}>
            <Text style={styles.sectionLabel}>{sec.label}</Text>
            {sec.items.map((item, i) => (
              <Text key={i} style={styles.item}>
                • {item}
              </Text>
            ))}
          </Card>
        ))}

        {photos.length > 0 ? (
          <View style={styles.photoRow}>
            {photos.map((p) =>
              photoUrls[p.id] ? (
                <Image key={p.id} source={{ uri: photoUrls[p.id] }} style={styles.photo} />
              ) : null,
            )}
          </View>
        ) : null}

        {log.transcript ? (
          <Card style={{ marginTop: 4 }}>
            <Text style={styles.sectionLabel}>Original transcript</Text>
            <Text style={styles.transcript}>{log.transcript}</Text>
          </Card>
        ) : null}

        {canReview ? (
          <View style={{ marginTop: 18 }}>
            <Button
              label={reviewing ? 'Marking…' : 'Mark as reviewed'}
              onPress={onReview}
              loading={reviewing}
              accent={accent}
              onAccent={theme.onAccent}
            />
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 16, paddingBottom: 36 },
  header: { marginBottom: 14 },
  project: { fontSize: 19, fontWeight: '700', color: palette.tx },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 6, flexWrap: 'wrap' },
  meta: { fontSize: 12.5, color: palette.tx2 },
  chips: { flexDirection: 'row', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
  sectionLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: palette.tx3,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  body: { fontSize: 13.5, color: palette.tx, lineHeight: 20 },
  item: { fontSize: 13, color: palette.tx, lineHeight: 19 },
  transcript: { fontSize: 12.5, color: palette.tx2, lineHeight: 18 },
  alertRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', padding: 11, borderRadius: radius.md, borderWidth: 1 },
  alertText: { flex: 1, fontSize: 12, color: palette.tx2, lineHeight: 17 },
  photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  photo: { width: 96, height: 96, borderRadius: 10 },
  error: { color: palette.red, fontSize: 13, textAlign: 'center', paddingHorizontal: 24 },
});
