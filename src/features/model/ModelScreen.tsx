import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {Card} from '@components/Card';
import {ConnectionSignal} from '@components/ConnectionSignal';
import {Screen} from '@components/Screen';
import {StatusPill} from '@components/StatusPill';
import {colors} from '@design/colors';
import {spacing} from '@design/spacing';
import {typography} from '@design/typography';
import {extractNumericLeaves} from '@ros/messageTemplate';
import {useRos} from '@ros/RosContext';
import {ModelViewer} from './ModelViewer';

// jsk_aerial_robot の RobotInterface / BaseNavigator に合わせた既定型。
// poseTopic は Settings で差し替え可能なため、Model タブでは数値 leaf として表示する。
const POSE_TYPE = 'nav_msgs/Odometry';
const FLIGHT_STATE_TYPE = 'std_msgs/UInt8';
const MODEL_ERROR_TYPE = 'aerial_robot_msgs/PoseControlPid';

// aerial_robot_control/include/aerial_robot_control/flight_navigation.h の enum と異常 state。
const FLIGHT_STATE_LABELS: Record<number, string> = {
  0: 'ARM_OFF',
  1: 'START',
  2: 'ARM_ON',
  3: 'TAKEOFF',
  4: 'LAND',
  5: 'HOVER',
  6: 'STOP',
  16: 'LOW_BATTERY',
  17: 'FORCE_LANDING',
};

// 接続中のみ topic を購読し、最新メッセージの数値 leaf を返す。
function useTopicLeaves(topic: string, type: string) {
  const {client, state} = useRos();
  const connected = state === 'connected';
  const [leaves, setLeaves] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!client || !connected || !topic || !type) {
      setLeaves({});
      return;
    }
    const unsubscribe = client.subscribe(
      topic,
      type,
      message => setLeaves(extractNumericLeaves(message)),
      200,
    );
    return unsubscribe;
  }, [client, connected, topic, type]);

  return {leaves, connected};
}

function FieldTable({leaves}: {leaves: Record<string, number>}) {
  const entries = Object.entries(leaves);
  if (!entries.length) {
    return <Text style={styles.empty}>待機中…</Text>;
  }
  return (
    <View style={styles.table}>
      {entries.map(([field, value]) => (
        <View key={field} style={styles.tableRow}>
          <Text style={styles.fieldKey} numberOfLines={1}>
            {field}
          </Text>
          <Text style={styles.fieldVal}>{value.toFixed(3)}</Text>
        </View>
      ))}
    </View>
  );
}

export function ModelScreen() {
  const {state, poseTopic, flightStateTopic, modelErrorTopic} = useRos();
  const {leaves: pose, connected} = useTopicLeaves(poseTopic, POSE_TYPE);
  const {leaves: flightState} = useTopicLeaves(flightStateTopic, FLIGHT_STATE_TYPE);
  const {leaves: modelError} = useTopicLeaves(modelErrorTopic, MODEL_ERROR_TYPE);

  const stateValue = flightState.data;
  const stateLabel =
    stateValue === undefined
      ? '—'
      : FLIGHT_STATE_LABELS[stateValue] ?? String(stateValue);

  return (
    <Screen>
      <View style={styles.header}>
        <ConnectionSignal state={state} showLabel={false} size={14} />
        <Text style={styles.title}>Model</Text>
      </View>

      <View style={styles.pills}>
        <StatusPill
          label="Flight state"
          value={stateLabel}
          tone={connected ? 'ok' : 'warn'}
        />
        <StatusPill label="Pose fields" value={String(Object.keys(pose).length)} />
      </View>

      <Card title="3D view" subtitle="URDF / robot model">
        <ModelViewer active={connected} />
      </Card>

      <Card title="Pose" subtitle="数値ビュー（フォールバック）">
        <FieldTable leaves={pose} />
      </Card>

      <Card title="Model error" subtitle="制御誤差（PID 等）">
        <FieldTable leaves={modelError} />
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
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  table: {
    gap: spacing.xs,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  fieldKey: {
    flex: 1,
    color: colors.muted,
    fontFamily: typography.mono,
    fontSize: typography.small,
  },
  fieldVal: {
    color: colors.text,
    fontFamily: typography.mono,
    fontSize: typography.body,
    fontWeight: '700',
  },
  empty: {
    color: colors.muted,
    fontFamily: typography.mono,
    fontSize: typography.small,
  },
});
