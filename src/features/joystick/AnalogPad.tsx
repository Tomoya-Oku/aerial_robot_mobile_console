import React, {useMemo, useRef, useState} from 'react';
import {PanResponder, StyleSheet, View} from 'react-native';
import {colors} from '@design/colors';

type Props = {
  size?: number;
  // 'stick': displacement is measured from the pad centre (Virtual Stick).
  // 'ball': displacement is relative to where the finger first touched.
  mode: 'stick' | 'ball';
  disabled?: boolean;
  onStart?: () => void;
  onChange: (x: number, y: number) => void;
  onEnd?: () => void;
};

// Touch pad that emits a normalized vector in [-1, 1] for both axes.
export function AnalogPad({size = 200, mode, disabled, onStart, onChange, onEnd}: Props) {
  const radius = size / 2;
  const knobSize = size * 0.4;
  const maxTravel = radius - knobSize / 2;
  const [knob, setKnob] = useState({x: 0, y: 0});
  const grantRef = useRef({x: 0, y: 0});

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponder: () => !disabled,
        onPanResponderGrant: event => {
          // Stick mode anchors at the centre; ball mode anchors at the touch point.
          grantRef.current =
            mode === 'stick'
              ? {x: event.nativeEvent.locationX - radius, y: event.nativeEvent.locationY - radius}
              : {x: 0, y: 0};
          onStart?.();
        },
        onPanResponderMove: (_event, gesture) => {
          const rawX = grantRef.current.x + gesture.dx;
          const rawY = grantRef.current.y + gesture.dy;
          const distance = Math.hypot(rawX, rawY);
          const scale = distance > maxTravel ? maxTravel / distance : 1;
          const x = rawX * scale;
          const y = rawY * scale;
          setKnob({x, y});
          onChange(x / maxTravel, y / maxTravel);
        },
        onPanResponderRelease: () => {
          setKnob({x: 0, y: 0});
          onChange(0, 0);
          onEnd?.();
        },
        onPanResponderTerminate: () => {
          setKnob({x: 0, y: 0});
          onChange(0, 0);
          onEnd?.();
        },
      }),
    [disabled, maxTravel, mode, onChange, onEnd, onStart, radius],
  );

  return (
    <View
      {...responder.panHandlers}
      style={[
        styles.pad,
        {width: size, height: size, borderRadius: radius},
        disabled && styles.disabled,
      ]}>
      <View style={styles.crosshairV} />
      <View style={styles.crosshairH} />
      <View
        style={[
          styles.knob,
          {
            width: knobSize,
            height: knobSize,
            borderRadius: knobSize / 2,
            transform: [{translateX: knob.x}, {translateY: knob.y}],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pad: {
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.surfaceAlt,
  },
  disabled: {
    opacity: 0.4,
  },
  crosshairV: {
    position: 'absolute',
    width: 1,
    height: '82%',
    backgroundColor: colors.line,
  },
  crosshairH: {
    position: 'absolute',
    height: 1,
    width: '82%',
    backgroundColor: colors.line,
  },
  knob: {
    borderWidth: 6,
    borderColor: colors.accent,
    backgroundColor: colors.surface,
  },
});
