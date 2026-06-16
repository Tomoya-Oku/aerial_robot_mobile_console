import React, {useEffect, useRef, useState} from 'react';
import {StyleSheet, Switch, Text, View} from 'react-native';
import {Card} from '@components/Card';
import {ConnectionSignal} from '@components/ConnectionSignal';
import {Screen} from '@components/Screen';
import {colors} from '@design/colors';
import {spacing} from '@design/spacing';
import {typography} from '@design/typography';
import {useRos} from '@ros/RosContext';
import {useFlightNavPublisher} from '@features/joystick/useFlightNavPublisher';
import {gyroscope, SensorTypes, setUpdateIntervalForType} from 'react-native-sensors';
import {GyroVector, mapGyroToFlightNav} from './mapGyro';
import {TiltVisualizer} from './TiltVisualizer';

const GYRO_OPTIONS = {deadZone: 0.05, gain: 0.35, maxVel: 0.4, maxYaw: 0.5};

export function GyroScreen() {
  const {state} = useRos();
  const {connected, publishNav} = useFlightNavPublisher();
  const [enabled, setEnabled] = useState(false);
  const [latest, setLatest] = useState<GyroVector>({x: 0, y: 0, z: 0});
  const [status, setStatus] = useState('disabled');
  const lastPublishRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      setStatus('disabled');
      setLatest({x: 0, y: 0, z: 0});
      return;
    }
    // Always visualize tilt while enabled; only publish when the bridge is connected.
    setUpdateIntervalForType(SensorTypes.gyroscope, 50);
    setStatus(connected ? 'streaming' : 'waiting for ROS bridge');
    const subscription = gyroscope.subscribe(value => {
      setLatest(value);
      if (!connected) {
        return;
      }
      const now = Date.now();
      if (now - lastPublishRef.current < 100) {
        return;
      }
      lastPublishRef.current = now;
      try {
        publishNav(mapGyroToFlightNav(value, GYRO_OPTIONS));
      } catch (error) {
        setStatus(error instanceof Error ? error.message : String(error));
      }
    });
    return () => subscription.unsubscribe();
  }, [connected, enabled, publishNav]);

  return (
    <Screen>
      <View style={styles.header}>
        <ConnectionSignal state={state} showLabel={false} size={14} />
        <Text style={styles.title}>Gyro Control</Text>
      </View>
      <Card title="Tilt" subtitle="端末の傾き(角速度)を可視化">
        <View style={styles.center}>
          <TiltVisualizer value={latest} active={enabled} />
        </View>
      </Card>
      <Card title="Teleop" subtitle="Device angular velocity to FlightNav">
        <View style={styles.row}>
          <Text style={styles.label}>Enable gyro teleop</Text>
          <Switch value={enabled} onValueChange={setEnabled} />
        </View>
        <Text style={styles.status}>{status}</Text>
      </Card>
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
  center: {
    alignItems: 'center',
  },
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
});
