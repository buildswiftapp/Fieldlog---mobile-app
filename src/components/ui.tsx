import { type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { palette, radius } from '@/theme';

export function Button({
  label,
  onPress,
  variant = 'primary',
  accent = palette.orange,
  onAccent = '#000',
  loading,
  disabled,
  icon,
}: {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary';
  accent?: string;
  onAccent?: string;
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
}) {
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        isPrimary ? { backgroundColor: accent } : styles.btnSecondary,
        (pressed || disabled || loading) && { opacity: 0.7 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? onAccent : palette.tx} />
      ) : (
        <>
          {icon}
          <Text style={[styles.btnText, { color: isPrimary ? onAccent : palette.tx }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

export function Field({
  label,
  style,
  ...props
}: TextInputProps & { label?: string }) {
  return (
    <View style={{ marginBottom: 12 }}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={palette.tx3}
        style={[styles.input, style]}
        autoCapitalize="none"
        {...props}
      />
    </View>
  );
}

export function Card({ children, style, onPress }: { children: ReactNode; style?: ViewStyle; onPress?: () => void }) {
  const content = <View style={[styles.card, style]}>{children}</View>;
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.85 }}>
        {content}
      </Pressable>
    );
  }
  return content;
}

export function Badge({ text, color, bg }: { text: string; color: string; bg: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color }]}>{text}</Text>
    </View>
  );
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? (
        <Text style={styles.sectionAction} onPress={onAction}>
          {action}
        </Text>
      ) : null}
    </View>
  );
}

export function Hint({ children }: { children: ReactNode }) {
  return (
    <View style={styles.hint}>
      <Text style={styles.hintText}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: radius.md,
  },
  btnSecondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: palette.border2 },
  btnText: { fontSize: 14, fontWeight: '600' },
  fieldLabel: { fontSize: 11, fontWeight: '500', color: palette.tx2, marginBottom: 5 },
  input: {
    backgroundColor: palette.bg3,
    borderWidth: 1,
    borderColor: palette.border2,
    borderRadius: radius.sm,
    paddingVertical: 11,
    paddingHorizontal: 12,
    color: palette.tx,
    fontSize: 14,
  },
  card: {
    backgroundColor: palette.bg2,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.lg,
    padding: 14,
  },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  badgeText: { fontSize: 11, fontWeight: '500' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: palette.tx3, letterSpacing: 0.7, textTransform: 'uppercase' },
  sectionAction: { fontSize: 12, color: palette.blueLight },
  hint: {
    marginHorizontal: 14,
    marginTop: 9,
    padding: 11,
    backgroundColor: 'rgba(37,99,235,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(37,99,235,0.11)',
    borderRadius: 9,
  },
  hintText: { fontSize: 11.5, color: palette.tx3, lineHeight: 18 },
});
