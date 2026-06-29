import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandLoader } from '@/components/BrandLoader';
import { Button, Field } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { getSignupCompletionData, type PendingSignup } from '@/lib/pendingSignup';
import { type MobilePortal, portalLabel, resolveMobilePortal } from '@/lib/roles';
import { palette, roleThemes } from '@/theme';

export default function Onboarding() {
  const { session, profile, organization, bootstrapOrganization } = useAuth();
  const [accountPortal, setAccountPortal] = useState<MobilePortal | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [trade, setTrade] = useState('');
  const [loading, setLoading] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [setupError, setSetupError] = useState<string | null>(null);

  const userType = accountPortal ?? 'gc';
  const theme = roleThemes[userType];

  useEffect(() => {
    let active = true;

    async function finishSetup(completion: PendingSignup) {
      await bootstrapOrganization({
        companyName: completion.companyName.trim(),
        userType: completion.userType,
        trade: completion.userType === 'sub' ? completion.trade?.trim() : undefined,
      });
    }

    async function hydrate() {
      setSetupError(null);

      if (organization) {
        return;
      }

      const completion = session?.user ? await getSignupCompletionData(session.user) : null;
      const portal = resolveMobilePortal(session, profile, organization, completion);

      if (!active) return;

      if (portal) setAccountPortal(portal);
      else if (completion?.userType) setAccountPortal(completion.userType);

      if (completion?.companyName) setCompanyName(completion.companyName);
      if (completion?.trade) setTrade(completion.trade);

      const resolvedPortal = portal ?? completion?.userType;
      const canAutoComplete =
        completion &&
        completion.companyName.trim() &&
        resolvedPortal === completion.userType &&
        (completion.userType === 'gc' || Boolean(completion.trade?.trim()));

      if (canAutoComplete) {
        try {
          await finishSetup(completion);
          return;
        } catch (e) {
          if (active) {
            setSetupError(e instanceof Error ? e.message : 'Could not finish account setup.');
          }
        }
      }

      setBootstrapping(false);
    }

    hydrate();
    return () => {
      active = false;
    };
  }, [session, profile, organization, bootstrapOrganization]);

  async function onSubmit() {
    if (!accountPortal) {
      Alert.alert('Account type missing', 'Sign out and create a GC or Sub account from the correct portal.');
      return;
    }
    if (!companyName.trim()) {
      Alert.alert('Company name required', 'Enter your company name to continue.');
      return;
    }
    if (accountPortal === 'sub' && !trade.trim()) {
      Alert.alert('Trade required', 'Enter your trade to continue.');
      return;
    }

    setLoading(true);
    setSetupError(null);
    try {
      await bootstrapOrganization({
        companyName: companyName.trim(),
        userType: accountPortal,
        trade: accountPortal === 'sub' ? trade.trim() : undefined,
      });
      setBootstrapping(true);
    } catch (e) {
      setSetupError(e instanceof Error ? e.message : 'Could not finish setup. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (bootstrapping) {
    return <BrandLoader message="Finishing your account…" accent={theme.accent} />;
  }

  const hasSavedCompany = Boolean(companyName.trim());
  const needsTradeOnly = accountPortal === 'sub' && hasSavedCompany;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <Text style={styles.title}>{needsTradeOnly ? 'One more detail' : 'Almost done'}</Text>
            <Text style={styles.tagline}>
              {needsTradeOnly
                ? `Your Sub company "${companyName.trim()}" is saved. Add your trade to continue.`
                : accountPortal
                  ? `Confirm your ${portalLabel(accountPortal)} company to open your portal.`
                  : 'Add your company details to continue.'}
            </Text>
          </View>

          {!needsTradeOnly ? (
            <Field
              label="Company name"
              placeholder={userType === 'gc' ? 'Dawson Construction' : 'Mesa Electric'}
              value={companyName}
              onChangeText={setCompanyName}
            />
          ) : (
            <View style={styles.savedCompany}>
              <Text style={styles.savedLabel}>Company</Text>
              <Text style={styles.savedValue}>{companyName.trim()}</Text>
            </View>
          )}

          {userType === 'sub' ? (
            <Field label="Trade" placeholder="Electrical" value={trade} onChangeText={setTrade} autoCapitalize="words" />
          ) : null}

          {setupError ? <Text style={styles.error}>{setupError}</Text> : null}

          <Button
            label={loading ? 'Saving…' : 'Continue'}
            onPress={onSubmit}
            loading={loading}
            accent={theme.accent}
            onAccent={theme.onAccent}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 32 },
  brand: { alignItems: 'center', marginBottom: 26 },
  title: { fontSize: 19, fontWeight: '600', color: palette.tx, marginBottom: 6 },
  tagline: { fontSize: 12.5, color: palette.tx2, textAlign: 'center', lineHeight: 18 },
  savedCompany: {
    backgroundColor: palette.bg3,
    borderWidth: 1,
    borderColor: palette.border2,
    borderRadius: 9,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  savedLabel: { fontSize: 11, fontWeight: '500', color: palette.tx2, marginBottom: 4 },
  savedValue: { fontSize: 14, color: palette.tx, fontWeight: '500' },
  error: { color: palette.red, fontSize: 12.5, marginBottom: 12, lineHeight: 18, textAlign: 'center' },
});
