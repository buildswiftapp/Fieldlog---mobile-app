import { ReactNode, useState } from 'react';
import {
  ActivityIndicator,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputFocusEventData,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { palette, radius } from '@/theme';

function inputBorderColor(focused: boolean, hovered: boolean) {
  if (focused || hovered) return palette.blue;
  return palette.border2;
}

export function useInputBorder(_accent?: string) {
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  return {
    borderColor: inputBorderColor(focused, hovered),
    setFocused,
    setHovered,
  };
}

export function T(props: { children: ReactNode; style?: StyleProp<TextStyle>; numberOfLines?: number }) {
  return (
    <Text style={props.style} numberOfLines={props.numberOfLines}>
      {props.children}
    </Text>
  );
}

export function Card({
  children,
  style,
  onPress,
  flush,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  flush?: boolean;
}) {
  const content = <View style={[styles.card, flush && styles.cardFlush, style]}>{children}</View>;
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.85 }}>
        {content}
      </Pressable>
    );
  }
  return content;
}

type BadgeTone = 'orange' | 'green' | 'blue' | 'red' | 'purple' | 'gray';
const badgeTones: Record<BadgeTone, { bg: string; fg: string }> = {
  orange: { bg: palette.orangeDim, fg: palette.orange },
  green: { bg: palette.greenDim, fg: palette.green },
  blue: { bg: palette.blueDim, fg: palette.blueLight },
  red: { bg: palette.redDim, fg: palette.red },
  purple: { bg: palette.purpleDim, fg: palette.purple },
  gray: { bg: 'rgba(255,255,255,0.06)', fg: palette.tx2 },
};
export function Badge({ tone = 'gray', children }: { tone?: BadgeTone; children: ReactNode }) {
  const t = badgeTones[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      <Text style={[styles.badgeText, { color: t.fg }]}>{children}</Text>
    </View>
  );
}

type BtnVariant = 'primary' | 'secondary' | 'purple' | 'blue' | 'danger';
export function Btn({
  label,
  onPress,
  variant = 'primary',
  style,
  textStyle,
  icon,
  loading,
  disabled,
  accent,
  onAccent,
}: {
  label: string;
  onPress?: () => void;
  variant?: BtnVariant;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  accent?: string;
  onAccent?: string;
}) {
  let bg: string = 'transparent';
  let fg: string = palette.tx;
  let borderColor: string = 'transparent';
  if (variant === 'primary') {
    bg = accent ?? palette.orange;
    fg = onAccent ?? '#000';
  } else if (variant === 'purple') {
    bg = palette.purple;
    fg = '#fff';
  } else if (variant === 'blue') {
    bg = palette.blue;
    fg = '#fff';
  } else if (variant === 'danger') {
    bg = 'transparent';
    fg = palette.red;
    borderColor = palette.redDim;
  } else {
    bg = 'transparent';
    fg = palette.tx;
    borderColor = palette.border2;
  }
  return (
    <Pressable
      onPress={disabled || loading ? undefined : onPress}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, borderColor },
        (pressed || disabled) && { opacity: 0.7 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={fg} />
      ) : (
        <>
          {icon}
          <Text style={[styles.btnText, { color: fg }, textStyle]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

export const Button = Btn;

export function Field({
  label,
  style,
  containerStyle,
  accent: _accent,
  onFocus,
  onBlur,
  autoComplete,
  textContentType,
  ...props
}: TextInputProps & { label?: string; containerStyle?: StyleProp<ViewStyle>; accent?: string }) {
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [editable, setEditable] = useState(Platform.OS !== 'web');
  const borderColor = inputBorderColor(focused, hovered);

  const autofillProps =
    Platform.OS === 'web'
      ? {
          autoComplete: autoComplete ?? (props.secureTextEntry ? 'new-password' : 'off'),
          readOnly: !editable,
          'data-lpignore': 'true',
          'data-1p-ignore': 'true',
          'data-form-type': 'other',
        }
      : {
          autoComplete: autoComplete ?? 'off',
          textContentType: textContentType ?? 'none',
          importantForAutofill: 'no' as const,
        };

  return (
    <View
      style={[styles.fieldRow, containerStyle]}
      {...({
        onMouseEnter: () => setHovered(true),
        onMouseLeave: () => setHovered(false),
      } as object)}
    >
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <View style={[styles.inputShell, { borderColor }]}>
        <TextInput
          placeholderTextColor={palette.tx3}
          autoCorrect={false}
          style={[styles.inputInner, style]}
          onFocus={(e: NativeSyntheticEvent<TextInputFocusEventData>) => {
            if (Platform.OS === 'web' && !editable) setEditable(true);
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e: NativeSyntheticEvent<TextInputFocusEventData>) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...props}
          {...autofillProps}
          
          className="fl-input"
        />
      </View>
    </View>
  );
}

export function SectionHeader({
  title,
  action,
  onAction,
  right,
  style,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  right?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.sh, style]}>
      <Text style={styles.st}>{title}</Text>
      {action ? (
        <Text style={styles.sl} onPress={onAction}>
          {action}
        </Text>
      ) : (
        right
      )}
    </View>
  );
}

export function Hint({ children }: { children: ReactNode }) {
  return (
    <View style={styles.hint}>
      <View style={{ marginTop: 1 }}>
        <InfoDot />
      </View>
      <Text style={styles.hintText}>{children}</Text>
    </View>
  );
}
function InfoDot() {
  return (
    <View style={{ width: 13, height: 13, borderRadius: 7, borderWidth: 1.4, borderColor: palette.tx3, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 1.4, height: 4, backgroundColor: palette.tx3, marginTop: 1 }} />
    </View>
  );
}

export function HealthBar({ pct, color, style }: { pct: number; color: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.hb, style]}>
      <View style={[styles.hf, { width: `${Math.max(0, Math.min(100, pct))}%`, backgroundColor: color }]} />
    </View>
  );
}

