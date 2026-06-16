import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {colors} from '@design/colors';
import {spacing} from '@design/spacing';
import {typography} from '@design/typography';
import {RosConnectionState} from '@ros/rosTypes';

type Props = {
  state: RosConnectionState;
  size?: number;
  showLabel?: boolean;
};

// Traffic-light style indicator: green = connected, amber = connecting, red = not connected.
export function ConnectionSignal({state, size = 18, showLabel = true}: Props) {
  const color =
    state === 'connected' ? colors.ok : state === 'connecting' ? colors.warn : colors.danger;
  const label =
    state === 'connected' ? '接続済み' : state === 'connecting' ? '接続中' : '未接続';

  return (
    <View style={styles.row}>
      <View
        accessibilityRole="image"
        accessibilityLabel={`接続状況: ${label}`}
        style={[
          styles.dot,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
            shadowColor: color,
          },
        ]}
      />
      {showLabel ? <Text style={[styles.label, {color}]}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
    shadowOpacity: 0.6,
    shadowRadius: 4,
    shadowOffset: {width: 0, height: 0},
  },
  label: {
    fontSize: typography.small,
    fontWeight: '800',
  },
});
