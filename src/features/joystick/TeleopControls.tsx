import React from 'react';
import {Alert, StyleSheet, View} from 'react-native';
import {ActionButton} from '@components/ActionButton';
import {spacing} from '@design/spacing';
import {FLIGHT_NAV, useFlightNavPublisher} from './useFlightNavPublisher';

type StatusProps = {
  onStatus: (value: string) => void;
};

type ColumnProps = StatusProps & {
  zVel: number;
  yawVel: number;
};

// Left column: yaw and altitude, hold-to-repeat with an explicit stop on release.
export function AttitudeColumn({zVel, yawVel, onStatus}: ColumnProps) {
  const {connected, publishNav} = useFlightNavPublisher();

  const hold = (label: string, fields: Record<string, number>) => () => {
    try {
      publishNav(fields);
      onStatus(`sent ${label}`);
    } catch (error) {
      onStatus(error instanceof Error ? error.message : String(error));
    }
  };
  const stopYaw = () => {
    try {
      publishNav({yaw_nav_mode: FLIGHT_NAV.VEL_MODE, target_omega_z: 0});
    } catch {
      // ignore
    }
  };
  const stopZ = () => {
    try {
      publishNav({pos_z_nav_mode: FLIGHT_NAV.VEL_MODE, target_vel_z: 0});
    } catch {
      // ignore
    }
  };

  return (
    <View style={styles.column}>
      <ActionButton
        label="Yaw +"
        disabled={!connected}
        repeatOnHold
        onPress={hold('+yaw', {yaw_nav_mode: FLIGHT_NAV.VEL_MODE, target_omega_z: yawVel})}
        onRelease={stopYaw}
      />
      <ActionButton
        label="Yaw -"
        disabled={!connected}
        repeatOnHold
        onPress={hold('-yaw', {yaw_nav_mode: FLIGHT_NAV.VEL_MODE, target_omega_z: -yawVel})}
        onRelease={stopYaw}
      />
      <ActionButton
        label="Up"
        disabled={!connected}
        repeatOnHold
        onPress={hold('+z', {pos_z_nav_mode: FLIGHT_NAV.VEL_MODE, target_vel_z: zVel})}
        onRelease={stopZ}
      />
      <ActionButton
        label="Down"
        disabled={!connected}
        repeatOnHold
        onPress={hold('-z', {pos_z_nav_mode: FLIGHT_NAV.VEL_MODE, target_vel_z: -zVel})}
        onRelease={stopZ}
      />
    </View>
  );
}

// Center column: discrete flight commands. Force landing and halt require confirmation.
export function CommandColumn({onStatus}: StatusProps) {
  const {connected, publishTeleop, publishTaskStart} = useFlightNavPublisher();

  const run = (label: string, action: () => void) => {
    try {
      action();
      onStatus(`sent ${label}`);
    } catch (error) {
      onStatus(error instanceof Error ? error.message : String(error));
    }
  };

  const confirmDanger = (label: string, command: string) => {
    Alert.alert(label, `Send ${command} command?`, [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Send', style: 'destructive', onPress: () => run(label, () => publishTeleop(command))},
    ]);
  };

  return (
    <View style={styles.column}>
      <ActionButton label="Arm" disabled={!connected} onPress={() => run('arm', () => publishTeleop('start'))} />
      <ActionButton label="Takeoff" disabled={!connected} onPress={() => run('takeoff', () => publishTeleop('takeoff'))} />
      <ActionButton label="Land" disabled={!connected} tone="secondary" onPress={() => run('land', () => publishTeleop('land'))} />
      <ActionButton label="F.Land" disabled={!connected} tone="danger" onPress={() => confirmDanger('Force landing', 'force_landing')} />
      <ActionButton label="Halt" disabled={!connected} tone="danger" onPress={() => confirmDanger('Halt motors', 'halt')} />
      <ActionButton label="Task Start" disabled={!connected} tone="secondary" onPress={() => run('task_start', publishTaskStart)} />
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    flex: 1,
    gap: spacing.sm,
  },
});
