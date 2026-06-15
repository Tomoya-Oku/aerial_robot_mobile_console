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
  const content = (
    <View style={[styles.content, {paddingTop: insets.top + spacing.md}]}>
      {children}
    </View>
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
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
});
