import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import Svg, {Line, Polyline, Text as SvgText} from 'react-native-svg';
import {colors} from '@design/colors';
import {spacing} from '@design/spacing';
import {typography} from '@design/typography';
import {PlotSeries} from '@ros/rosTypes';

type Props = {
  series: PlotSeries[];
  width?: number;
  height?: number;
};

export function SeriesPlot({series, width = 330, height = 220}: Props) {
  const samples = series.flatMap(item => item.samples);
  if (!samples.length) {
    return <Text style={styles.empty}>No samples yet.</Text>;
  }

  const minT = Math.min(...samples.map(sample => sample.time));
  const maxT = Math.max(...samples.map(sample => sample.time));
  const minV = Math.min(...samples.map(sample => sample.value));
  const maxV = Math.max(...samples.map(sample => sample.value));
  const pad = 24;
  const plotW = width - pad * 2;
  const plotH = height - pad * 2;
  const scaleX = (time: number) => pad + ((time - minT) / Math.max(maxT - minT, 1)) * plotW;
  const scaleY = (value: number) => pad + plotH - ((value - minV) / Math.max(maxV - minV, 1)) * plotH;

  return (
    <View style={styles.wrap}>
      <Svg width={width} height={height}>
        <Line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke={colors.line} />
        <Line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke={colors.line} />
        <SvgText x={pad} y={14} fill={colors.muted} fontSize="10">{maxV.toFixed(2)}</SvgText>
        <SvgText x={pad} y={height - 6} fill={colors.muted} fontSize="10">{minV.toFixed(2)}</SvgText>
        {series.map(item => {
          const points = item.samples.map(sample => `${scaleX(sample.time)},${scaleY(sample.value)}`).join(' ');
          return <Polyline key={item.key} points={points} fill="none" stroke={item.color} strokeWidth="2" />;
        })}
      </Svg>
      <View style={styles.legend}>
        {series.map(item => (
          <Text key={item.key} style={[styles.legendText, {color: item.color}]}>
            {item.field}: {item.latest?.toFixed(3) ?? '--'}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
    alignItems: 'center',
  },
  empty: {
    color: colors.muted,
  },
  legend: {
    alignSelf: 'stretch',
    gap: spacing.xs,
  },
  legendText: {
    fontFamily: typography.mono,
    fontSize: typography.small,
  },
});
