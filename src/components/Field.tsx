import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { palette } from '@/theme';

function hasInputValue(value: TextInputProps['value']) {
  return typeof value === 'string' ? value.length > 0 : value != null && String(value).length > 0;
}

export function Field({
  label,
  style,
  value,
  ...props
}: TextInputProps & { label?: string }) {
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const [autofilled, setAutofilled] = useState(false);
  const filled = hasInputValue(value) || autofilled;
  const highlighted = focused || filled;

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    function detectAutofill() {
      const node = inputRef.current as unknown as HTMLInputElement | null;
      if (!node?.matches) return;
      try {
        setAutofilled(node.matches(':-webkit-autofill'));
      } catch {
        // Some browsers throw on :-webkit-autofill in matches().
      }
    }

    detectAutofill();
    const timers = [0, 120, 400, 900].map((delay) => setTimeout(detectAutofill, delay));
    return () => timers.forEach(clearTimeout);
  }, [value]);

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <TextInput
        ref={inputRef}
        placeholderTextColor={palette.tx3}
        selectionColor={palette.blueLight}
        style={[
          styles.input,
          highlighted && styles.inputHighlighted,
          Platform.OS === 'web' && styles.inputWeb,
          style,
        ]}
        autoCapitalize="none"
        value={value}
        {...props}
        {...(Platform.OS === 'web'
          ? {
              className: 'fieldlog-input',
              onAnimationStart: (event: { animationName?: string }) => {
                if (event.animationName === 'fieldlogAutofill') setAutofilled(true);
              },
            }
          : {})}
        onFocus={(event) => {
          setFocused(true);
          props.onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          props.onBlur?.(event);
        }}
        onChangeText={(text) => {
          if (autofilled && text.length === 0) setAutofilled(false);
          props.onChangeText?.(text);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  fieldLabel: { fontSize: 11, fontWeight: '500', color: palette.tx2, marginBottom: 5 },
  input: {
    backgroundColor: palette.bg3,
    borderWidth: 1,
    borderColor: palette.border2,
    borderRadius: 9,
    paddingVertical: 11,
    paddingHorizontal: 12,
    color: palette.tx,
    fontSize: 13.5,
    minHeight: 44,
  },
  inputHighlighted: {
    borderColor: palette.blue,
  },
  inputWeb: {
    outlineStyle: 'none',
    colorScheme: 'dark',
  } as object,
});
