import React, {useEffect, useRef} from 'react';
import {Pressable, StyleSheet, Text, ViewStyle} from 'react-native';
import {colors} from '@design/colors';
import {radius, spacing} from '@design/spacing';
import {typography} from '@design/typography';

type Tone = 'primary' | 'secondary' | 'danger';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: Tone;
  style?: ViewStyle;
  accessibilityLabel?: string;
  // When true, onPress repeats while the button is held (for teleop hold-to-move).
  repeatOnHold?: boolean;
  repeatInterval?: number;
  // Called once when a held button is released (e.g. to publish a stop command).
  onRelease?: () => void;
};

export function ActionButton({
  label,
  onPress,
  disabled,
  tone = 'primary',
  style,
  accessibilityLabel,
  repeatOnHold = false,
  repeatInterval = 150,
  onRelease,
}: Props) {
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const clear = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = undefined;
    }
  };

  useEffect(() => clear, []);

  const handlePressIn = () => {
    if (disabled) {
      return;
    }
    onPress();
    timerRef.current = setInterval(onPress, repeatInterval);
  };

  const handlePressOut = () => {
    clear();
    onRelease?.();
  };

  const pressableProps = repeatOnHold
    ? {onPressIn: handlePressIn, onPressOut: handlePressOut}
    : {onPress};

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      disabled={disabled}
      {...pressableProps}
      style={({pressed}) => [
        styles.button,
        styles[tone],
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}>
      <Text style={[styles.label, tone !== 'primary' && styles.secondaryLabel]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  primary: {
    borderColor: colors.ink,
    backgroundColor: colors.ink,
  },
  secondary: {
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  danger: {
    borderColor: colors.danger,
    backgroundColor: '#fff5f5',
  },
  label: {
    color: colors.surface,
    fontSize: typography.body,
    fontWeight: '700',
  },
  secondaryLabel: {
    color: colors.ink,
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    transform: [{translateY: 1}],
  },
});
