import React, {useEffect} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {ActionButton} from '@components/ActionButton';
import {Card} from '@components/Card';
import {ConnectionSignal} from '@components/ConnectionSignal';
import {Screen} from '@components/Screen';
import {StatusPill} from '@components/StatusPill';
import {colors} from '@design/colors';
import {spacing} from '@design/spacing';
import {typography} from '@design/typography';
import {useRos} from '@ros/RosContext';
import {useAerialTelemetry} from '@ros/useAerialTelemetry';

export function DashboardScreen() {
  const {bridgeUrl, robotNs, poseTopic, state, error, graph, connect, disconnect, refreshGraph} = useRos();
  const {flightState, battery, modelError} = useAerialTelemetry();
  const connected = state === 'connected';

  useEffect(() => {
    if (!connected) {
      return;
    }
    refreshGraph().catch(() => undefined);
    const id = setInterval(() => refreshGraph().catch(() => undefined), 3000);
    return () => clearInterval(id);
  }, [connected, refreshGraph]);

  return (
    <Screen>
      <View style={styles.header}>
        <ConnectionSignal state={state} />
        <Text style={styles.title}>DRACON</Text>
      </View>
      <View style={styles.pills}>
        <StatusPill
          label="ROS Bridge"
          value={state}
          tone={connected ? 'ok' : state === 'error' ? 'bad' : 'warn'}
        />
        <StatusPill label="Robot" value={robotNs || '/'} />
        <StatusPill
          label="Flight"
          value={flightState ? `${flightState.label} (${flightState.code})` : 'unknown'}
          tone={flightState?.tone || 'warn'}
        />
        <StatusPill
          label="Battery"
          value={battery?.percentage == null ? '--' : `${battery.percentage.toFixed(0)}%`}
          tone={(battery?.percentage ?? 100) < 25 ? 'bad' : 'ok'}
        />
        <StatusPill
          label="Error"
          value={modelError?.maxAbs == null ? '--' : modelError.maxAbs.toFixed(3)}
          tone={(modelError?.maxAbs ?? 0) > 0.2 ? 'warn' : 'ok'}
        />
        <StatusPill label="Nodes" value={String(graph.nodes.length)} />
        <StatusPill label="Topics" value={String(graph.topics.length)} />
      </View>
      <Card title="Battery summary">
        <View style={styles.metrics}>
          <Metric label="Voltage" value={battery?.voltage == null ? '--' : `${battery.voltage.toFixed(2)} V`} />
          <Metric label="Percentage" value={battery?.percentage == null ? '--' : `${battery.percentage.toFixed(0)}%`} />
          <Metric
            label="Remaining"
            value={battery?.remainingMinutes == null ? '--' : `${battery.remainingMinutes.toFixed(1)} min`}
          />
        </View>
      </Card>
      <Card title="Connection" subtitle={error || 'rosbridge websocket'}>
        <Text style={styles.mono}>{bridgeUrl}</Text>
        <Text style={styles.mono}>{poseTopic}</Text>
        <View style={styles.row}>
          <ActionButton label="Connect" onPress={connect} disabled={connected} style={styles.flex} />
          <ActionButton label="Disconnect" onPress={disconnect} tone="secondary" style={styles.flex} />
        </View>
      </Card>
      <Card title="Operational focus">
        <Text style={styles.body}>
          Use Joystick for teleop, ROS for graph inspection and publishing, Plot for live numeric
          telemetry, and Console for command-style ROS service/topic operations.
        </Text>
      </Card>
    </Screen>
  );
}

function Metric({label, value}: {label: string; value: string}) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
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
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
  mono: {
    color: colors.text,
    fontFamily: typography.mono,
  },
  body: {
    color: colors.text,
    lineHeight: 20,
  },
  metrics: {
    gap: spacing.sm,
  },
  metric: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomColor: colors.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  metricLabel: {
    color: colors.muted,
    fontSize: typography.small,
  },
  metricValue: {
    color: colors.ink,
    fontFamily: typography.mono,
    fontWeight: '700',
  },
});
