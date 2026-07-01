import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Polyline, Rect, Circle, Line } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { palette } from '@/theme';
import { roleThemes } from '@/theme';
import { SearchIcon, SettingsIcon, PlusIcon } from '@/components/icons';
import type { MobilePortal } from '@/lib/roles';

export type NavKey = 'home' | 'projects' | 'log' | 'search' | 'settings';

function GridIcon({ color }: { color: string }) {
  return (
    <Svg width={21} height={21} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Rect x="3" y="3" width="7" height="7" rx="1" />
      <Rect x="14" y="3" width="7" height="7" rx="1" />
      <Rect x="3" y="14" width="7" height="7" rx="1" />
      <Rect x="14" y="14" width="7" height="7" rx="1" />
    </Svg>
  );
}
function HomeBuilding({ color }: { color: string }) {
  return (
    <Svg width={21} height={21} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <Polyline points="9 22 9 12 15 12 15 22" />
    </Svg>
  );
}

export function BottomNav({ active, portal }: { active: NavKey; portal: MobilePortal }) {
  const router = useRouter();
  const accent = roleThemes[portal].accent;
  const base = portal === 'sub' ? '/(sub)' : '/(gc)';

  const go = (path: string) => router.replace(`${base}${path}` as never);

  const item = (key: NavKey, label: string, icon: (c: string) => React.ReactNode, path: string) => {
    const on = active === key;
    const color = on ? accent : palette.tx3;
    return (
      <Pressable style={styles.bni} onPress={() => go(path)}>
        {icon(color)}
        <Text style={[styles.bniText, { color }]}>{label}</Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.bnav}>
      {item('home', 'Home', (c) => <GridIcon color={c} />, '/home')}
      {item('projects', 'Projects', (c) => <HomeBuilding color={c} />, '/projects')}
      <Pressable style={styles.bni} onPress={() => go('/log/new')}>
        <View style={[styles.fab, { backgroundColor: accent }]}>
          <PlusIcon size={19} color={portal === 'sub' ? '#fff' : '#000'} strokeWidth={2.5} />
        </View>
        <Text style={[styles.bniText, { color: palette.tx3 }]}>Log</Text>
      </Pressable>
      {item('search', 'Search', (c) => <SearchIcon size={21} color={c} />, '/search')}
      {item('settings', 'Settings', (c) => <SettingsIcon size={21} color={c} />, '/settings')}
    </View>
  );
}

const styles = StyleSheet.create({
  bnav: {
    backgroundColor: palette.bg2,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    flexDirection: 'row',
    alignItems: 'center',
    height: 62,
    paddingHorizontal: 20,
  },
  bni: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  bniText: { fontSize: 9.5 },
  fab: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
