import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '@/components/AppHeader';
import { ChevronRightIcon, MapPinIcon, PlusIcon } from '@/components/icons';
import { Card, SectionHeader } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { acceptMyInvites, listMyProjects, type ProjectListItem } from '@/lib/projects';
import { palette, radius, roleThemes } from '@/theme';

export function RoleHome({ role }: { role: 'gc' | 'sub' }) {
  const { profile, organization } = useAuth();
  const router = useRouter();
  const theme = roleThemes[role];
  const accent = organization?.brand_color ?? theme.accent;
  const accentDim = `${accent}22`;
  const firstName = profile?.full_name?.split(' ')[0] ?? null;
  const companyName = organization?.name ?? (role === 'gc' ? 'Your Company' : 'Your Trade');
  const base = role === 'gc' ? '/(gc)/projects' : '/(sub)/projects';

  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      await acceptMyInvites().catch(() => {});
      setProjects(await listMyProjects());
    } catch {
      // Home stays usable even if the project list fails to load.
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const activeProjects = projects.filter((p) => p.status === 'active');
  const subTotal = activeProjects.reduce((sum, p) => sum + (p.subcontractor_count ?? 0), 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader
        companyName={companyName}
        logoUrl={organization?.logo_url}
        firstName={firstName}
        accent={accent}
        accentDim={accentDim}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>{role === 'gc' ? 'Active Projects' : 'Assigned Projects'}</Text>
            <Text style={[styles.statValue, { color: accent }]}>{activeProjects.length}</Text>
            <Text style={styles.statSub}>{projects.length} total</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>{role === 'gc' ? 'Subcontractors' : 'Logs This Week'}</Text>
            <Text style={[styles.statValue, { color: palette.tx }]}>{role === 'gc' ? subTotal : 0}</Text>
            <Text style={styles.statSub}>{role === 'gc' ? 'across active jobs' : 'voice logging soon'}</Text>
          </View>
        </View>

        <SectionHeader
          title={role === 'gc' ? 'Your Projects' : 'My Projects'}
          action={projects.length > 0 ? 'View all' : undefined}
          onAction={() => router.push(base as '/')}
        />

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={accent} />
          </View>
        ) : projects.length === 0 ? (
          <Card style={{ marginHorizontal: 14 }}>
            <Text style={styles.emptyTitle}>No projects yet</Text>
            <Text style={styles.emptyBody}>
              {role === 'gc'
                ? 'Create your first project, then assign subcontractors and invite your team.'
                : 'Projects your GC assigns to you will appear here.'}
            </Text>
            {role === 'gc' ? (
              <Pressable
                style={({ pressed }) => [styles.cta, { backgroundColor: accent }, pressed && { opacity: 0.85 }]}
                onPress={() => router.push(`${base}/new` as '/')}
              >
                <PlusIcon color={theme.onAccent} size={15} strokeWidth={2.6} />
                <Text style={[styles.ctaText, { color: theme.onAccent }]}>New Project</Text>
              </Pressable>
            ) : null}
          </Card>
        ) : (
          activeProjects.slice(0, 4).map((p) => (
            <Card
              key={p.id}
              style={{ marginHorizontal: 14, marginBottom: 9 }}
              onPress={() => router.push(`${base}/${p.id}` as '/')}
            >
              <View style={styles.projectRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.projectName} numberOfLines={1}>
                    {p.name}
                  </Text>
                  <View style={styles.metaRow}>
                    {[p.city, p.state].filter(Boolean).length ? (
                      <>
                        <MapPinIcon color={palette.tx3} size={12} />
                        <Text style={styles.meta}>{[p.city, p.state].filter(Boolean).join(', ')}</Text>
                      </>
                    ) : (
                      <Text style={styles.meta}>
                        {role === 'gc'
                          ? `${p.subcontractor_count ?? 0} subcontractor${(p.subcontractor_count ?? 0) === 1 ? '' : 's'}`
                          : (p.gc_org_name ?? 'General contractor')}
                      </Text>
                    )}
                  </View>
                </View>
                <ChevronRightIcon color={palette.tx3} size={18} />
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  stats: { flexDirection: 'row', gap: 8, marginHorizontal: 14, marginTop: 12 },
  stat: {
    flex: 1,
    backgroundColor: palette.bg3,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.lg,
    padding: 13,
  },
  statLabel: { fontSize: 10, color: palette.tx3, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase' },
  statValue: { fontSize: 22, fontWeight: '600', marginTop: 5, lineHeight: 24 },
  statSub: { fontSize: 11, color: palette.tx2, marginTop: 3 },
  loading: { paddingVertical: 28, alignItems: 'center' },
  emptyTitle: { fontSize: 13, fontWeight: '600', color: palette.tx, marginBottom: 4 },
  emptyBody: { fontSize: 12, color: palette.tx2, lineHeight: 17 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  ctaText: { fontSize: 13, fontWeight: '600' },
  projectRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  projectName: { fontSize: 15, fontWeight: '600', color: palette.tx },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 },
  meta: { fontSize: 12, color: palette.tx2, flexShrink: 1 },
});
