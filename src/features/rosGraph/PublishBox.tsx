import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, TextInput, View} from 'react-native';
import {ActionButton} from '@components/ActionButton';
import {colors} from '@design/colors';
import {radius, spacing} from '@design/spacing';
import {typography} from '@design/typography';
import {buildMessageTemplate, RosTypeDef} from '@ros/messageTemplate';
import {useRos} from '@ros/RosContext';

type Props = {
  topic: string;
  type: string;
};

export function PublishBox({topic, type}: Props) {
  const {client, state} = useRos();
  const [text, setText] = useState('{}');
  const [status, setStatus] = useState('');
  const connected = state === 'connected';

  useEffect(() => {
    let alive = true;
    if (!client || !connected || !type) {
      return;
    }
    client
      .callService<{typedefs: RosTypeDef[]}>('/rosapi/message_details', 'rosapi/MessageDetails', {type})
      .then(result => {
        if (alive) {
          setText(JSON.stringify(buildMessageTemplate(result.typedefs || [], type), null, 2));
        }
      })
      .catch(() => alive && setText('{}'));
    return () => {
      alive = false;
    };
  }, [client, connected, type]);

  const publish = () => {
    try {
      const payload = JSON.parse(text);
      client?.publish(topic, type, payload);
      setStatus(`published ${new Date().toLocaleTimeString()}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    }
  };

  return (
    <View style={styles.box}>
      <Text style={styles.label}>Publish JSON</Text>
      <TextInput
        multiline
        value={text}
        onChangeText={setText}
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
      />
      <View style={styles.row}>
        <ActionButton label="Publish" disabled={!connected} onPress={publish} />
        <Text style={styles.status}>{status}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    gap: spacing.sm,
    borderTopColor: colors.line,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.md,
  },
  label: {
    color: colors.muted,
    fontSize: typography.small,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  input: {
    minHeight: 180,
    borderColor: colors.line,
    borderRadius: radius.sm,
    borderWidth: 1,
    color: colors.text,
    fontFamily: typography.mono,
    fontSize: typography.small,
    padding: spacing.md,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  status: {
    flex: 1,
    color: colors.muted,
    fontFamily: typography.mono,
    fontSize: typography.small,
  },
});
