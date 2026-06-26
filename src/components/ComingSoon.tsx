import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { palette } from '@/theme';

export function ComingSoon({ title, milestone, blurb }: { title: string; milestone: string; blurb: string }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.body}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{milestone}</Text>
        </View>
        <Text style={styles.blurb}>{blurb}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: palette.bg2,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  title: { fontSize: 15, fontWeight: '600', color: palette.tx },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 12 },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: palette.bg3,
    borderWidth: 1,
    borderColor: palette.border2,
  },
  badgeText: { fontSize: 11, fontWeight: '600', color: palette.tx2, letterSpacing: 0.5 },
  blurb: { fontSize: 13, color: palette.tx2, textAlign: 'center', lineHeight: 19 },
});
