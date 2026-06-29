import { Linking, StyleSheet, Text, View } from 'react-native';
import { LEGAL } from '@/constants/legal';
import type { MobilePortal } from '@/lib/roles';
import { palette } from '@/theme';

type LegalLinksProps = {
  compact?: boolean;
  portal?: MobilePortal;
};

export function LegalLinks({ compact, portal = 'gc' }: LegalLinksProps) {
  if (portal !== 'gc') return null;

  function open(url: string) {
    Linking.openURL(url).catch(() => {
    });
  }

  if (!compact) {
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
      By continuing, you agree to FieldLog's{' '}
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
