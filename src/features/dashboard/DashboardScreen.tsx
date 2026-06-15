import React, {useEffect} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {ActionButton} from '@components/ActionButton';
import {Card} from '@components/Card';
import {Screen} from '@components/Screen';
import {StatusPill} from '@components/StatusPill';
import {colors} from '@design/colors';
import {spacing} from '@design/spacing';
import {typography} from '@design/typography';
import {useRos} from '@ros/RosContext';

export function DashboardScreen() {
  const {bridgeUrl, robotNs, poseTopic, state, error, graph, connect, disconnect, refreshGraph} = useRos();
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
      <Text style={styles.title}>DRACON</Text>
      <View style={styles.pills}>
        <StatusPill
          label="ROS Bridge"
          value={state}
          tone={connected ? 'ok' : state === 'error' ? 'bad' : 'warn'}
        />
        <StatusPill label="Robot" value={robotNs || '/'} />
        <StatusPill label="Nodes" value={String(graph.nodes.length)} />
        <StatusPill label="Topics" value={String(graph.topics.length)} />
      </View>
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

const styles = StyleSheet.create({
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
});