export function Pill({ label, on, onPress, accent }: { label: string; on?: boolean; onPress?: () => void; accent?: string }) {
  const a = accent ?? palette.blue;
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.pill,
        on
          ? { backgroundColor: palette.blueDim, borderColor: a }
          : { backgroundColor: 'transparent', borderColor: palette.border2 },
      ]}
    >
      <Text style={[styles.pillText, { color: on ? palette.blueLight : palette.tx2 }]}>{label}</Text>
    </Pressable>
  );
}

export function MetaBar({ children }: { children: ReactNode }) {
  return <View style={styles.metaBar}>{children}</View>;
}

export function Divider() {
  return <View style={{ height: 1, backgroundColor: palette.border }} />;
}

export const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.bg2,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 14,
    padding: 13,
    paddingHorizontal: 14,
    marginHorizontal: 14,
    marginBottom: 10,
  },
  cardFlush: { padding: 0, overflow: 'hidden' },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20 },
  badgeText: { fontSize: 10.5, fontWeight: '500' },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
  },
  btnText: { fontSize: 13, fontWeight: '600' },
  fieldRow: { marginBottom: 11 },
  fieldLabel: { fontSize: 11, fontWeight: '500', color: palette.tx2, marginBottom: 4 },
  inputShell: {
    backgroundColor: palette.bg3,
    borderWidth: 1,
    borderColor: palette.border2,
    borderRadius: 9,
    overflow: 'hidden',
  },
  inputInner: {
    borderWidth: 0,
    paddingHorizontal: 10,
    paddingVertical: 9,
    color: palette.tx,
    fontSize: 12.5,
    backgroundColor: 'transparent',
    ...(Platform.OS === 'web'
      ? ({ outlineStyle: 'none', outlineWidth: 0 } as object)
      : null),
  },
  input: {
    backgroundColor: palette.bg3,
    borderWidth: 1,
    borderColor: palette.border2,
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 9,
    color: palette.tx,
    fontSize: 12.5,
  },
  sh: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 7,
  },
  st: { fontSize: 10.5, fontWeight: '700', color: palette.tx3, letterSpacing: 0.7, textTransform: 'uppercase' },
  sl: { fontSize: 12, color: palette.blueLight },
  hint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginHorizontal: 14,
    marginTop: 9,
    paddingVertical: 8,
    paddingHorizontal: 11,
    backgroundColor: 'rgba(37,99,235,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(37,99,235,0.11)',
    borderRadius: 9,
  },
  hintText: { flex: 1, fontSize: 11.5, color: palette.tx3, lineHeight: 18 },
  hb: { height: 4, backgroundColor: palette.bg4, borderRadius: 2, overflow: 'hidden', marginVertical: 7 },
  hf: { height: '100%', borderRadius: 2 },
  pill: { paddingHorizontal: 11, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  pillText: { fontSize: 11.5, fontWeight: '500' },
  metaBar: {
    backgroundColor: palette.bg2,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    paddingVertical: 8,
    paddingHorizontal: 14,
    flexDirection: 'row',
    gap: 14,
  },
});
