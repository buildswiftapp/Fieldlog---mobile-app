import { ReactNode } from 'react';
import { Pressable, ScrollView, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { palette } from '@/theme';
import { ChevronRightIcon } from '@/components/icons';
import { BottomNav, type NavKey } from '@/components/BottomNav';
import type { MobilePortal } from '@/lib/roles';

/* App bar (top header) */
export function AppBar({
  title,
  right,
  badge,
  compact,
}: {
  title: string;
  right?: ReactNode;
  badge?: ReactNode;
  compact?: boolean;
}) {
  return (
    <View style={[styles.ab, compact && { paddingVertical: 10 }]}>
      <Text style={styles.abTitle} numberOfLines={1}>
        {title}
      </Text>
      {badge}
      {right}
    </View>
  );
}

/* Breadcrumb */
export type Crumb = { label: string; onPress?: () => void };
export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <View style={styles.bc}>
      {items.map((c, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <Text
            style={[styles.bcText, i === items.length - 1 && styles.bcCur]}
            onPress={c.onPress}
            numberOfLines={1}
          >
            {c.label}
          </Text>
          {i < items.length - 1 ? <ChevronRightIcon size={10} color={palette.tx3} /> : null}
        </View>
      ))}
    </View>
  );
}

/* Screen wrapper: scrollable body + optional bottom nav */
export function Screen({
  children,
  nav,
  navActive,
  portal = 'gc',
  scroll = true,
  contentStyle,
}: {
  children: ReactNode;
  nav?: boolean;
  navActive?: NavKey;
  portal?: MobilePortal;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={{ flex: 1, backgroundColor: palette.bg }}>
        {scroll ? (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[{ paddingBottom: 16 }, contentStyle]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[{ flex: 1 }, contentStyle]}>{children}</View>
        )}
        {nav ? <BottomNav active={navActive ?? 'home'} portal={portal} /> : null}
      </View>
    </SafeAreaView>
  );
}

/* Back button row for detail screens that pairs with AppBar */
export function BackBar({ title, right }: { title: string; right?: ReactNode }) {
  const router = useRouter();
  return (
    <View style={styles.ab}>
      <Pressable onPress={() => router.back()} hitSlop={8} style={{ transform: [{ rotate: '180deg' }] }}>
        <ChevronRightIcon size={20} color={palette.tx2} />
      </Pressable>
      <Text style={[styles.abTitle, { flex: 1 }]} numberOfLines={1}>
        {title}
      </Text>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg2 },
  ab: {
    paddingVertical: 13,
    paddingHorizontal: 16,
    backgroundColor: palette.bg2,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  abTitle: { fontSize: 15, fontWeight: '600', color: palette.tx, flex: 1 },
  bc: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 16,
    backgroundColor: palette.bg,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  bcText: { fontSize: 10.5, color: palette.tx3 },
  bcCur: { color: palette.tx2, fontWeight: '500' },
});
