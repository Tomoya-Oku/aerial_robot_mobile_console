import React, {useState} from 'react';
import {FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
import {Screen} from '@components/Screen';
import {radius, spacing} from '@design/spacing';
import {typography} from '@design/typography';
import {STORAGE_KEYS, pushHistory} from '@lib/storage';
import {usePersistentState} from '@lib/usePersistentState';
import {useRos} from '@ros/RosContext';

type LogLine = {
  id: string;
  text: string;
  tone: 'command' | 'output' | 'error';
};

// Terminal-style palette, independent from the light app theme.
const term = {
  bg: '#0c1021',
  surface: '#11162e',
  prompt: '#56d364',
  command: '#7ee787',
  output: '#c9d1d9',
  error: '#ff7b72',
  muted: '#768390',
  line: '#21262d',
};

export function ConsoleScreen() {
  const {client, state, refreshGraph} = useRos();
  const [command, setCommand] = useState('');
  const [lines, setLines] = useState<LogLine[]>([]);
  const [history, setHistory] = usePersistentState<string[]>(STORAGE_KEYS.consoleHistory, []);
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
    setHistory(pushHistory(history, raw, 30));
    append(`$ ${raw}`, 'command');
    try {
      if (raw === 'help') {
        append('commands: help, clear, graph, nodes, topics, services, call <service> <type> <json>, pub <topic> <type> <json>', 'output');
        return;
      }
      if (raw === 'clear') {
        setLines([]);
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
      <View style={styles.terminal}>
        <FlatList
          inverted
          style={styles.log}
          data={lines}
          keyExtractor={item => item.id}
          ListEmptyComponent={<Text style={styles.hintLine}>type `help` and press Send</Text>}
          renderItem={({item}) => <Text style={[styles.line, styles[item.tone]]}>{item.text}</Text>}
        />
        {history.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.historyRow}>
            {history.map(item => (
              <Pressable
                key={item}
                accessibilityRole="button"
                accessibilityLabel={`コマンド履歴 ${item}`}
                onPress={() => setCommand(item)}
                style={styles.chip}>
                <Text numberOfLines={1} style={styles.chipText}>
                  {item}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}
        <View style={styles.inputRow}>
          <Text style={styles.dollar}>$</Text>
          <TextInput
            value={command}
            onChangeText={setCommand}
            placeholder={connected ? 'help' : 'not connected'}
            placeholderTextColor={term.muted}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
            returnKeyType="send"
            onSubmitEditing={run}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: '#1f2933',
    fontSize: typography.title,
    fontWeight: '800',
  },
  terminal: {
    flex: 1,
    borderRadius: radius.md,
    backgroundColor: term.bg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  log: {
    flex: 1,
  },
  line: {
    fontFamily: typography.mono,
    fontSize: typography.small,
    paddingVertical: 2,
  },
  hintLine: {
    color: term.muted,
    fontFamily: typography.mono,
    fontSize: typography.small,
    transform: [{scaleY: -1}],
  },
  command: {
    color: term.command,
  },
  output: {
    color: term.output,
  },
  error: {
    color: term.error,
  },
  historyRow: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  chip: {
    maxWidth: 220,
    borderColor: term.line,
    borderRadius: radius.sm,
    borderWidth: 1,
    backgroundColor: term.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  chipText: {
    color: term.command,
    fontFamily: typography.mono,
    fontSize: typography.small,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderTopColor: term.line,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.sm,
  },
  dollar: {
    color: term.prompt,
    fontFamily: typography.mono,
    fontSize: typography.body,
    fontWeight: '800',
  },
  input: {
    flex: 1,
    minHeight: 44,
    color: term.output,
    fontFamily: typography.mono,
    fontSize: typography.body,
    padding: 0,
  },
});
