import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {colors} from '@design/colors';
import {radius, spacing} from '@design/spacing';
import {typography} from '@design/typography';

type Props = {
  active: boolean;
};

// 3D URDF viewer のプレースホルダ。
// React Native では Web 版の Three.js URDF viewer をそのまま使えないため、
// 将来 expo-gl もしくは react-native-webview ベースの実装へ差し替える前提で
// このコンポーネントの内部だけを置き換えられるよう独立させてある。
// 現状は領域の確保と状態表示のみを行う。
export function ModelViewer({active}: Props) {
  return (
    <View style={styles.viewer}>
      <Text style={styles.badge}>3D VIEW</Text>
      <Text style={styles.hint}>
        {active ? 'URDF viewer は今後実装（数値ビューは下に表示）' : 'ROS bridge 未接続'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  viewer: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    backgroundColor: colors.surfaceAlt,
  },
  badge: {
    color: colors.muted,
    fontFamily: typography.mono,
    fontSize: typography.section,
    fontWeight: '700',
    letterSpacing: 2,
  },
  hint: {
    color: colors.muted,
    fontSize: typography.small,
  },
});
