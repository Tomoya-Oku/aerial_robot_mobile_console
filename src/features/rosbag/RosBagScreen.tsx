import React, {useEffect, useMemo, useState} from 'react';
import {FlatList, Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import {ActionButton} from '@components/ActionButton';
import {Card} from '@components/Card';
import {ConnectionSignal} from '@components/ConnectionSignal';
import {Screen} from '@components/Screen';
import {colors} from '@design/colors';
import {radius, spacing} from '@design/spacing';
import {typography} from '@design/typography';
import {useRos} from '@ros/RosContext';

// Compatible with aerial_robot_web's /aerial_robot_web/rosbag/{start,stop,status}.
// The exact service types are not verifiable from this repo, so they are kept
// here as adjustable assumptions. Errors surface in the status log below.
const ROSBAG = {
  start: '/aerial_robot_web/rosbag/start',
  stop: '/aerial_robot_web/rosbag/stop',
  status: '/aerial_robot_web/rosbag/status',
  startType: 'aerial_robot_web/RosbagStart',
  stopType: 'std_srvs/Trigger',
  statusType: 'std_srvs/Trigger',
};

export function RosBagScreen() {
  const {client, state, graph, refreshGraph} = useRos();
  const connected = state === 'connected';
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    if (connected) {
      refreshGraph().catch(() => undefined);
    }
  }, [connected, refreshGraph]);

  const topics = useMemo(() => {
    const lower = filter.trim().toLowerCase();
    return lower ? graph.topics.filter(t => t.toLowerCase().includes(lower)) : graph.topics;
  }, [filter, graph.topics]);

  const toggle = (topic: string) => {
    setSelected(current => {
      const next = new Set(current);
      if (next.has(topic)) {
        next.delete(topic);
      } else {
        next.add(topic);
      }
      return next;
    });
  };

  const startRecording = async () => {
    const list = Array.from(selected);
    try {
      // No selection means record all topics, matching `rosbag record -a`.
      await client?.callService(ROSBAG.start, ROSBAG.startType, {
        topics: list,
        all: list.length === 0,
      });
      setRecording(true);
      setStatus(`recording ${list.length === 0 ? 'all topics' : `${list.length} topics`}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    }
  };

  const stopRecording = async () => {
    try {
      await client?.callService(ROSBAG.stop, ROSBAG.stopType);
      setRecording(false);
      setStatus('stopped');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    }
  };

  const checkStatus = async () => {
    try {
      const result = await client?.callService(ROSBAG.status, ROSBAG.statusType);
      setStatus(JSON.stringify(result));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    }
  };

  return (
    <Screen scroll={false}>
      <View style={styles.header}>
        <ConnectionSignal state={state} showLabel={false} size={14} />
        <Text style={styles.title}>Rosbag</Text>
      </View>
      <Card title="Record" subtitle={recording ? '録画中' : '停止中'}>
        <View style={styles.row}>
          <ActionButton
            label={recording ? 'Recording...' : 'Record'}
            tone={recording ? 'secondary' : 'primary'}
            disabled={!connected || recording}
            onPress={startRecording}
            style={styles.flex}
          />
          <ActionButton
            label="Stop"
            tone="danger"
            disabled={!connected || !recording}
            onPress={stopRecording}
            style={styles.flex}
          />
          <ActionButton label="Status" tone="secondary" disabled={!connected} onPress={checkStatus} />
        </View>
        <Text style={styles.status}>{status}</Text>
        <Text style={styles.hint}>
          選択なしで全トピック録画。{selected.size} 件選択中。
        </Text>
      </Card>
      <Card title={`記録トピック選択 (${topics.length})`}>
        <TextInput
          value={filter}
          onChangeText={setFilter}
          placeholder="Filter topics"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          style={styles.filter}
        />
        <FlatList
          style={styles.list}
          data={topics}
          keyExtractor={item => item}
          ListEmptyComponent={<Text style={styles.empty}>接続してトピックを取得してください</Text>}
          renderItem={({item}) => {
            const on = selected.has(item);
            return (
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{checked: on}}
                onPress={() => toggle(item)}
                style={styles.topicRow}>
                <View style={[styles.checkbox, on && styles.checkboxOn]}>
                  {on ? <Text style={styles.check}>✓</Text> : null}
                </View>
                <Text style={styles.topicText}>{item}</Text>
              </Pressable>
            );
          }}
        />
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
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
  status: {
    color: colors.muted,
    fontFamily: typography.mono,
    fontSize: typography.small,
  },
  hint: {
    color: colors.muted,
    fontSize: typography.small,
  },
  filter: {
    minHeight: 44,
    borderColor: colors.line,
    borderRadius: radius.sm,
    borderWidth: 1,
    color: colors.text,
    paddingHorizontal: spacing.md,
  },
  list: {
    flex: 1,
  },
  empty: {
    color: colors.muted,
    paddingVertical: spacing.md,
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderBottomColor: colors.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: colors.line,
    borderRadius: radius.sm,
    borderWidth: 1,
    backgroundColor: colors.surface,
  },
  checkboxOn: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  check: {
    color: colors.surface,
    fontSize: typography.small,
    fontWeight: '800',
  },
  topicText: {
    flex: 1,
    color: colors.text,
    fontFamily: typography.mono,
    fontSize: typography.small,
  },
});
