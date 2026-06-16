import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {ActionButton} from '@components/ActionButton';
import {colors} from '@design/colors';
import {spacing} from '@design/spacing';
import {typography} from '@design/typography';
import {JoystickKind} from '@lib/joystick';
import {AnalogPad} from './AnalogPad';
import {useAnalogTeleop} from './useAnalogTeleop';
import {FLIGHT_NAV, useFlightNavPublisher} from './useFlightNavPublisher';

type Props = {
  kind: JoystickKind;
  xyVel: number;
};

// Right-hand translation control. Style depends on the selected joystick kind.
export function MovementControl({kind, xyVel}: Props) {
  if (kind === 'buttons') {
    return <DpadControl xyVel={xyVel} />;
  }
  return <PadControl mode={kind === 'ball' ? 'ball' : 'stick'} xyVel={xyVel} />;
}

function PadControl({mode, xyVel}: {mode: 'stick' | 'ball'; xyVel: number}) {
  const {connected, setVector, start, stop} = useAnalogTeleop(xyVel);
  return (
    <View style={styles.center}>
      <AnalogPad
        size={200}
        mode={mode}
        disabled={!connected}
        onStart={start}
        onChange={setVector}
        onEnd={stop}
      />
      <Text style={styles.hint}>{mode === 'ball' ? 'ボール式: 触れた位置から追従' : 'Virtual Stick'}</Text>
    </View>
  );
}

function DpadControl({xyVel}: {xyVel: number}) {
  const {connected, publishNav} = useFlightNavPublisher();

  const move = (fields: Record<string, number>) => () => {
    try {
      publishNav({pos_xy_nav_mode: FLIGHT_NAV.VEL_MODE, ...fields});
    } catch {
      // ignore transient errors; release publishes a stop
    }
  };
  const stop = () => {
    try {
      publishNav({pos_xy_nav_mode: FLIGHT_NAV.VEL_MODE, target_vel_x: 0, target_vel_y: 0});
    } catch {
      // ignore
    }
  };

  return (
    <View style={styles.dpad}>
      <View style={styles.dpadRow}>
        <ActionButton
          label="Forward"
          disabled={!connected}
          repeatOnHold
          onPress={move({target_vel_x: xyVel})}
          onRelease={stop}
          style={styles.dpadButton}
        />
      </View>
      <View style={styles.dpadRow}>
        <ActionButton
          label="Left"
          disabled={!connected}
          repeatOnHold
          onPress={move({target_vel_y: xyVel})}
          onRelease={stop}
          style={styles.dpadButton}
        />
        <ActionButton
          label="Right"
          disabled={!connected}
          repeatOnHold
          onPress={move({target_vel_y: -xyVel})}
          onRelease={stop}
          style={styles.dpadButton}
        />
      </View>
      <View style={styles.dpadRow}>
        <ActionButton
          label="Back"
          disabled={!connected}
          repeatOnHold
          onPress={move({target_vel_x: -xyVel})}
          onRelease={stop}
          style={styles.dpadButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  hint: {
    color: colors.muted,
    fontSize: typography.small,
  },
  dpad: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  dpadRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dpadButton: {
    minWidth: 96,
  },
});
