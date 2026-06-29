import { StyleSheet, Text, View } from 'react-native';
import { palette } from '@/theme';

export function AuthOrDivider() {
  return (
    <View style={styles.wrap}>
      <View style={styles.line} />
      <Text style={styles.or}>OR</Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 18 },
  line: { flex: 1, height: 1, backgroundColor: palette.border2 },
  or: { fontSize: 10.5, color: palette.tx3 },
});
