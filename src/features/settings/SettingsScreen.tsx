import React from 'react';
import {StyleSheet, Text, TextInput} from 'react-native';
import {ActionButton} from '@components/ActionButton';
import {Card} from '@components/Card';
import {Screen} from '@components/Screen';
import {colors} from '@design/colors';
import {radius, spacing} from '@design/spacing';
import {typography} from '@design/typography';
import {useRos} from '@ros/RosContext';

export function SettingsScreen() {
  const {bridgeUrl, robotNs, poseTopic, setBridgeUrl, setRobotNs, setPoseTopic, connect, state} = useRos();

  return (
    <Screen>
      <Text style={styles.title}>Settings</Text>
      <Card title="ROS Bridge">
        <Text style={styles.label}>Bridge URL</Text>
        <TextInput value={bridgeUrl} onChangeText={setBridgeUrl} autoCapitalize="none" style={styles.input} />
        <Text style={styles.label}>Robot namespace</Text>
        <TextInput value={robotNs} onChangeText={setRobotNs} autoCapitalize="none" style={styles.input} />
        <Text style={styles.label}>Pose topic</Text>
        <TextInput value={poseTopic} onChangeText={setPoseTopic} autoCapitalize="none" style={styles.input} />
        <ActionButton label={state === 'connected' ? 'Reconnect' : 'Connect'} onPress={connect} />
      </Card>
      <Card title="Safety defaults">
        <Text style={styles.body}>
          Force landing and halt require confirmation. Continuous joystick output must clamp velocity,
          apply a dead zone, and stop publishing when the bridge disconnects.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.ink,
    fontSize: typography.title,
    fontWeight: '800',
  },
  label: {
    color: colors.muted,
    fontSize: typography.small,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  input: {
    minHeight: 44,
    borderColor: colors.line,
    borderRadius: radius.sm,
    borderWidth: 1,
    color: colors.text,
    fontFamily: typography.mono,
    paddingHorizontal: spacing.md,
  },
  body: {
    color: colors.text,
    lineHeight: 20,
  },
});
