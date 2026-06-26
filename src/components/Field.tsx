import { useState } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { palette, radius } from '@/theme';

export function Field({
  label,
  style,
  ...props
}: TextInputProps & { label?: string }) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={{ marginBottom: 12 }}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={palette.tx3}
        style={[styles.input, focused && styles.inputFocused, style]}
        autoCapitalize="none"
        {...props}
        onFocus={(event) => {
          setFocused(true);
          props.onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          props.onBlur?.(event);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
  inputFocused: {
    borderColor: palette.blue,
  },
});
