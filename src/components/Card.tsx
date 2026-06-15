import React, {PropsWithChildren} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {colors} from '@design/colors';
import {radius, spacing} from '@design/spacing';
import {typography} from '@design/typography';

type Props = PropsWithChildren<{
  title?: string;
  subtitle?: string;
}>;

export function Card({title, subtitle, children}: Props) {
  return (
    <View style={styles.card}>
      {title ? (
        <View style={styles.head}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    borderColor: colors.line,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: colors.surface,
  },
  head: {
    gap: spacing.xs,
  },
  title: {
    color: colors.ink,
    fontSize: typography.section,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.muted,
    fontSize: typography.small,
  },
});
