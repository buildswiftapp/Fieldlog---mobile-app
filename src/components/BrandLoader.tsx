import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { palette } from '@/theme';

const BAR_PEAKS = [22, 38, 30, 46, 26];

type BrandLoaderProps = {
  accent?: string;
  message?: string;
  sub?: string;
  fullscreen?: boolean;
};

export function BrandLoader({
  accent = palette.orange,
  message = 'Loading…',
  sub,
  fullscreen = true,
}: BrandLoaderProps) {
  const values = useRef(BAR_PEAKS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const animations = values.map((value, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 110),
          Animated.timing(value, {
            toValue: 1,
            duration: 520,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: false,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: 520,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: false,
          }),
        ]),
      ),
    );
    animations.forEach((animation) => animation.start());
    return () => animations.forEach((animation) => animation.stop());
  }, [values]);

  return (
    <View style={[styles.wrap, fullscreen && styles.fullscreen]}>
      <View style={styles.stage}>
        {values.map((value, index) => {
          const height = value.interpolate({ inputRange: [0, 1], outputRange: [12, 14 + BAR_PEAKS[index]] });
          const opacity = value.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
          return (
            <Animated.View
              key={index}
              style={[styles.bar, { height, opacity, backgroundColor: accent, shadowColor: accent }]}
            />
          );
        })}
      </View>
      <View style={styles.ground} />
      <Text style={styles.word}>
        <Text style={{ color: accent }}>Field</Text>
        <Text style={{ color: palette.tx }}>Log</Text>
      </Text>
      <Text style={styles.message}>{message}</Text>
      {sub ? <Text style={styles.sub}>{sub}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', gap: 0 },
  fullscreen: { flex: 1, backgroundColor: palette.bg },
  stage: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 7,
    height: 62,
    marginBottom: 10,
  },
  bar: {
    width: 9,
    borderRadius: 3,
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  ground: {
    width: 120,
    height: 1,
    backgroundColor: palette.border2,
    marginBottom: 18,
  },
  word: { fontSize: 18, fontWeight: '700', letterSpacing: 0.3, marginBottom: 6 },
  message: { fontSize: 12.5, color: palette.tx2 },
  sub: { fontSize: 11, color: palette.tx3, marginTop: 4 },
});
