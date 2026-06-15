import React, {useEffect, useRef, useState} from 'react';
import {StyleSheet, Switch, Text, View} from 'react-native';
import {Card} from '@components/Card';
import {colors} from '@design/colors';
import {spacing} from '@design/spacing';
import {typography} from '@design/typography';
import {FLIGHT_NAV, useFlightNavPublisher} from './useFlightNavPublisher';
import {gyroscope, SensorTypes, setUpdateIntervalForType} from 'react-native-sensors';

type GyroVector = {
  x: number;
  y: number;
  z: number;
};

export function mapGyroToFlightNav(
  gyro: GyroVector,
  options: {deadZone: number; gain: number; maxVel: number; maxYaw: number},
) {
  const clamp = (value: number, max: number) => {
    if (Math.abs(value) < options.deadZone) {
      return 0;
    }
    return Math.max(-max, Math.min(max, value * options.gain));
  };

  return {
    pos_xy_nav_mode: FLIGHT_NAV.VEL_MODE,
    yaw_nav_mode: FLIGHT_NAV.VEL_MODE,
    target_vel_x: clamp(-gyro.y, options.maxVel),
    target_vel_y: clamp(gyro.x, options.maxVel),
    target_omega_z: clamp(gyro.z, options.maxYaw),
  };
}

export function GyroControls() {
  const [enabled, setEnabled] = useState(false);
  const [latest, setLatest] = useState<GyroVector>({x: 0, y: 0, z: 0});
  const [status, setStatus] = useState('disabled');
  const {connected, publishNav} = useFlightNavPublisher();
  const lastPublishRef = useRef(0);

  useEffect(() => {
    if (!enabled || !connected) {
      setStatus(enabled ? 'waiting for ROS bridge' : 'disabled');
      return;
    }
    setUpdateIntervalForType(SensorTypes.gyroscope, 50);
    setStatus('streaming');
    const subscription = gyroscope.subscribe(value => {
      setLatest(value);
      const now = Date.now();
      if (now - lastPublishRef.current < 100) {
        return;
      }
      lastPublishRef.current = now;
      try {
        publishNav(mapGyroToFlightNav(value, {deadZone: 0.05, gain: 0.35, maxVel: 0.4, maxYaw: 0.5}));
      } catch (error) {
        setStatus(error instanceof Error ? error.message : String(error));
      }
    });
    return () => subscription.unsubscribe();
  }, [connected, enabled, publishNav]);

  return (
    <Card title="Gyro Control" subtitle="Device angular velocity to FlightNav">
      <View style={styles.row}>
        <Text style={styles.label}>Enable gyro teleop</Text>
        <Switch value={enabled} onValueChange={setEnabled} disabled={!connected} />
      </View>
      <Text style={styles.status}>{status}</Text>
      <View style={styles.values}>
        <Text style={styles.value}>x {latest.x.toFixed(3)}</Text>
        <Text style={styles.value}>y {latest.y.toFixed(3)}</Text>
        <Text style={styles.value}>z {latest.z.toFixed(3)}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  label: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
  },
  status: {
    color: colors.muted,
    fontFamily: typography.mono,
  },
  values: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  value: {
    flex: 1,
    color: colors.text,
    fontFamily: typography.mono,
    fontSize: typography.small,
  },
});
