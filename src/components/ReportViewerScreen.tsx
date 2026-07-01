import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, AppBar, Breadcrumb } from '@/components/shell';
import { Badge, Btn, Card, SectionHeader } from '@/components/ui';
import { SparkleIcon } from '@/components/icons';
import { buildPeriodReport, shareProjectReport, type PeriodReport, type ReportPeriod } from '@/lib/reports';
import { palette } from '@/theme';
import type { MobilePortal } from '@/lib/roles';

export function ReportViewerScreen({
  portal,
  projectId,
  projectName,
  period,
}: {
  portal: MobilePortal;
  projectId: string;
  projectName: string;
  period: ReportPeriod;
}) {
  const router = useRouter();
  const [report, setReport] = useState<PeriodReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareState, setShareState] = useState<'idle' | 'sharing' | 'shared' | 'error'>('idle');

  useEffect(() => {
    buildPeriodReport(projectName, period, undefined, projectId)
      .then(setReport)
      .catch(() => setReport(null))
      .finally(() => setLoading(false));
  }, [projectId, projectName, period]);

  async function onShare() {
    if (!report) return;
    setShareState('sharing');
    try {
      await shareProjectReport(projectId, report);
      setShareState('shared');
    } catch {
      setShareState('error');
    }
  }

  return (
    <Screen portal={portal}>
      <Breadcrumb items={[{ label: projectName, onPress: () => router.back() }, { label: period === 'weekly' ? 'Weekly Update' : 'Monthly Summary' }]} />
      <AppBar title={report?.title ?? (period === 'weekly' ? 'Weekly Owner Update' : 'Monthly Executive Summary')} badge={<Badge tone="blue">✨ AI</Badge>} />
      {loading ? (
        <View style={{ alignItems: 'center', paddingVertical: 40, gap: 10 }}>
          <ActivityIndicator color={palette.blueLight} />
          <Text style={styles.loadingText}>Compiling logs into a summary…</Text>
        </View>
      ) : !report ? (
        <Card>
          <Text style={styles.empty}>Could not generate this report.</Text>
        </Card>
      ) : (
        <>
          <View style={styles.head}>
            <Text style={styles.project}>{projectName}</Text>
            <Text style={styles.range}>{report.rangeLabel}</Text>
            <View style={styles.headStats}>
              <Stat label="Logs" value={String(report.logCount)} color={palette.blueLight} />
              {report.crewAvg != null ? <Stat label="Avg Crew" value={String(report.crewAvg)} color={palette.green} /> : null}
              <Stat label="Delays" value={String(report.delays.length)} color={report.delays.length ? palette.orange : palette.green} />
            </View>
          </View>

          <View style={styles.aiCard}>
            <View style={styles.aiHead}>
              <SparkleIcon size={13} color={palette.blueLight} />
              <Text style={styles.aiLabel}>AI NARRATIVE</Text>
            </View>
            <Text style={styles.narrative}>{report.narrative}</Text>
          </View>

          <Section title="Accomplishments" items={report.accomplishments} empty="No completed work items recorded." />
          <Section title="Delays & Issues" items={report.delays} empty="No delays reported." />
          <Section title="Safety" items={report.safety} empty="No safety incidents." />
          {report.materials.length ? <Section title="Materials" items={report.materials} /> : null}

          {portal === 'gc' ? (
            <View style={styles.shareWrap}>
              <Btn
                label={
                  shareState === 'sharing'
                    ? 'Sharing…'
                    : shareState === 'shared'
                      ? '✓ Shared with owner'
                      : 'Share with owner'
                }
                onPress={onShare}
                disabled={shareState === 'sharing' || shareState === 'shared'}
              />
              {shareState === 'shared' ? (
                <Text style={styles.shareNote}>This summary is now visible in the owner portal.</Text>
              ) : shareState === 'error' ? (
                <Text style={styles.shareError}>Couldn’t share the report. Please try again.</Text>
              ) : (
                <Text style={styles.shareNote}>Publishes this summary to the owner’s report portal.</Text>
              )}
            </View>
          ) : null}
        </>
      )}
    </Screen>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Section({ title, items, empty }: { title: string; items: string[]; empty?: string }) {
  return (
    <>
      <SectionHeader title={title} />
      <Card>
        {items.length === 0 ? (
          <Text style={styles.empty}>{empty ?? 'Nothing recorded.'}</Text>
        ) : (
          items.map((item, i) => (
            <Text key={i} style={styles.item}>
              • {item}
            </Text>
          ))
        )}
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  loadingText: { fontSize: 12, color: palette.tx2 },
  head: { paddingHorizontal: 14, paddingTop: 12 },
  project: { fontSize: 16, fontWeight: '600', color: palette.tx },
  range: { fontSize: 12, color: palette.tx2, marginTop: 2 },
  headStats: { flexDirection: 'row', gap: 8, marginTop: 12 },
  stat: { flex: 1, backgroundColor: palette.bg3, borderWidth: 1, borderColor: palette.border, borderRadius: 10, padding: 10, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '600' },
  statLabel: { fontSize: 10, color: palette.tx3, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 3 },
  aiCard: { marginHorizontal: 14, marginTop: 12, backgroundColor: 'rgba(37,99,235,0.06)', borderWidth: 1, borderColor: 'rgba(37,99,235,0.2)', borderRadius: 12, padding: 13 },
  aiHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 7 },
  aiLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.6, color: palette.blueLight },
  narrative: { fontSize: 13, color: palette.tx, lineHeight: 20 },
  item: { fontSize: 12.5, color: palette.tx, lineHeight: 20 },
  empty: { fontSize: 12, color: palette.tx2 },
  shareWrap: { paddingHorizontal: 14, paddingTop: 18, gap: 8 },
  shareNote: { fontSize: 11.5, color: palette.tx2, textAlign: 'center' },
  shareError: { fontSize: 11.5, color: palette.orange, textAlign: 'center' },
});
