import React from 'react';
import {Pressable, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
import {colors} from '@design/colors';
import {radius, spacing} from '@design/spacing';
import {typography} from '@design/typography';

type Props = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  history?: string[];
  placeholder?: string;
};

// Labeled text field with a row of recent-value chips for one-tap reuse.
export function HistoryInput({label, value, onChangeText, history = [], placeholder}: Props) {
  const recent = history.filter(item => item !== value);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={styles.input}
      />
      {recent.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}>
          {recent.map(item => (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityLabel={`${label} 履歴 ${item}`}
              onPress={() => onChangeText(item)}
              style={styles.chip}>
              <Text numberOfLines={1} style={styles.chipText}>
                {item}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
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
  chips: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  chip: {
    maxWidth: 220,
    borderColor: colors.line,
    borderRadius: radius.sm,
    borderWidth: 1,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  chipText: {
    color: colors.accent,
    fontFamily: typography.mono,
    fontSize: typography.small,
  },
});
