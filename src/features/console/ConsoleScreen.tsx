import React, {useState} from 'react';
import {FlatList, StyleSheet, Text, TextInput, View} from 'react-native';
import {ActionButton} from '@components/ActionButton';
import {Card} from '@components/Card';
import {Screen} from '@components/Screen';
import {colors} from '@design/colors';
import {radius, spacing} from '@design/spacing';
import {typography} from '@design/typography';
import {useRos} from '@ros/RosContext';

type LogLine = {
  id: string;
  text: string;
  tone: 'command' | 'output' | 'error';
};

export function ConsoleScreen() {
  const {client, state, refreshGraph} = useRos();
  const [command, setCommand] = useState('');
  const [lines, setLines] = useState<LogLine[]>([]);
  const connected = state === 'connected';

  const append = (text: string, tone: LogLine['tone']) => {
    setLines(current => [{id: `${Date.now()}:${current.length}`, text, tone}, ...current].slice(0, 200));
  };

  const run = async () => {
    const raw = command.trim();
    if (!raw) {
      return;
    }
    setCommand('');
    append(`> ${raw}`, 'command');
    try {
      if (raw === 'help') {
        append('commands: help, graph, nodes, topics, services, call <service> <type> <json>, pub <topic> <type> <json>', 'output');
        return;
      }
      if (raw === 'graph') {
        await refreshGraph();
        append('graph refreshed', 'output');
        return;
      }
      if (raw === 'nodes' || raw === 'topics' || raw === 'services') {
        const service = `/rosapi/${raw}`;
        const type = raw === 'nodes' ? 'rosapi/Nodes' : raw === 'topics' ? 'rosapi/Topics' : 'rosapi/Services';
        const result = await client?.callService(service, type);
        append(JSON.stringify(result, null, 2), 'output');
        return;
      }
      if (raw.startsWith('call ')) {
        const [, service, type, ...jsonParts] = raw.split(' ');
        const args = jsonParts.length ? JSON.parse(jsonParts.join(' ')) : {};
        const result = await client?.callService(service, type, args);
        append(JSON.stringify(result, null, 2), 'output');
        return;
      }
      if (raw.startsWith('pub ')) {
        const [, topic, type, ...jsonParts] = raw.split(' ');
        const payload = jsonParts.length ? JSON.parse(jsonParts.join(' ')) : {};
        client?.publish(topic, type, payload);
        append(`published ${topic}`, 'output');
        return;
      }
      append('unknown command. type help', 'error');
    } catch (error) {
      append(error instanceof Error ? error.message : String(error), 'error');
    }
  };

  return (
    <Screen scroll={false}>
      <Text style={styles.title}>Console</Text>
      <Card subtitle="ROS command terminal">
        <View style={styles.inputRow}>
          <TextInput
            value={command}
            onChangeText={setCommand}
            placeholder="help"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
            onSubmitEditing={run}
          />
          <ActionButton label="Send" disabled={!connected} onPress={run} />
        </View>
      </Card>
      <Card title="Log">
        <FlatList
          inverted
          data={lines}
          keyExtractor={item => item.id}
          renderItem={({item}) => (
            <Text style={[styles.line, styles[item.tone]]}>{item.text}</Text>
          )}
        />
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
  inputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 44,
    borderColor: colors.line,
    borderRadius: radius.sm,
    borderWidth: 1,
    color: colors.text,
    fontFamily: typography.mono,
    paddingHorizontal: spacing.md,
  },
  line: {
    borderBottomColor: colors.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
    color: colors.text,
    fontFamily: typography.mono,
    fontSize: typography.small,
    paddingVertical: spacing.sm,
  },
  command: {
    color: colors.accent,
  },
  output: {
    color: colors.text,
  },
  error: {
    color: colors.danger,
  },
});
