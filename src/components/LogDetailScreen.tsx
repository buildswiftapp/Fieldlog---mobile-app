import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppBar, Breadcrumb } from '@/components/shell';
import { Badge, Btn, Card, SectionHeader } from '@/components/ui';
import { AlertTriangleIcon, CheckCircleIcon, LockIcon } from '@/components/icons';
import { getLogDetail, getLogPhotoUrl, reviewLog, type LogDetail } from '@/lib/logs';
import { logDateLabel } from '@/lib/format';
import { palette, roleThemes } from '@/theme';

export function LogDetailScreen({ id, role }: { id: string; role: 'gc' | 'sub' }) {
  const router = useRouter();
  const theme = roleThemes[role];
  const [detail, setDetail] = useState<LogDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [reviewing, setReviewing] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await getLogDetail(id);
      setDetail(d);
      const urls: Record<string, string> = {};
      await Promise.all(
        d.photos.map(async (p) => {
          const url = await getLogPhotoUrl(p.storage_path);
          if (url) urls[p.id] = url;
        }),
      );
      setPhotoUrls(urls);
    } catch (e) {
      Alert.alert('Could not load log', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function approve() {
    setReviewing(true);
    try {
      await reviewLog(id);
      await load();
    } catch (e) {
      Alert.alert('Could not approve', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setReviewing(false);
    }
  }

  if (loading || !detail) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <AppBar title="Daily Log" />
        <ActivityIndicator color={theme.accent} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  const { log, project_name, author_name, photos, alerts } = detail;
  const s = log.structured;
  const sections: { label: string; items?: string[] | null }[] = [
    { label: 'Work Completed', items: s.work_completed },
    { label: 'Delays', items: s.delays },
    { label: 'Materials', items: s.materials },
    { label: 'Safety', items: s.safety },
    { label: 'Visitors', items: s.visitors },
  ];
  const statusBadge =
    log.status === 'reviewed' ? (
      <Badge tone="green">Approved</Badge>
    ) : log.status === 'rejected' ? (
      <Badge tone="red">Rejected</Badge>
    ) : log.status === 'submitted' ? (
      <Badge tone="orange">Pending</Badge>
    ) : (
      <Badge tone="gray">Draft</Badge>
    );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Breadcrumb items={[{ label: project_name, onPress: () => router.back() }, { label: `Log ${logDateLabel(log.log_date)}` }]} />
      <AppBar title={`Daily Log — ${logDateLabel(log.log_date)}`} badge={statusBadge} />
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <View style={styles.metaBar}>
          <Text style={styles.metaText}>{author_name ?? 'Unknown'}</Text>
          {s.crew_count != null ? <Text style={styles.metaText}>👷 {s.crew_count} crew</Text> : null}
          {s.weather ? <Text style={styles.metaText}>☀ {s.weather}</Text> : null}
        </View>

        {alerts.length > 0 ? (
          <View style={{ marginTop: 10, gap: 8, paddingHorizontal: 14 }}>
            {alerts.map((a) => {
              const color = a.severity === 'warning' ? palette.orange : palette.blueLight;
              return (
                <View key={a.id} style={[styles.alertRow, { backgroundColor: `${color}14`, borderColor: `${color}3a` }]}>
                  <AlertTriangleIcon size={15} color={color} />
                  <Text style={styles.alertText}>{a.message}</Text>
                </View>
              );
            })}
          </View>
        ) : null}

        {log.summary ? (
          <>
            <SectionHeader title="Summary" />
            <Card>
              <Text style={styles.body}>{log.summary}</Text>
            </Card>
          </>
        ) : null}

        {sections.some((sec) => sec.items && sec.items.length > 0) ? (
          <>
            <SectionHeader title="Details" />
            <Card style={{ gap: 12 }}>
              {sections
                .filter((sec) => sec.items && sec.items.length > 0)
                .map((sec) => (
                  <View key={sec.label}>
                    <Text style={styles.previewLabel}>{sec.label}</Text>
                    {sec.items!.map((item, i) => (
                      <Text key={i} style={styles.previewItem}>
                        • {item}
                      </Text>
                    ))}
                  </View>
                ))}
            </Card>
          </>
        ) : null}

        {log.transcript ? (
          <>
            <SectionHeader title="Original Transcript" />
            <Card>
              <Text style={styles.transcript}>{log.transcript}</Text>
            </Card>
          </>
        ) : null}

        {photos.length > 0 ? (
          <>
            <SectionHeader title="Photos" right={<Text style={styles.count}>{photos.length}</Text>} />
            <View style={styles.photoGrid}>
              {photos.map((p) =>
                photoUrls[p.id] ? <Image key={p.id} source={{ uri: photoUrls[p.id] }} style={styles.photo} /> : null,
              )}
            </View>
          </>
        ) : null}

        {role === 'gc' && log.status === 'submitted' ? (
          <View style={{ padding: 14, gap: 8 }}>
            <Btn
              label={reviewing ? 'Approving…' : 'Approve Log'}
              loading={reviewing}
              onPress={approve}
              variant="primary"
              accent={palette.green}
              onAccent="#fff"
              icon={<CheckCircleIcon size={14} color="#fff" />}
            />
          </View>
        ) : (
          <View style={styles.sealed}>
            <LockIcon size={13} color={palette.tx3} />
            <Text style={styles.sealedText}>
              {log.status === 'reviewed' ? 'Approved and sealed. ' : ''}This record is part of the permanent timeline.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg2 },
  metaBar: {
    backgroundColor: palette.bg2,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    paddingVertical: 8,
    paddingHorizontal: 14,
    flexDirection: 'row',
    gap: 14,
  },
  metaText: { fontSize: 11.5, color: palette.tx2 },
  body: { fontSize: 13, color: palette.tx, lineHeight: 20 },
  previewLabel: { fontSize: 10.5, fontWeight: '700', color: palette.tx3, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 4 },
  previewItem: { fontSize: 12.5, color: palette.tx, lineHeight: 19 },
  transcript: { fontSize: 12, color: palette.tx2, lineHeight: 19, fontStyle: 'italic' },
  alertRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', padding: 11, borderRadius: 10, borderWidth: 1 },
  alertText: { flex: 1, fontSize: 12, color: palette.tx2, lineHeight: 17 },
  count: { fontSize: 11, color: palette.tx3 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 14 },
  photo: { width: 100, height: 100, borderRadius: 9 },
  sealed: { flexDirection: 'row', gap: 8, alignItems: 'center', margin: 14, padding: 11, backgroundColor: palette.bg3, borderRadius: 10, borderWidth: 1, borderColor: palette.border },
  sealedText: { flex: 1, fontSize: 11.5, color: palette.tx3, lineHeight: 16 },
});
