import React, {useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {ConnectionSignal} from '@components/ConnectionSignal';
import {Screen} from '@components/Screen';
import {colors} from '@design/colors';
import {spacing} from '@design/spacing';
import {typography} from '@design/typography';
import {useRos} from '@ros/RosContext';
import {AttitudeColumn, CommandColumn} from './TeleopControls';
import {MovementControl} from './MovementControl';

export function JoystickScreen() {
  const {state, joystickKind} = useRos();
  const [status, setStatus] = useState('ready');
  const xyVel = 0.2;
  const zVel = 0.2;
  const yawVel = 0.2;

  return (
    <Screen scroll={false}>
      <View style={styles.header}>
        <ConnectionSignal state={state} showLabel={false} size={14} />
        <Text style={styles.title}>Joystick</Text>
        <Text style={styles.status}>{status}</Text>
      </View>
      <View style={styles.columns}>
        {/* Left: yaw and altitude */}
        <View style={styles.side}>
          <Text style={styles.colLabel}>Yaw / Alt</Text>
          <AttitudeColumn zVel={zVel} yawVel={yawVel} onStatus={setStatus} />
        </View>
        {/* Center: flight commands */}
        <View style={styles.side}>
          <Text style={styles.colLabel}>Command</Text>
          <CommandColumn onStatus={setStatus} />
        </View>
        {/* Right: translation (right thumb), style depends on joystick kind */}
        <View style={styles.movement}>
          <Text style={styles.colLabel}>Move ({xyVel} m/s)</Text>
          <MovementControl kind={joystickKind} xyVel={xyVel} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    color: colors.ink,
    fontSize: typography.title,
    fontWeight: '800',
  },
  status: {
    flex: 1,
    color: colors.muted,
    fontFamily: typography.mono,
    fontSize: typography.small,
    textAlign: 'right',
  },
  columns: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.md,
  },
  side: {
    flex: 1,
    gap: spacing.sm,
  },
  movement: {
    flex: 1.3,
    gap: spacing.sm,
  },
  colLabel: {
    color: colors.muted,
    fontSize: typography.small,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
});
