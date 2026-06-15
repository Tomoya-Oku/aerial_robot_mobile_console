import React from 'react';
import {Alert, StyleSheet, View} from 'react-native';
import {ActionButton} from '@components/ActionButton';
import {spacing} from '@design/spacing';
import {FLIGHT_NAV, useFlightNavPublisher} from './useFlightNavPublisher';

type Props = {
  xyVel: number;
  zVel: number;
  yawVel: number;
  onStatus: (value: string) => void;
};

export function TeleopControls({xyVel, zVel, yawVel, onStatus}: Props) {
  const {connected, publishTeleop, publishTaskStart, publishNav} = useFlightNavPublisher();

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
    <View style={styles.stack}>
      <View style={styles.row2}>
        <ActionButton label="Arm" disabled={!connected} onPress={() => run('arm', () => publishTeleop('start'))} />
        <ActionButton label="Takeoff" disabled={!connected} onPress={() => run('takeoff', () => publishTeleop('takeoff'))} />
      </View>
      <View style={styles.row3}>
        <ActionButton label="Yaw +" disabled={!connected} onPress={() => run('+yaw', () => publishNav({yaw_nav_mode: FLIGHT_NAV.VEL_MODE, target_omega_z: yawVel}))} />
        <ActionButton label="Forward" disabled={!connected} onPress={() => run('+x', () => publishNav({pos_xy_nav_mode: FLIGHT_NAV.VEL_MODE, target_vel_x: xyVel}))} />
        <ActionButton label="Yaw -" disabled={!connected} onPress={() => run('-yaw', () => publishNav({yaw_nav_mode: FLIGHT_NAV.VEL_MODE, target_omega_z: -yawVel}))} />
      </View>
      <View style={styles.row3}>
        <ActionButton label="Left" disabled={!connected} onPress={() => run('+y', () => publishNav({pos_xy_nav_mode: FLIGHT_NAV.VEL_MODE, target_vel_y: xyVel}))} />
        <ActionButton label="Back" disabled={!connected} onPress={() => run('-x', () => publishNav({pos_xy_nav_mode: FLIGHT_NAV.VEL_MODE, target_vel_x: -xyVel}))} />
        <ActionButton label="Right" disabled={!connected} onPress={() => run('-y', () => publishNav({pos_xy_nav_mode: FLIGHT_NAV.VEL_MODE, target_vel_y: -xyVel}))} />
      </View>
      <View style={styles.row2}>
        <ActionButton label="Up" disabled={!connected} onPress={() => run('+z', () => publishNav({pos_z_nav_mode: FLIGHT_NAV.VEL_MODE, target_vel_z: zVel}))} />
        <ActionButton label="Down" disabled={!connected} onPress={() => run('-z', () => publishNav({pos_z_nav_mode: FLIGHT_NAV.VEL_MODE, target_vel_z: -zVel}))} />
      </View>
      <View style={styles.row3}>
        <ActionButton label="Land" disabled={!connected} tone="secondary" onPress={() => run('land', () => publishTeleop('land'))} />
        <ActionButton label="F.Land" disabled={!connected} tone="danger" onPress={() => confirmDanger('Force landing', 'force_landing')} />
        <ActionButton label="Halt" disabled={!connected} tone="danger" onPress={() => confirmDanger('Halt motors', 'halt')} />
      </View>
      <ActionButton label="Task Start" disabled={!connected} tone="secondary" onPress={() => run('task_start', publishTaskStart)} />
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.sm,
  },
  row2: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  row3: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
