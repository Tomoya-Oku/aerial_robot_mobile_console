import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {colors} from '@design/colors';
import {radius, spacing} from '@design/spacing';
import {typography} from '@design/typography';

type Tone = 'ok' | 'warn' | 'bad' | 'neutral';

type Props = {
  label: string;
  value: string;
  tone?: Tone;
};

export function StatusPill({label, value, tone = 'neutral'}: Props) {
  return (
    <View style={styles.pill}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, styles[tone]]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flex: 1,
    minWidth: 130,
    gap: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    backgroundColor: colors.surfaceAlt,
    padding: spacing.md,
  },
  label: {
    color: colors.muted,
    fontSize: typography.small,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  value: {
    color: colors.text,
    fontFamily: typography.mono,
    fontSize: typography.body,
    fontWeight: '700',
  },
  ok: {
    color: colors.ok,
  },
  warn: {
    color: colors.warn,
  },
  bad: {
    color: colors.danger,
  },
  neutral: {
    color: colors.text,
  },
});
