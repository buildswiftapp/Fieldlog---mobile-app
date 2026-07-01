import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen, Breadcrumb } from '@/components/shell';
import { Badge, Card, Hint } from '@/components/ui';
import { listMyProjects, type ProjectListItem } from '@/lib/projects';
import { cityState, dayOf } from '@/lib/format';
import { palette } from '@/theme';

export default function SubProjects() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      listMyProjects()
        .then(setProjects)
        .catch(() => setProjects([]))
        .finally(() => setLoading(false));
    }, []),
  );

  return (
    <Screen nav navActive="projects" portal="sub" scroll={false}>
      <Breadcrumb items={[{ label: 'Home', onPress: () => router.replace('/(sub)/home') }, { label: 'My Projects' }]} />
      <View style={styles.ab}>
        <Text style={styles.abTitle}>My Projects</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 16 }} showsVerticalScrollIndicator={false}>
        <Hint>
          <Text style={{ fontWeight: '600', color: palette.tx2 }}>Projects your GC has assigned you to. </Text>
          Tap any project to log work or view your history. Only a GC can add you to a project.
        </Hint>
        {loading ? (
          <ActivityIndicator color={palette.purple} style={{ marginVertical: 24 }} />
        ) : projects.length === 0 ? (
          <Card>
            <Text style={styles.empty}>No projects assigned yet. Ask your GC to add you to a project.</Text>
          </Card>
        ) : (
          projects.map((p) => {
            const day = dayOf(p.start_date);
            const archived = p.status === 'archived';
            const color = archived ? palette.tx3 : palette.green;
            return (
              <Card key={p.id} onPress={() => router.push(`/(sub)/projects/${p.id}`)} style={{ paddingTop: 0, opacity: archived ? 0.7 : 1 }}>
                <View style={[styles.stripe, { backgroundColor: color }]} />
                <View style={{ paddingTop: 11 }}>
                  <View style={styles.cardTop}>
                    <Text style={styles.cardName}>{p.name}</Text>
                    <Badge tone={archived ? 'gray' : 'green'}>{archived ? 'Closed Out' : 'Active'}</Badge>
                  </View>
                  <Text style={styles.cardMeta}>
                    {cityState(p.city, p.state) || 'No location'}
                    {day ? ` · Day ${day}` : ''}
                  </Text>
                  <View style={styles.grid}>
                    <Text style={styles.gridItem}>
                      GC: <Text style={styles.gridStrong}>{p.gc_org_name ?? '—'}</Text>
                    </Text>
                    <Text style={styles.gridItem}>
                      Trade: <Text style={styles.gridStrong}>{p.trade ?? '—'}</Text>
                    </Text>
                  </View>
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
  ab: { paddingVertical: 13, paddingHorizontal: 16, backgroundColor: palette.bg2, borderBottomWidth: 1, borderBottomColor: palette.border },
  abTitle: { fontSize: 15, fontWeight: '600', color: palette.tx },
  stripe: { height: 3, borderRadius: 3, marginHorizontal: -14 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  cardName: { fontSize: 13, fontWeight: '500', color: palette.tx, flex: 1, paddingRight: 8 },
  cardMeta: { fontSize: 11, color: palette.tx2, marginBottom: 9 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  gridItem: { fontSize: 11, color: palette.tx2, width: '48%' },
  gridStrong: { color: palette.tx },
  empty: { fontSize: 12, color: palette.tx2, lineHeight: 18 },
});
