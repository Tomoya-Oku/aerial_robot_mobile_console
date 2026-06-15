import React, {useEffect, useMemo, useState} from 'react';
import {FlatList, Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import {ActionButton} from '@components/ActionButton';
import {Card} from '@components/Card';
import {Screen} from '@components/Screen';
import {colors} from '@design/colors';
import {radius, spacing} from '@design/spacing';
import {typography} from '@design/typography';
import {RosNodeDetails, RosTopicDetails} from '@ros/rosTypes';
import {useRos} from '@ros/RosContext';
import {PublishBox} from './PublishBox';

type Selection = {
  kind: 'node' | 'topic' | 'service';
  name: string;
};

export function RosGraphScreen() {
  const {client, state, graph, refreshGraph} = useRos();
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<Selection>();
  const [details, setDetails] = useState<RosNodeDetails | RosTopicDetails | {service: string}>();
  const [preview, setPreview] = useState('');
  const connected = state === 'connected';

  useEffect(() => {
    if (connected) {
      refreshGraph().catch(() => undefined);
    }
  }, [connected, refreshGraph]);

  useEffect(() => {
    setDetails(undefined);
    setPreview('');
    if (!client || !connected || !selected) {
      return;
    }
    if (selected.kind === 'node') {
      client
        .callService<RosNodeDetails>('/rosapi/node_details', 'rosapi/NodeDetails', {node: selected.name})
        .then(setDetails)
        .catch(error => setDetails({service: String(error)}));
      return;
    }
    if (selected.kind === 'topic') {
      let unsubscribe: (() => void) | undefined;
      Promise.all([
        client.callService<{type: string}>('/rosapi/topic_type', 'rosapi/TopicType', {topic: selected.name}),
        client.callService<{publishers: string[]}>('/rosapi/publishers', 'rosapi/Publishers', {topic: selected.name}),
        client.callService<{subscribers: string[]}>('/rosapi/subscribers', 'rosapi/Subscribers', {topic: selected.name}),
      ])
        .then(([type, publishers, subscribers]) => {
          const topicDetails = {
            type: type.type,
            publishers: publishers.publishers || [],
            subscribers: subscribers.subscribers || [],
          };
          setDetails(topicDetails);
          unsubscribe = client.subscribe(
            selected.name,
            topicDetails.type,
            message => setPreview(JSON.stringify(message, null, 2).slice(0, 3000)),
            500,
          );
        })
        .catch(error => setDetails({service: String(error)}));
      return () => unsubscribe?.();
    }
    setDetails({service: selected.name});
  }, [client, connected, selected]);

  const rows = useMemo(() => {
    const lower = filter.trim().toLowerCase();
    const all: Selection[] = [
      ...graph.nodes.map(name => ({kind: 'node' as const, name})),
      ...graph.topics.map(name => ({kind: 'topic' as const, name})),
      ...graph.services.map(name => ({kind: 'service' as const, name})),
    ];
    return lower ? all.filter(row => row.name.toLowerCase().includes(lower)) : all;
  }, [filter, graph]);

  return (
    <Screen scroll={false}>
      <Text style={styles.title}>ROS Graph</Text>
      <Card>
        <View style={styles.toolbar}>
          <TextInput
            value={filter}
            onChangeText={setFilter}
            placeholder="Filter node/topic/service"
            style={styles.filter}
          />
          <ActionButton label="Refresh" disabled={!connected} onPress={() => refreshGraph().catch(() => undefined)} />
        </View>
      </Card>
      <View style={styles.split}>
        <Card title={`Graph (${rows.length})`}>
          <FlatList
            data={rows}
            keyExtractor={item => `${item.kind}:${item.name}`}
            renderItem={({item}) => (
              <Pressable
                onPress={() => setSelected(item)}
                style={[
                  styles.item,
                  selected?.kind === item.kind && selected.name === item.name && styles.activeItem,
                ]}>
                <Text style={styles.badge}>{item.kind}</Text>
                <Text style={styles.itemText}>{item.name}</Text>
              </Pressable>
            )}
          />
        </Card>
        <Card title="Details" subtitle={selected?.name || 'Select an item'}>
          <Details selected={selected} details={details} preview={preview} />
        </Card>
      </View>
    </Screen>
  );
}

function Details({
  selected,
  details,
  preview,
}: {
  selected?: Selection;
  details?: RosNodeDetails | RosTopicDetails | {service: string};
  preview: string;
}) {
  if (!selected) {
    return <Text style={styles.muted}>No item selected.</Text>;
  }
  if (!details) {
    return <Text style={styles.muted}>Loading...</Text>;
  }
  if ('service' in details) {
    return <Text style={styles.mono}>{details.service}</Text>;
  }
  if ('type' in details) {
    return (
      <View style={styles.details}>
        <Text style={styles.mono}>type: {details.type}</Text>
        <Text style={styles.muted}>publishers: {details.publishers.length}</Text>
        <Text style={styles.muted}>subscribers: {details.subscribers.length}</Text>
        <Text style={styles.label}>Latest message</Text>
        <Text style={styles.preview}>{preview || 'waiting...'}</Text>
        <PublishBox topic={selected.name} type={details.type} />
      </View>
    );
  }
  return (
    <View style={styles.details}>
      <Text style={styles.label}>Publications</Text>
      {(details.publications || []).map(value => <Text key={value} style={styles.mono}>{value}</Text>)}
      <Text style={styles.label}>Subscriptions</Text>
      {(details.subscriptions || []).map(value => <Text key={value} style={styles.mono}>{value}</Text>)}
      <Text style={styles.label}>Services</Text>
      {(details.services || []).map(value => <Text key={value} style={styles.mono}>{value}</Text>)}
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.ink,
    fontSize: typography.title,
    fontWeight: '800',
  },
  toolbar: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  filter: {
    flex: 1,
    minHeight: 44,
    borderColor: colors.line,
    borderRadius: radius.sm,
    borderWidth: 1,
    color: colors.text,
    paddingHorizontal: spacing.md,
  },
  split: {
    flex: 1,
    gap: spacing.md,
  },
  item: {
    gap: spacing.xs,
    borderBottomColor: colors.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.md,
  },
  activeItem: {
    backgroundColor: colors.surfaceAlt,
  },
  badge: {
    color: colors.accent,
    fontSize: typography.small,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  itemText: {
    color: colors.text,
    fontFamily: typography.mono,
    fontSize: typography.small,
  },
  details: {
    gap: spacing.sm,
  },
  muted: {
    color: colors.muted,
  },
  mono: {
    color: colors.text,
    fontFamily: typography.mono,
    fontSize: typography.small,
  },
  label: {
    color: colors.muted,
    fontSize: typography.small,
    fontWeight: '800',
    marginTop: spacing.sm,
    textTransform: 'uppercase',
  },
  preview: {
    maxHeight: 220,
    color: colors.text,
    fontFamily: typography.mono,
    fontSize: typography.small,
  },
});
