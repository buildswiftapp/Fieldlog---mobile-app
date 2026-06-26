import { Pressable, StyleSheet, Text, View } from 'react-native';
import { palette, radius, roleThemes } from '@/theme';

export type AppMode = 'gc' | 'sub';

export function AppModeToggle({ mode, onChange }: { mode: AppMode; onChange: (mode: AppMode) => void }) {
  return (
    <View style={styles.wrap}>
      {(['gc', 'sub'] as AppMode[]).map((m) => {
        const active = mode === m;
        const accent = roleThemes[m].accent;
        return (
          <Pressable
            key={m}
            onPress={() => onChange(m)}
            style={[styles.item, active && { backgroundColor: roleThemes[m].accentDim, borderColor: accent }]}
          >
            <Text style={[styles.text, active && { color: accent, fontWeight: '600' }]}>
              {m === 'gc' ? 'Main App (GC)' : 'Sub Portal'}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', gap: 8, marginBottom: 22 },
  item: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border2,
    alignItems: 'center',
  },
  text: { fontSize: 12, color: palette.tx2 },
});
