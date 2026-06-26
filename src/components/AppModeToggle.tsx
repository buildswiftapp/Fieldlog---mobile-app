import { useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { palette } from '@/theme';

export type AppMode = 'gc' | 'sub';

const SEGMENTS: { key: AppMode; label: string }[] = [
  { key: 'gc', label: 'GC' },
  { key: 'sub', label: 'SUB' },
];

type AppModeToggleProps = {
  mode: AppMode;
  onChange: (mode: AppMode) => void;
  compact?: boolean;
};

export function AppModeToggle({ mode, onChange, compact = false }: AppModeToggleProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const pad = compact ? 2 : 3;
  const segmentWidth = trackWidth > 0 ? (trackWidth - pad * 2) / 2 : 0;
  const activeIndex = mode === 'gc' ? 0 : 1;

  function onTrackLayout(event: LayoutChangeEvent) {
    setTrackWidth(event.nativeEvent.layout.width);
  }

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]} accessibilityRole="tablist">
      <View style={[styles.track, compact && styles.trackCompact]} onLayout={onTrackLayout}>
        {segmentWidth > 0 ? (
          <View
            style={[
              styles.slider,
              compact && styles.sliderCompact,
              {
                width: segmentWidth,
                left: pad + activeIndex * segmentWidth,
              },
            ]}
          />
        ) : null}

        {SEGMENTS.map((segment) => {
          const active = mode === segment.key;
          return (
            <Pressable
              key={segment.key}
              style={[styles.segment, compact && styles.segmentCompact]}
              onPress={() => onChange(segment.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={segment.key === 'gc' ? 'GC Portal' : 'Sub Portal'}
            >
              <Text
                style={[
                  styles.segmentText,
                  compact && styles.segmentTextCompact,
                  active ? styles.segmentTextActive : styles.segmentTextIdle,
                ]}
              >
                {segment.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 22 },
  wrapCompact: { marginBottom: 0 },
  track: {
    flexDirection: 'row',
    backgroundColor: palette.bg2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border2,
    padding: 3,
    position: 'relative',
    minHeight: 40,
    width: 168,
  },
  trackCompact: {
    minHeight: 26,
    width: 92,
    padding: 2,
  },
  slider: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    backgroundColor: palette.blue,
    borderRadius: 999,
  },
  sliderCompact: {
    top: 2,
    bottom: 2,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    minHeight: 34,
  },
  segmentCompact: {
    minHeight: 22,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  segmentTextCompact: {
    fontSize: 9.5,
    letterSpacing: 0.2,
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  segmentTextIdle: {
    color: palette.tx2,
  },
});
