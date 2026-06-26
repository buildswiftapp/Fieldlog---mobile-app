import { Image, StyleSheet, Text, View } from 'react-native';
import { palette, radius } from '@/theme';

function initials(name?: string | null) {
  if (!name) return 'FL';
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function AppHeader({
  companyName,
  logoUrl,
  firstName,
  accent,
  accentDim,
}: {
  companyName: string;
  logoUrl?: string | null;
  firstName?: string | null;
  accent: string;
  accentDim: string;
}) {
  const now = new Date();
  const dateStr = now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  const timeStr = now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

  return (
    <View style={styles.bar}>
      <View style={[styles.mark, { backgroundColor: accentDim, borderColor: accent }]}>
        {logoUrl ? (
          <Image source={{ uri: logoUrl }} style={styles.logo} />
        ) : (
          <Text style={[styles.markText, { color: accent }]}>{initials(companyName)}</Text>
        )}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.company} numberOfLines={1}>
          {companyName}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          {greeting()}, {firstName ?? 'there'} 👋
        </Text>
        <Text style={styles.time}>
          {dateStr} · {timeStr}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: palette.bg2,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  mark: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logo: { width: '100%', height: '100%' },
  markText: { fontSize: 11, fontWeight: '700' },
  company: { fontSize: 14, fontWeight: '600', color: palette.tx },
  sub: { fontSize: 10.5, color: palette.tx3, marginTop: 1 },
  time: { fontSize: 11, color: palette.tx3, marginTop: 3 },
});
