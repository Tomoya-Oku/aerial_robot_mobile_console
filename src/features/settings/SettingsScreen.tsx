import React from 'react';
import {Linking, StyleSheet, Text} from 'react-native';
import {ActionButton} from '@components/ActionButton';
import {Card} from '@components/Card';
import {HistoryInput} from '@components/HistoryInput';
import {Screen} from '@components/Screen';
import {SegmentedControl} from '@components/SegmentedControl';
import {colors} from '@design/colors';
import {spacing} from '@design/spacing';
import {typography} from '@design/typography';
import {JOYSTICK_KINDS} from '@lib/joystick';
import {useRos} from '@ros/RosContext';

const REPO_URL = 'https://github.com/Tomoya-Oku/aerial_robot_mobile_console';

export function SettingsScreen() {
  const {
    bridgeUrl,
    robotNs,
    poseTopic,
    joystickKind,
    bridgeUrlHistory,
    robotNsHistory,
    poseTopicHistory,
    setBridgeUrl,
    setRobotNs,
    setPoseTopic,
    setJoystickKind,
    connect,
    state,
  } = useRos();

  return (
    <Screen>
      <Text style={styles.title}>Settings</Text>
      <Card title="ROS Bridge">
        <HistoryInput
          label="Bridge URL"
          value={bridgeUrl}
          onChangeText={setBridgeUrl}
          history={bridgeUrlHistory}
          placeholder="ws://localhost:9090"
        />
        <HistoryInput
          label="Robot namespace"
          value={robotNs}
          onChangeText={setRobotNs}
          history={robotNsHistory}
          placeholder="/dragon"
        />
        <HistoryInput
          label="Pose topic"
          value={poseTopic}
          onChangeText={setPoseTopic}
          history={poseTopicHistory}
          placeholder="/dragon/ground_truth"
        />
        <ActionButton label={state === 'connected' ? 'Reconnect' : 'Connect'} onPress={connect} />
      </Card>
      <Card title="Joystick" subtitle="操作スタイルを選択(保存されます)">
        <SegmentedControl
          options={JOYSTICK_KINDS.map(kind => ({value: kind.value, label: kind.label}))}
          value={joystickKind}
          onChange={setJoystickKind}
        />
        <Text style={styles.hint}>
          {JOYSTICK_KINDS.find(kind => kind.value === joystickKind)?.hint}
        </Text>
      </Card>
      <Card title="Safety defaults">
        <Text style={styles.body}>
          Force landing and halt require confirmation. Continuous joystick output must clamp velocity,
          apply a dead zone, and stop publishing when the bridge disconnects.
        </Text>
      </Card>
      <Card title="About">
        <Text style={styles.body}>Author: Tomoya Oku</Text>
        <ActionButton label="GitHub Repository" tone="secondary" onPress={() => Linking.openURL(REPO_URL)} />
        <Text style={styles.link}>{REPO_URL}</Text>
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
  hint: {
    color: colors.muted,
    fontSize: typography.small,
  },
  body: {
    color: colors.text,
    lineHeight: 20,
  },
  link: {
    color: colors.accent,
    fontFamily: typography.mono,
    fontSize: typography.small,
    marginTop: spacing.xs,
  },
});
