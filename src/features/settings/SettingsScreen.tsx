import React from 'react';
import {Linking, StyleSheet, Text, TextInput} from 'react-native';
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
    flightStateTopic,
    batteryTopic,
    cameraTopic,
    modelErrorTopic,
    fullBatteryFlightMinutes,
    joystickKind,
    bridgeUrlHistory,
    robotNsHistory,
    poseTopicHistory,
    setBridgeUrl,
    setRobotNs,
    setPoseTopic,
    setFlightStateTopic,
    setBatteryTopic,
    setCameraTopic,
    setModelErrorTopic,
    setFullBatteryFlightMinutes,
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
      <Card title="Live telemetry" subtitle="ROS topic mapping">
        <PlainInput label="Flight state" value={flightStateTopic} onChangeText={setFlightStateTopic} />
        <PlainInput label="Battery" value={batteryTopic} onChangeText={setBatteryTopic} />
        <PlainInput label="Camera compressed image" value={cameraTopic} onChangeText={setCameraTopic} />
        <PlainInput label="Model error" value={modelErrorTopic} onChangeText={setModelErrorTopic} />
        <PlainInput
          label="Full battery flight minutes"
          value={fullBatteryFlightMinutes}
          onChangeText={setFullBatteryFlightMinutes}
          keyboardType="decimal-pad"
        />
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

function PlainInput({
  label,
  value,
  onChangeText,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'decimal-pad';
}) {
  return (
    <>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize="none"
        autoCorrect={false}
        placeholderTextColor={colors.muted}
        style={styles.input}
      />
    </>
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
  inputLabel: {
    color: colors.muted,
    fontSize: typography.small,
    fontWeight: '700',
  },
  input: {
    minHeight: 44,
    borderColor: colors.line,
    borderRadius: 6,
    borderWidth: 1,
    color: colors.text,
    fontFamily: typography.mono,
    paddingHorizontal: spacing.md,
  },
  link: {
    color: colors.accent,
    fontFamily: typography.mono,
    fontSize: typography.small,
    marginTop: spacing.xs,
  },
});
