import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { palette } from '@/theme';

const FLOORS = 5;
const FLOOR_HEIGHT = 13;
const BUILDING_WIDTH = 64;

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
  const floors = useRef(Array.from({ length: FLOORS }, () => new Animated.Value(0))).current;
  const crane = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const buildUp = Animated.stagger(
      170,
      floors.map((value) =>
        Animated.timing(value, {
          toValue: 1,
          duration: 360,
          easing: Easing.out(Easing.back(1.4)),
          useNativeDriver: true,
        }),
      ),
    );

    const reset = Animated.parallel(
      floors.map((value) =>
        Animated.timing(value, {
          toValue: 0,
          duration: 260,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ),
    );

    const loop = Animated.loop(
      Animated.sequence([buildUp, Animated.delay(550), reset, Animated.delay(220)]),
    );

    const craneLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(crane, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(crane, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();
    craneLoop.start();
    return () => {
      loop.stop();
      craneLoop.stop();
    };
  }, [floors, crane]);

  const craneSwing = crane.interpolate({ inputRange: [0, 1], outputRange: ['-10deg', '10deg'] });

  return (
    <View style={[styles.wrap, fullscreen && styles.fullscreen]}>
      <View style={styles.scene}>
        <Animated.View style={[styles.crane, { transform: [{ rotate: craneSwing }] }]}>
          <View style={[styles.craneArm, { backgroundColor: accent }]} />
          <View style={[styles.craneHook, { backgroundColor: accent }]} />
        </Animated.View>

        <View style={styles.building}>
          {floors
            .map((value, index) => {
              const translateY = value.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });
              return (
                <Animated.View
                  key={index}
                  style={[
                    styles.floor,
                    {
                      opacity: value,
                      transform: [{ translateY }, { scaleY: value }],
                      backgroundColor: index === 0 ? accent : palette.bg4,
                      borderColor: accent,
                    },
                  ]}
                >
                  <View style={[styles.window, { backgroundColor: accent }]} />
                  <View style={[styles.window, { backgroundColor: accent }]} />
                </Animated.View>
              );
            })
            .reverse()}
        </View>
        <View style={styles.ground} />
      </View>

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
  wrap: { alignItems: 'center', justifyContent: 'center' },
  fullscreen: { flex: 1, backgroundColor: palette.bg },
  scene: { alignItems: 'center', justifyContent: 'flex-end', marginBottom: 18 },
  crane: { width: 54, alignItems: 'flex-end', marginBottom: 2 },
  craneArm: { width: 46, height: 3, borderRadius: 2 },
  craneHook: { width: 2, height: 9, marginRight: 6 },
  building: {
    width: BUILDING_WIDTH,
    alignItems: 'stretch',
    justifyContent: 'flex-end',
  },
  floor: {
    height: FLOOR_HEIGHT,
    borderWidth: 1,
    borderRadius: 2,
    marginTop: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  window: { width: 8, height: 5, borderRadius: 1, opacity: 0.85 },
  ground: {
    width: BUILDING_WIDTH + 26,
    height: 2,
    borderRadius: 2,
    backgroundColor: palette.border2,
    marginTop: 5,
  },
  word: { fontSize: 18, fontWeight: '700', letterSpacing: 0.3, marginBottom: 6 },
  message: { fontSize: 12.5, color: palette.tx2 },
  sub: { fontSize: 11, color: palette.tx3, marginTop: 4 },
});
