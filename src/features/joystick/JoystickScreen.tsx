import React, {useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {Card} from '@components/Card';
import {Screen} from '@components/Screen';
import {StatusPill} from '@components/StatusPill';
import {colors} from '@design/colors';
import {spacing} from '@design/spacing';
import {typography} from '@design/typography';
import {useRos} from '@ros/RosContext';
import {GyroControls} from './GyroControls';
import {TeleopControls} from './TeleopControls';

export function JoystickScreen() {
  const {state, robotNs} = useRos();
  const [status, setStatus] = useState('ready');
  const xyVel = 0.2;
  const zVel = 0.2;
  const yawVel = 0.2;

  return (
    <Screen>
      <Text style={styles.title}>Joystick</Text>
      <View style={styles.pills}>
        <StatusPill label="Bridge" value={state} tone={state === 'connected' ? 'ok' : 'warn'} />
        <StatusPill label="Namespace" value={robotNs || '/'} />
      </View>
      <Card title="Flight Control" subtitle={`xy ${xyVel} m/s, z ${zVel} m/s, yaw ${yawVel} rad/s`}>
        <TeleopControls xyVel={xyVel} zVel={zVel} yawVel={yawVel} onStatus={setStatus} />
        <Text style={styles.status}>{status}</Text>
      </Card>
      <Card title="Virtual stick">
        <View style={styles.stick}>
          <View style={styles.crosshair} />
          <View style={styles.knob} />
        </View>
        <Text style={styles.note}>
          Continuous analog control is reserved for the next increment; discrete commands already
          mirror keyboard_command.py topics and FlightNav fields.
        </Text>
      </Card>
      <GyroControls />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.ink,
    fontSize: typography.title,
    fontWeight: '800',
  },
  pills: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  status: {
    color: colors.muted,
    fontFamily: typography.mono,
  },
  stick: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: colors.line,
    borderRadius: 110,
    borderWidth: 1,
    backgroundColor: colors.surfaceAlt,
  },
  crosshair: {
    position: 'absolute',
    width: 1,
    height: 180,
    backgroundColor: colors.line,
  },
  knob: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 8,
    borderColor: colors.accent,
    backgroundColor: colors.surface,
  },
  note: {
    color: colors.muted,
    lineHeight: 20,
  },
});
