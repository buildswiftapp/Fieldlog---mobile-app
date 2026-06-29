import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Field } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { pickImage } from '@/lib/pickImage';
import { updateOrganization, updateProfileName, uploadOrganizationLogo } from '@/lib/orgBranding';
import { palette, radius, roleThemes } from '@/theme';

const BRAND_SWATCHES: Record<'gc' | 'sub', string[]> = {
  gc: ['#F59E0B', '#2563EB', '#10B981', '#EF4444', '#8B5CF6', '#EC4899'],
  sub: ['#8B5CF6', '#2563EB', '#10B981', '#F59E0B', '#EF4444', '#06B6D4'],
};

function initials(name?: string | null) {
  if (!name) return 'FL';
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
}

export function SettingsScreen({ role }: { role: 'gc' | 'sub' }) {
  const { session, profile, organization, signOut, refresh } = useAuth();
  const theme = roleThemes[role];
  const defaultAccent = theme.accent;

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [companyName, setCompanyName] = useState(organization?.name ?? '');
  const [brandColor, setBrandColor] = useState(organization?.brand_color ?? defaultAccent);
  const [trade, setTrade] = useState(organization?.trade ?? '');
  const [license, setLicense] = useState(organization?.license_number ?? '');
  const [phone, setPhone] = useState(organization?.phone ?? '');
  const [website, setWebsite] = useState(organization?.website ?? '');
  const [logoPreview, setLogoPreview] = useState<string | null>(organization?.logo_url ?? null);
  const [pendingLogoUri, setPendingLogoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    setFullName(profile?.full_name ?? '');
  }, [profile?.full_name]);

  useEffect(() => {
    setCompanyName(organization?.name ?? '');
    setBrandColor(organization?.brand_color ?? defaultAccent);
    setTrade(organization?.trade ?? '');
    setLicense(organization?.license_number ?? '');
    setPhone(organization?.phone ?? '');
    setWebsite(organization?.website ?? '');
    setLogoPreview(organization?.logo_url ?? null);
    setPendingLogoUri(null);
  }, [organization, defaultAccent]);

  const accent = brandColor || defaultAccent;
  const dirty = useMemo(() => {
    if (!organization || !profile) return false;
    return (
      fullName.trim() !== (profile.full_name ?? '') ||
      companyName.trim() !== (organization.name ?? '') ||
      brandColor !== (organization.brand_color ?? defaultAccent) ||
      trade.trim() !== (organization.trade ?? '') ||
      license.trim() !== (organization.license_number ?? '') ||
      phone.trim() !== (organization.phone ?? '') ||
      website.trim() !== (organization.website ?? '') ||
      pendingLogoUri !== null
    );
  }, [
    brandColor,
    companyName,
    defaultAccent,
    fullName,
    license,
    organization,
    pendingLogoUri,
    phone,
    profile,
    trade,
    website,
  ]);

  async function onPickLogo() {
    if (!organization) return;
    setUploadingLogo(true);
    try {
      const uri = await pickImage();
      if (!uri) return;
      setPendingLogoUri(uri);
      setLogoPreview(uri);
    } catch (e) {
      Alert.alert('Logo upload', e instanceof Error ? e.message : 'Could not open your photo library.');
    } finally {
      setUploadingLogo(false);
    }
  }

  async function onSave() {
    if (!profile || !organization) return;
    if (!companyName.trim()) {
      Alert.alert('Company name required', 'Enter your company name before saving.');
      return;
    }

    setSaving(true);
    try {
      if (fullName.trim() !== (profile.full_name ?? '')) {
        await updateProfileName(profile.id, fullName);
      }

      if (pendingLogoUri) {
        const logoUrl = await uploadOrganizationLogo(organization.id, pendingLogoUri);
        setLogoPreview(logoUrl);
        setPendingLogoUri(null);
      }

      await updateOrganization(organization.id, {
        name: companyName.trim(),
        brand_color: brandColor,
        trade: trade.trim() || null,
        license_number: license.trim() || null,
        phone: phone.trim() || null,
        website: website.trim() || null,
      });

      await refresh();
      Alert.alert('Saved', 'Your settings were updated.');
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function onSignOut() {
    setSigningOut(true);
    try {
      await signOut();
    } catch (e) {
      Alert.alert('Sign out failed', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        {dirty ? <Text style={styles.unsaved}>Unsaved changes</Text> : null}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Card>
          <Text style={styles.section}>Account</Text>
          <Field label="Full name" placeholder="Your name" value={fullName} onChangeText={setFullName} autoCapitalize="words" />
          <View style={styles.readOnlyRow}>
            <Text style={styles.readOnlyLabel}>Email</Text>
            <Text style={styles.readOnlyValue}>{profile?.email ?? session?.user.email ?? '—'}</Text>
          </View>
          <View style={styles.readOnlyRow}>
            <Text style={styles.readOnlyLabel}>Role</Text>
            <Text style={[styles.readOnlyValue, { color: accent }]}>{theme.label}</Text>
          </View>
        </Card>

        <Card>
          <Text style={styles.section}>Company Branding</Text>

          <Pressable style={styles.logoRow} onPress={onPickLogo} disabled={uploadingLogo || !organization}>
            <View style={[styles.logoMark, { borderColor: accent, backgroundColor: `${accent}22` }]}>
              {logoPreview ? (
                <Image source={{ uri: logoPreview }} style={styles.logoImage} />
              ) : (
                <Text style={[styles.logoInitials, { color: accent }]}>{initials(companyName)}</Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.logoTitle}>{uploadingLogo ? 'Opening library…' : 'Company logo'}</Text>
              <Text style={styles.logoHint}>Tap to upload PNG or JPG. Shown on your home header and reports.</Text>
            </View>
          </Pressable>

          <Field label="Company name" placeholder="Dawson Construction" value={companyName} onChangeText={setCompanyName} />

          <Text style={styles.fieldLabel}>Brand color</Text>
          <View style={styles.swatches}>
            {BRAND_SWATCHES[role].map((color) => {
              const selected = brandColor === color;
              return (
                <Pressable
                  key={color}
                  style={[styles.swatch, { backgroundColor: color }, selected && styles.swatchSelected]}
                  onPress={() => setBrandColor(color)}
                  accessibilityLabel={`Brand color ${color}`}
                />
              );
            })}
          </View>

          {role === 'sub' ? (
            <>
              <Field label="Trade" placeholder="Electrical" value={trade} onChangeText={setTrade} autoCapitalize="words" />
              <Field label="License number" placeholder="CA-123456" value={license} onChangeText={setLicense} />
            </>
          ) : (
            <>
              <Field label="Phone" placeholder="(555) 123-4567" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
              <Field label="Website" placeholder="yourcompany.com" value={website} onChangeText={setWebsite} autoCapitalize="none" />
            </>
          )}
        </Card>

        <Button
          label={saving ? 'Saving…' : 'Save changes'}
          onPress={onSave}
          loading={saving}
          disabled={!dirty || !organization}
          accent={accent}
          onAccent={role === 'gc' ? '#000000' : '#FFFFFF'}
        />

        <View style={{ height: 10 }} />

        <Button label="Sign Out" variant="secondary" onPress={onSignOut} loading={signingOut} />
      </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: { fontSize: 15, fontWeight: '600', color: palette.tx },
  unsaved: { fontSize: 11, color: palette.orange, fontWeight: '500' },
  scroll: { padding: 14, gap: 12, paddingBottom: 28 },
  section: {
    fontSize: 10.5,
    fontWeight: '700',
    color: palette.tx3,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  readOnlyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  readOnlyLabel: { fontSize: 12.5, color: palette.tx2 },
  readOnlyValue: { fontSize: 12.5, color: palette.tx, fontWeight: '500', flexShrink: 1, textAlign: 'right' },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  logoMark: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: { width: '100%', height: '100%' },
  logoInitials: { fontSize: 16, fontWeight: '700' },
  logoTitle: { fontSize: 13, fontWeight: '600', color: palette.tx, marginBottom: 3 },
  logoHint: { fontSize: 11.5, color: palette.tx3, lineHeight: 16 },
  fieldLabel: { fontSize: 11, fontWeight: '500', color: palette.tx2, marginBottom: 8 },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  swatch: { width: 28, height: 28, borderRadius: radius.round },
  swatchSelected: { borderWidth: 2, borderColor: palette.tx },
});
