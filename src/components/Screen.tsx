import React, {PropsWithChildren} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {colors} from '@design/colors';
import {spacing} from '@design/spacing';

type Props = PropsWithChildren<{
  scroll?: boolean;
}>;

export function Screen({children, scroll = true}: Props) {
  const insets = useSafeAreaInsets();
  // Respect notches on every edge, including left/right for landscape orientation.
  const safeArea = {
    paddingTop: insets.top + spacing.md,
    paddingLeft: insets.left + spacing.lg,
    paddingRight: insets.right + spacing.lg,
  };
  const content = (
    <View style={[styles.content, safeArea]}>{children}</View>
  );

  if (!scroll) {
    return <View style={styles.root}>{content}</View>;
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll}>
      {content}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
});
