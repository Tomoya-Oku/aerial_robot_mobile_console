import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {colors} from '@design/colors';
import {radius, spacing} from '@design/spacing';
import {typography} from '@design/typography';

type Option<T extends string> = {value: T; label: string};

type Props<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

// Simple segmented selector used for mutually-exclusive options.
export function SegmentedControl<T extends string>({options, value, onChange}: Props<T>) {
  return (
    <View style={styles.row}>
      {options.map(option => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{selected: active}}
            onPress={() => onChange(option.value)}
            style={[styles.segment, active && styles.activeSegment]}>
            <Text style={[styles.label, active && styles.activeLabel]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
    borderColor: colors.line,
    borderRadius: radius.sm,
    borderWidth: 1,
    backgroundColor: colors.surfaceAlt,
    padding: spacing.xs,
  },
  segment: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
  },
  activeSegment: {
    backgroundColor: colors.ink,
  },
  label: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: '700',
  },
  activeLabel: {
    color: colors.surface,
  },
});
