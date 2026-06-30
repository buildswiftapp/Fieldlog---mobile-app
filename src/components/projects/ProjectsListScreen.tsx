import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRightIcon, MapPinIcon, PlusIcon, UsersIcon } from '@/components/icons';
import { Badge, Card } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { listMyProjects, type ProjectListItem } from '@/lib/projects';
import { palette, radius, roleThemes } from '@/theme';

type Props = { role: 'gc' | 'sub' };

function locationLine(p: ProjectListItem) {
  return [p.address, p.city, p.state].filter(Boolean).join(', ');
}

export function ProjectsListScreen({ role }: Props) {
  const { organization } = useAuth();
  const router = useRouter();
  const theme = roleThemes[role];
  const accent = organization?.brand_color ?? theme.accent;
  const base = role === 'gc' ? '/(gc)/projects' : '/(sub)/projects';

  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const rows = await listMyProjects();
      setProjects(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load projects.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{role === 'gc' ? 'Projects' : 'My Projects'}</Text>
          <Text style={styles.subtitle}>
            {role === 'gc' ? 'Jobs your company runs' : 'Jobs your GC assigned to you'}
          </Text>
        </View>
        {role === 'gc' ? (
          <Pressable
            style={({ pressed }) => [styles.newBtn, { backgroundColor: accent }, pressed && { opacity: 0.8 }]}
            onPress={() => router.push(`${base}/new` as '/')}
          >
            <PlusIcon color={theme.onAccent} size={16} strokeWidth={2.6} />
            <Text style={[styles.newBtnText, { color: theme.onAccent }]}>New</Text>
          </Pressable>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={accent} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              tintColor={palette.tx2}
            />
          }
        >
          {error ? <Text style={styles.error}>{error}</Text> : null}

          {projects.length === 0 && !error ? (
            <Card style={{ marginTop: 4 }}>
              <Text style={styles.emptyTitle}>No projects yet</Text>
              <Text style={styles.emptyBody}>
                {role === 'gc'
                  ? 'Create your first project, then assign your subcontractors and invite your team.'
                  : 'When your GC assigns you to a project, it shows up here.'}
              </Text>
            </Card>
          ) : null}

          {projects.map((p) => (
            <Card key={p.id} style={{ marginBottom: 10 }} onPress={() => router.push(`${base}/${p.id}` as '/')}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <View style={styles.titleRow}>
                    <Text style={styles.projectName} numberOfLines={1}>
                      {p.name}
                    </Text>
                    {p.status === 'archived' ? (
                      <Badge text="Archived" color={palette.tx2} bg={palette.bg4} />
                    ) : null}
                  </View>
                  {locationLine(p) ? (
                    <View style={styles.metaRow}>
                      <MapPinIcon color={palette.tx3} size={12} />
                      <Text style={styles.meta} numberOfLines={1}>
                        {locationLine(p)}
                      </Text>
                    </View>
                  ) : null}
                  <View style={styles.metaRow}>
                    {role === 'gc' ? (
                      <>
                        <UsersIcon color={palette.tx3} size={12} />
                        <Text style={styles.meta}>
                          {p.subcontractor_count ?? 0} subcontractor{(p.subcontractor_count ?? 0) === 1 ? '' : 's'}
                        </Text>
                      </>
                    ) : (
                      <Text style={styles.meta}>
                        {p.gc_org_name ?? 'General contractor'}
                        {p.trade ? ` · ${p.trade}` : ''}
                      </Text>
                    )}
                  </View>
                </View>
                <ChevronRightIcon color={palette.tx3} size={18} />
              </View>
            </Card>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: { fontSize: 20, fontWeight: '700', color: palette.tx },
  subtitle: { fontSize: 12, color: palette.tx2, marginTop: 2 },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  newBtnText: { fontSize: 13, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 16, paddingBottom: 28 },
  error: { color: palette.red, fontSize: 12.5, marginBottom: 12 },
  emptyTitle: { fontSize: 14, fontWeight: '600', color: palette.tx, marginBottom: 5 },
  emptyBody: { fontSize: 12.5, color: palette.tx2, lineHeight: 18 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  projectName: { fontSize: 15, fontWeight: '600', color: palette.tx, flexShrink: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 },
  meta: { fontSize: 12, color: palette.tx2, flexShrink: 1 },
});
