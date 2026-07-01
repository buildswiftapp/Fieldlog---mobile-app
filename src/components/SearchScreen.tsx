import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '@/components/shell';
import { Card, useInputBorder } from '@/components/ui';
import { SearchIcon } from '@/components/icons';
import { listMyProjects, type ProjectListItem } from '@/lib/projects';
import { listRecentLogs, type LogListItem } from '@/lib/logs';
import { cityState, logDateLabel } from '@/lib/format';
import { palette } from '@/theme';
import type { MobilePortal } from '@/lib/roles';

export function SearchScreen({ portal }: { portal: MobilePortal }) {
  const router = useRouter();
  const base = portal === 'sub' ? '/(sub)' : '/(gc)';
  const [q, setQ] = useState('');
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [logs, setLogs] = useState<LogListItem[]>([]);
  const searchBorder = useInputBorder(palette.blueLight);

  useFocusEffect(
    useCallback(() => {
      listMyProjects().then(setProjects).catch(() => {});
      listRecentLogs(20).then(setLogs).catch(() => {});
    }, []),
  );

  const query = q.trim().toLowerCase();
  const projHits = useMemo(
    () => (query ? projects.filter((p) => p.name.toLowerCase().includes(query) || (p.city ?? '').toLowerCase().includes(query)) : projects.slice(0, 5)),
    [projects, query],
  );
  const logHits = useMemo(
    () => (query ? logs.filter((l) => l.project_name.toLowerCase().includes(query) || (l.summary ?? '').toLowerCase().includes(query)) : logs.slice(0, 5)),
    [logs, query],
  );

  return (
    <Screen nav navActive="search" portal={portal} scroll={false}>
      <View style={styles.ab}>
        <Text style={styles.abTitle}>Search</Text>
      </View>
      <View
        style={[styles.searchWrap, { borderColor: searchBorder.borderColor }]}
        {...({
          onMouseEnter: () => searchBorder.setHovered(true),
          onMouseLeave: () => searchBorder.setHovered(false),
        } as object)}
      >
        <View style={styles.searchIcon}>
          <SearchIcon size={14} color={palette.tx3} />
        </View>
        <TextInput
          style={styles.search}
          placeholder="Search projects, logs…"
          placeholderTextColor={palette.tx3}
          value={q}
          onChangeText={setQ}
          autoCapitalize="none"
          onFocus={() => searchBorder.setFocused(true)}
          onBlur={() => searchBorder.setFocused(false)}
          className="fl-input"
        />
      </View>

      <View style={{ flex: 1 }}>
        <SectionLabel text={query ? 'Projects' : 'Recent Projects'} />
        {projHits.length === 0 ? (
          <Empty text="No matching projects." />
        ) : (
          <Card flush>
            {projHits.map((p, i) => (
              <Pressable
                key={p.id}
                style={[styles.row, i < projHits.length - 1 && styles.rowBorder]}
                onPress={() => router.push(`${base}/projects/${p.id}` as never)}
              >
                <Text style={styles.rowTitle}>{p.name}</Text>
                <Text style={styles.rowMeta}>{cityState(p.city, p.state) || 'No location'}</Text>
              </Pressable>
            ))}
          </Card>
        )}

        <SectionLabel text={query ? 'Logs' : 'Recent Logs'} />
        {logHits.length === 0 ? (
          <Empty text="No matching logs." />
        ) : (
          <Card flush>
            {logHits.map((l, i) => (
              <Pressable
                key={l.id}
                style={[styles.row, i < logHits.length - 1 && styles.rowBorder]}
                onPress={() => router.push(`${base}/logs/${l.id}` as never)}
              >
                <Text style={styles.rowTitle}>
                  {l.project_name} — {logDateLabel(l.log_date)}
                </Text>
                <Text style={styles.rowMeta} numberOfLines={1}>
                  {l.summary ?? l.status}
                </Text>
              </Pressable>
            ))}
          </Card>
        )}
      </View>
    </Screen>
  );
}

function SectionLabel({ text }: { text: string }) {
  return <Text style={styles.sectionLabel}>{text}</Text>;
}
function Empty({ text }: { text: string }) {
  return (
    <Card>
      <Text style={styles.empty}>{text}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  ab: { paddingVertical: 13, paddingHorizontal: 16, backgroundColor: palette.bg2, borderBottomWidth: 1, borderBottomColor: palette.border },
  abTitle: { fontSize: 15, fontWeight: '600', color: palette.tx },
  searchWrap: {
    marginHorizontal: 14,
    marginVertical: 10,
    position: 'relative',
    backgroundColor: palette.bg3,
    borderWidth: 1,
    borderColor: palette.border2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  searchIcon: { position: 'absolute', left: 10, top: 0, bottom: 0, justifyContent: 'center', zIndex: 1 },
  search: {
    borderWidth: 0,
    paddingVertical: 9,
    paddingLeft: 32,
    paddingRight: 10,
    color: palette.tx,
    fontSize: 13,
    backgroundColor: 'transparent',
  },
  sectionLabel: { fontSize: 10.5, fontWeight: '700', color: palette.tx3, letterSpacing: 0.7, textTransform: 'uppercase', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 7 },
  row: { padding: 11, paddingHorizontal: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: palette.border },
  rowTitle: { fontSize: 12.5, fontWeight: '500', color: palette.tx },
  rowMeta: { fontSize: 11, color: palette.tx2, marginTop: 2 },
  empty: { fontSize: 12, color: palette.tx2 },
});
