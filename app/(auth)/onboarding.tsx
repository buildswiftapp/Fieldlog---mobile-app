import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Field } from '@/components/ui';
import { LegalLinks } from '@/components/LegalLinks';
import { useAuth } from '@/context/AuthContext';
import { palette, roleThemes } from '@/theme';

export default function Onboarding() {
  const { profile, bootstrapOrganization } = useAuth();
  const router = useRouter();
  const userType = profile?.user_type === 'sub' ? 'sub' : 'gc';
  const theme = roleThemes[userType];
  const [companyName, setCompanyName] = useState('');
  const [trade, setTrade] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    if (!companyName.trim()) {
      Alert.alert('Company name required', 'Enter your company name to continue.');
      return;
    }
    if (userType === 'sub' && !trade.trim()) {
      Alert.alert('Trade required', 'Enter your trade to continue.');
      return;
    }

    setLoading(true);
    try {
      await bootstrapOrganization({
        companyName: companyName.trim(),
        userType,
        trade: userType === 'sub' ? trade.trim() : undefined,
      });
      router.replace('/');
    } catch (e) {
      Alert.alert('Could not finish setup', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <Text style={styles.title}>Finish setting up</Text>
            <Text style={styles.tagline}>
              {userType === 'gc'
                ? 'Add your company details to personalize FieldLog.'
                : 'Tell us about your subcontractor company.'}
            </Text>
          </View>

          <Field
            label="Company name"
            placeholder={userType === 'gc' ? 'Dawson Construction' : 'Mesa Electric'}
            value={companyName}
            onChangeText={setCompanyName}
          />

          {userType === 'sub' ? (
            <Field label="Trade" placeholder="Electrical" value={trade} onChangeText={setTrade} autoCapitalize="words" />
          ) : null}

          <Button
            label={loading ? 'Saving…' : 'Continue'}
            onPress={onSubmit}
            loading={loading}
            accent={theme.accent}
            onAccent={theme.onAccent}
          />

          <LegalLinks compact />
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
});
