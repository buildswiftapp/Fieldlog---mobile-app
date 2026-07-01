import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '@/components/shell';
import { Badge, Btn, Card, HealthBar, Hint, Pill } from '@/components/ui';
import { PlusIcon, SearchIcon } from '@/components/icons';
import { listMyProjects, type ProjectListItem } from '@/lib/projects';
import { cityState, dayOf } from '@/lib/format';
import { palette } from '@/theme';

type Filter = 'all' | 'active' | 'archived';

export default function GcProjects() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');

  const load = useCallback(async () => {
    try {
      setProjects(await listMyProjects());
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const counts = useMemo(
    () => ({
      all: projects.length,
      active: projects.filter((p) => p.status === 'active').length,
      archived: projects.filter((p) => p.status === 'archived').length,
    }),
    [projects],
  );

  const filtered = projects.filter((p) => (filter === 'all' ? true : p.status === filter));

  return (
    <Screen nav navActive="projects" portal="gc" scroll={false}>
      <View style={styles.ab}>
        <Text style={styles.abTitle}>Projects</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <SearchIcon size={18} color={palette.tx2} />
          <Btn
            label="New"
            icon={<PlusIcon size={12} color="#000" strokeWidth={2.5} />}
            onPress={() => router.push('/(gc)/projects/new')}
            style={{ paddingVertical: 6, paddingHorizontal: 12 }}
            textStyle={{ fontSize: 12 }}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 16 }} showsVerticalScrollIndicator={false}>
        <Hint>
          <Text style={{ fontWeight: '600', color: palette.tx2 }}>Tap any project to open it. </Text>
          All logs, tasks, activity, reports, team, and timeline live inside. Tap New to start one.
        </Hint>

        <View style={styles.pills}>
          <Pill label={`All (${counts.all})`} on={filter === 'all'} onPress={() => setFilter('all')} />
          <Pill label={`Active (${counts.active})`} on={filter === 'active'} onPress={() => setFilter('active')} />
          <Pill label={`Archived (${counts.archived})`} on={filter === 'archived'} onPress={() => setFilter('archived')} />
        </View>

        {loading ? (
          <ActivityIndicator color={palette.orange} style={{ marginVertical: 24 }} />
        ) : filtered.length === 0 ? (
          <Card>
            <Text style={styles.empty}>
              {projects.length === 0
                ? 'No projects yet. Tap New to create your first project.'
                : 'No projects in this filter.'}
            </Text>
          </Card>
        ) : (
          filtered.map((p) => {
            const day = dayOf(p.start_date);
            const archived = p.status === 'archived';
            const color = archived ? palette.tx3 : palette.green;
            return (
              <Card key={p.id} onPress={() => router.push(`/(gc)/projects/${p.id}`)} style={{ paddingTop: 0 }}>
                <View style={[styles.topStripe, { backgroundColor: color }]} />
                <View style={{ paddingTop: 11 }}>
                  <View style={styles.cardTop}>
                    <Text style={styles.cardName}>{p.name}</Text>
                    <Badge tone={archived ? 'gray' : 'green'}>{archived ? 'Archived' : 'On Track'}</Badge>
                  </View>
                  <Text style={styles.cardMeta}>
                    {cityState(p.city, p.state) || 'No location'}
                    {day ? ` · Day ${day}` : ''}
                  </Text>
                  <View style={styles.grid}>
                    <Text style={styles.gridItem}>
                      Subs: <Text style={styles.gridStrong}>{p.subcontractor_count ?? 0}</Text>
                    </Text>
                    <Text style={styles.gridItem}>
                      Started: <Text style={styles.gridStrong}>{p.start_date ?? '—'}</Text>
                    </Text>
                  </View>
                  <HealthBar pct={archived ? 100 : 72} color={color} style={{ marginBottom: 0 }} />
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  ab: {
    paddingVertical: 13,
    paddingHorizontal: 16,
    backgroundColor: palette.bg2,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  abTitle: { fontSize: 15, fontWeight: '600', color: palette.tx },
  pills: { flexDirection: 'row', gap: 6, paddingHorizontal: 14, paddingVertical: 9, flexWrap: 'wrap' },
  topStripe: { height: 3, borderRadius: 3, marginHorizontal: -14, marginTop: 0 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  cardName: { fontSize: 13, fontWeight: '500', color: palette.tx, flex: 1, paddingRight: 8 },
  cardMeta: { fontSize: 11, color: palette.tx2, marginBottom: 9 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 8 },
  gridItem: { fontSize: 11, color: palette.tx2, width: '48%' },
  gridStrong: { color: palette.tx },
  empty: { fontSize: 12, color: palette.tx2, lineHeight: 18 },
});
