import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {colors} from '@design/colors';
import {spacing} from '@design/spacing';
import {typography} from '@design/typography';
import {GyroVector} from './mapGyro';

type Props = {
  value: GyroVector;
  active: boolean;
  size?: number;
};

// Spirit-level style visualization of device tilt/rotation rate.
export function TiltVisualizer({value, active, size = 200}: Props) {
  const radius = size / 2;
  const bubble = size * 0.22;
  const maxTravel = radius - bubble / 2 - 4;
  // Scale angular velocity (rad/s) to bubble offset; clamp to the dial.
  const scale = 90;
  const clamp = (v: number) => Math.max(-maxTravel, Math.min(maxTravel, v * scale));
  const bx = clamp(value.x);
  const by = clamp(-value.y);
  const yawDeg = Math.max(-45, Math.min(45, value.z * scale));

  return (
    <View style={styles.wrap}>
      <View style={[styles.dial, {width: size, height: size, borderRadius: radius}]}>
        <View style={[styles.ring, {width: size * 0.66, height: size * 0.66, borderRadius: size * 0.33}]} />
        <View style={[styles.ring, {width: size * 0.33, height: size * 0.33, borderRadius: size * 0.165}]} />
        <View style={styles.crossV} />
        <View style={styles.crossH} />
        {/* Yaw rotation indicator */}
        <View
          style={[
            styles.yaw,
            {width: size * 0.8, transform: [{rotate: `${yawDeg}deg`}]},
          ]}
        />
        <View
          style={[
            styles.bubble,
            {
              width: bubble,
              height: bubble,
              borderRadius: bubble / 2,
              backgroundColor: active ? colors.accent : colors.muted,
              transform: [{translateX: bx}, {translateY: by}],
            },
          ]}
        />
      </View>
      <View style={styles.readout}>
        <Text style={styles.value}>roll {value.x.toFixed(2)}</Text>
        <Text style={styles.value}>pitch {value.y.toFixed(2)}</Text>
        <Text style={styles.value}>yaw {value.z.toFixed(2)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  dial: {
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.surfaceAlt,
  },
  ring: {
    position: 'absolute',
    borderColor: colors.line,
    borderWidth: 1,
  },
  crossV: {
    position: 'absolute',
    width: 1,
    height: '92%',
    backgroundColor: colors.line,
  },
  crossH: {
    position: 'absolute',
    height: 1,
    width: '92%',
    backgroundColor: colors.line,
  },
  yaw: {
    position: 'absolute',
    height: 2,
    backgroundColor: colors.warn,
    opacity: 0.7,
  },
  bubble: {
    borderWidth: 3,
    borderColor: colors.surface,
  },
  readout: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  value: {
    color: colors.text,
    fontFamily: typography.mono,
    fontSize: typography.small,
  },
});
