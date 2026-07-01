import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, AppBar, Breadcrumb } from '@/components/shell';
import { Card, Hint } from '@/components/ui';
import { ChevronDownIcon } from '@/components/icons';
import { palette } from '@/theme';
import type { MobilePortal } from '@/lib/roles';

const GC_FAQ = [
  { q: 'How do I file a daily log?', a: 'Tap the orange mic on Home or inside a project, pick the project, speak naturally about crew, work completed, delays, and safety. AI organizes it and you review before saving.' },
  { q: 'How do I review a subcontractor log?', a: 'Open a project → Sub Logs tab → tap the log. Review the AI summary and any flags, then Approve. Everything is timestamped into the project Timeline.' },
  { q: 'How are weekly / monthly reports created?', a: 'AI compiles your daily logs into owner-ready weekly updates and monthly executive summaries. You approve before anything is sent.' },
  { q: 'How do I add a subcontractor?', a: 'Open a project → Team tab → Invite. Enter their email and trade; they get a free Sub account scoped only to your project.' },
  { q: 'Can a sealed log be changed?', a: 'No. Sealed logs are immutable. You can append a timestamped amendment with a reason — the original record stays intact.' },
];
const SUB_FAQ = [
  { q: 'How do I log my work?', a: 'Tap the purple mic, choose the project your GC assigned you, and speak your update. AI organizes it and you review before submitting to the GC.' },
  { q: 'Who can see my logs?', a: 'Only the GC who assigned you to the project. You only see projects your GC has added you to.' },
  { q: 'What does “awaiting GC” mean?', a: 'Your log has been submitted and is pending your GC’s approval. You’ll be notified when it’s approved.' },
  { q: 'My log was rejected — what now?', a: 'Open the log to read the GC’s reason, make the fix, and resubmit. The history is kept on the record.' },
  { q: 'Is the Sub account free?', a: 'Yes. Subcontractor accounts are always free.' },
];

export function FaqScreen({ portal }: { portal: MobilePortal }) {
  const router = useRouter();
  const [open, setOpen] = useState<number | null>(0);
  const items = portal === 'sub' ? SUB_FAQ : GC_FAQ;
  const accent = portal === 'sub' ? palette.purple : palette.blueLight;

  return (
    <Screen portal={portal}>
      <Breadcrumb items={[{ label: 'Settings', onPress: () => router.back() }, { label: 'Ask FieldLog' }]} />
      <AppBar title="Ask FieldLog" />
      <Hint>
        <Text style={{ fontWeight: '600', color: palette.tx2 }}>How to do anything in FieldLog. </Text>
        Browse common questions below. Tap any question to expand the answer.
      </Hint>
      <View style={{ marginTop: 6 }}>
        {items.map((item, i) => {
          const isOpen = open === i;
          return (
            <Card key={i} style={{ paddingVertical: 0 }}>
              <Pressable style={styles.qRow} onPress={() => setOpen(isOpen ? null : i)}>
                <Text style={[styles.q, isOpen && { color: accent }]}>{item.q}</Text>
                <View style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }}>
                  <ChevronDownIcon size={16} color={palette.tx3} />
                </View>
              </Pressable>
              {isOpen ? <Text style={styles.a}>{item.a}</Text> : null}
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  qRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13, gap: 10 },
  q: { flex: 1, fontSize: 13, fontWeight: '500', color: palette.tx },
  a: { fontSize: 12.5, color: palette.tx2, lineHeight: 19, paddingBottom: 13 },
});
