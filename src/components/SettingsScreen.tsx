import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/shell';
import { Badge, Btn, Card, SectionHeader } from '@/components/ui';
import { ChevronRightIcon, HelpCircleIcon, LogOutIcon, ShieldIcon, FileTextIcon } from '@/components/icons';
import { useAuth } from '@/context/AuthContext';
import { initials } from '@/lib/format';
import { palette, roleThemes } from '@/theme';
import { portalLabel, type MobilePortal } from '@/lib/roles';

export function SettingsScreen({ portal }: { portal: MobilePortal }) {
  const router = useRouter();
  const { profile, organization, signOut } = useAuth();
  const theme = roleThemes[portal];
  const [signingOut, setSigningOut] = useState(false);

  async function onSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      router.replace('/(auth)/login');
    } finally {
      setSigningOut(false);
    }
  }

  const orgName = organization?.name ?? 'Your Company';

  return (
    <Screen nav navActive="settings" portal={portal}>
      <View style={styles.ab}>
        <Text style={styles.abTitle}>Settings</Text>
      </View>

      {/* Account header */}
      <Card style={{ marginTop: 11, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={[styles.avatar, { backgroundColor: theme.accentDim, borderColor: theme.accent }]}>
          <Text style={[styles.avatarText, { color: theme.accent }]}>{initials(profile?.full_name || orgName)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{profile?.full_name ?? 'Your Name'}</Text>
          <Text style={styles.email}>{profile?.email ?? ''}</Text>
        </View>
        <Badge tone={portal === 'sub' ? 'purple' : 'orange'}>{portalLabel(portal)}</Badge>
      </Card>

      <SectionHeader title="Organization" />
      <Card flush>
        <Row label="Company" value={orgName} />
        {organization?.trade ? <Row label="Trade" value={organization.trade} border /> : null}
        {organization?.city || organization?.state ? (
          <Row label="Location" value={[organization?.city, organization?.state].filter(Boolean).join(', ')} border />
        ) : null}
      </Card>

      <SectionHeader title="Support" />
      <Card flush>
        <LinkRow icon={<HelpCircleIcon size={18} color={palette.blueLight} />} label="FAQ & Help" onPress={() => router.push(`/${portal === 'sub' ? '(sub)' : '(gc)'}/faq` as never)} />
        <LinkRow icon={<FileTextIcon size={18} color={palette.tx2} />} label="Terms of Service" onPress={() => router.push({ pathname: `/${portal === 'sub' ? '(sub)' : '(gc)'}/legal` as never, params: { doc: 'terms' } })} border />
        <LinkRow icon={<ShieldIcon size={18} color={palette.tx2} />} label="Privacy Policy" onPress={() => router.push({ pathname: `/${portal === 'sub' ? '(sub)' : '(gc)'}/legal` as never, params: { doc: 'privacy' } })} border />
      </Card>

      <View style={{ padding: 14, marginTop: 4 }}>
        <Btn
          label={signingOut ? 'Signing out…' : 'Sign Out'}
          loading={signingOut}
          onPress={onSignOut}
          variant="danger"
          icon={<LogOutIcon size={14} color={palette.red} />}
        />
      </View>
      <Text style={styles.version}>FieldLog · ByldGo</Text>
    </Screen>
  );
}

function Row({ label, value, border }: { label: string; value: string; border?: boolean }) {
  return (
    <View style={[styles.row, border && styles.rowBorder]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}
function LinkRow({ icon, label, onPress, border }: { icon: React.ReactNode; label: string; onPress: () => void; border?: boolean }) {
  return (
    <Pressable style={[styles.linkRow, border && styles.rowBorder]} onPress={onPress}>
      {icon}
      <Text style={styles.linkLabel}>{label}</Text>
      <ChevronRightIcon size={14} color={palette.tx3} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ab: { paddingVertical: 13, paddingHorizontal: 16, backgroundColor: palette.bg2, borderBottomWidth: 1, borderBottomColor: palette.border },
  abTitle: { fontSize: 15, fontWeight: '600', color: palette.tx },
  avatar: { width: 46, height: 46, borderRadius: 23, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 15, fontWeight: '700' },
  name: { fontSize: 14, fontWeight: '600', color: palette.tx },
  email: { fontSize: 12, color: palette.tx2, marginTop: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, paddingHorizontal: 14 },
  rowBorder: { borderTopWidth: 1, borderTopColor: palette.border },
  rowLabel: { fontSize: 12.5, color: palette.tx2 },
  rowValue: { fontSize: 12.5, color: palette.tx, fontWeight: '500', flexShrink: 1, textAlign: 'right' },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, paddingHorizontal: 14 },
  linkLabel: { flex: 1, fontSize: 13, color: palette.tx },
  version: { textAlign: 'center', fontSize: 11, color: palette.tx3, marginTop: 6 },
});
