import React, {useEffect, useMemo, useState} from 'react';
import {StyleSheet, Text, TextInput, View} from 'react-native';
import {ActionButton} from '@components/ActionButton';
import {Card} from '@components/Card';
import {Screen} from '@components/Screen';
import {colors} from '@design/colors';
import {radius, spacing} from '@design/spacing';
import {typography} from '@design/typography';
import {extractNumericLeaves} from '@ros/messageTemplate';
import {PlotSeries} from '@ros/rosTypes';
import {useRos} from '@ros/RosContext';
import {SeriesPlot} from './SeriesPlot';

const maxSamples = 300;

export function PlotScreen() {
  const {client, state} = useRos();
  const [topic, setTopic] = useState('/dragon/uav/cog/odom');
  const [type, setType] = useState('nav_msgs/Odometry');
  const [paused, setPaused] = useState(false);
  const [series, setSeries] = useState<PlotSeries[]>([]);
  const connected = state === 'connected';

  useEffect(() => {
    if (!client || !connected || !topic || !type || paused) {
      return;
    }
    const unsubscribe = client.subscribe(topic, type, message => {
      const now = Date.now();
      const leaves = extractNumericLeaves(message);
      setSeries(current => {
        const byKey = new Map(current.map(item => [item.key, item]));
        Object.entries(leaves)
          .slice(0, 6)
          .forEach(([field, value], index) => {
            const key = `${topic}:${field}`;
            const previous = byKey.get(key);
            const color = previous?.color || colors.plot[index % colors.plot.length];
            byKey.set(key, {
              key,
              topic,
              field,
              color,
              latest: value,
              samples: [...(previous?.samples || []), {time: now, value}].slice(-maxSamples),
            });
          });
        return Array.from(byKey.values()).slice(0, 6);
      });
    }, 100);
    return unsubscribe;
  }, [client, connected, paused, topic, type]);

  const subtitle = useMemo(() => `${series.length} series, ${maxSamples} sample buffer`, [series.length]);

  return (
    <Screen>
      <Text style={styles.title}>Plot</Text>
      <Card title="Realtime topic plot" subtitle={subtitle}>
        <Text style={styles.label}>Topic</Text>
        <TextInput value={topic} onChangeText={setTopic} autoCapitalize="none" style={styles.input} />
        <Text style={styles.label}>Message type</Text>
        <TextInput value={type} onChangeText={setType} autoCapitalize="none" style={styles.input} />
        <View style={styles.row}>
          <ActionButton label={paused ? 'Resume' : 'Pause'} onPress={() => setPaused(value => !value)} tone="secondary" />
          <ActionButton label="Clear" onPress={() => setSeries([])} tone="secondary" />
        </View>
      </Card>
      <Card>
        <SeriesPlot series={series} />
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
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
