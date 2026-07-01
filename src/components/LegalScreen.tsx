import { Linking, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen, AppBar, Breadcrumb } from '@/components/shell';
import { Btn, Card } from '@/components/ui';
import { LEGAL } from '@/constants/legal';
import { palette } from '@/theme';
import type { MobilePortal } from '@/lib/roles';

export function LegalScreen({ portal }: { portal: MobilePortal }) {
  const router = useRouter();
  const { doc } = useLocalSearchParams<{ doc?: string }>();
  const isPrivacy = doc === 'privacy';
  const title = isPrivacy ? 'Privacy Policy' : 'Terms of Service';
  const url = isPrivacy ? LEGAL.privacyUrl : LEGAL.termsUrl;

  return (
    <Screen portal={portal}>
      <Breadcrumb items={[{ label: 'Settings', onPress: () => router.back() }, { label: title }]} />
      <AppBar title={title} />
      <Card style={{ marginTop: 11 }}>
        <Text style={styles.h}>{title}</Text>
        <Text style={styles.p}>
          {isPrivacy
            ? 'FieldLog collects only the information needed to operate your daily logs: account details, organization info, project records, photos you attach, and usage data. Records you create are stored securely and shared only with the GC, subs, and owners you grant access to.'
            : 'By using FieldLog you agree to use the service for lawful construction record-keeping. Daily logs you seal become immutable records. You are responsible for the accuracy of the information you submit. ByldGo provides the platform “as is” and continuously improves AI features.'}
        </Text>
        <Text style={styles.p}>
          This in-app summary is provided for convenience. The full, governing document is available on our website.
        </Text>
      </Card>
      <View style={{ paddingHorizontal: 14, marginTop: 4 }}>
        <Btn label={`Open full ${title}`} variant="secondary" onPress={() => Linking.openURL(url)} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  h: { fontSize: 15, fontWeight: '600', color: palette.tx, marginBottom: 10 },
  p: { fontSize: 12.5, color: palette.tx2, lineHeight: 20, marginBottom: 12 },
});
