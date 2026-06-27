import { Linking, StyleSheet, Text, View } from 'react-native';
import { LEGAL } from '@/constants/legal';
import { palette } from '@/theme';

export function LegalLinks({ compact }: { compact?: boolean }) {
  function open(url: string) {
    Linking.openURL(url).catch(() => undefined);
  }

  if (compact) {
    return (
      <View style={styles.compactRow}>
        <Text style={styles.compactLink} onPress={() => open(LEGAL.termsUrl)}>
          Terms of Service
        </Text>
        <Text style={styles.dot}>·</Text>
        <Text style={styles.compactLink} onPress={() => open(LEGAL.privacyUrl)}>
          Privacy Policy
        </Text>
      </View>
    );
  }

  return (
    <Text style={styles.text}>
      By continuing, you agree to our{' '}
      <Text style={styles.link} onPress={() => open(LEGAL.termsUrl)}>
        Terms of Service
      </Text>{' '}
      and{' '}
      <Text style={styles.link} onPress={() => open(LEGAL.privacyUrl)}>
        Privacy Policy
      </Text>
      .
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    textAlign: 'center',
    fontSize: 11,
    color: palette.tx3,
    lineHeight: 17,
    marginTop: 20,
  },
  link: { color: palette.blueLight, fontWeight: '500' },
  compactRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
  },
  compactLink: { fontSize: 11.5, color: palette.blueLight, fontWeight: '500' },
  dot: { fontSize: 11.5, color: palette.tx3 },
});
