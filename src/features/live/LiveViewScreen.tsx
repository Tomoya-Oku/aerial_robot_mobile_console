import React, {useMemo, useRef, useState} from 'react';
import {Image, PanResponder, StyleSheet, Text, View} from 'react-native';
import Svg, {Circle, Line, Path, Polyline, Rect} from 'react-native-svg';
import {ActionButton} from '@components/ActionButton';
import {Card} from '@components/Card';
import {ConnectionSignal} from '@components/ConnectionSignal';
import {Screen} from '@components/Screen';
import {StatusPill} from '@components/StatusPill';
import {colors} from '@design/colors';
import {radius, spacing} from '@design/spacing';
import {typography} from '@design/typography';
import {FLIGHT_NAV, useFlightNavPublisher} from '@features/joystick/useFlightNavPublisher';
import {useAerialTelemetry} from '@ros/useAerialTelemetry';

type TracePoint = {
  x: number;
  y: number;
};

const VIEW_HEIGHT = 260;
const PATH_SEND_INTERVAL_MS = 350;

export function LiveViewScreen() {
  const {connected, publishNav} = useFlightNavPublisher();
  const {flightState, battery, pose, modelError, camera} = useAerialTelemetry({includeCamera: true});
  const [width, setWidth] = useState(330);
  const [trace, setTrace] = useState<TracePoint[]>([]);
  const [armed, setArmed] = useState(false);
  const [pathStatus, setPathStatus] = useState('draw a path');
  const traceRef = useRef<TracePoint[]>([]);

  const canFlyPath = connected && flightState?.code === 5 && armed && trace.length >= 2;
  const projectedPose = useMemo(() => projectPoint({x: 0, y: 0}, width, VIEW_HEIGHT), [width]);
  const tracePoints = trace.map(point => `${point.x},${point.y}`).join(' ');

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: event => {
          const point = clampPoint(event.nativeEvent.locationX, event.nativeEvent.locationY, width);
          traceRef.current = [point];
          setTrace([point]);
          setArmed(false);
          setPathStatus('path edited');
        },
        onPanResponderMove: event => {
          const point = clampPoint(event.nativeEvent.locationX, event.nativeEvent.locationY, width);
          const last = traceRef.current[traceRef.current.length - 1];
          if (!last || distance(last, point) > 6) {
            traceRef.current = [...traceRef.current, point].slice(-80);
            setTrace(traceRef.current);
          }
        },
      }),
    [width],
  );

  const clearPath = () => {
    traceRef.current = [];
    setTrace([]);
    setArmed(false);
    setPathStatus('draw a path');
  };

  const flyPath = async () => {
    if (!canFlyPath || !pose) {
      return;
    }
    setPathStatus('sending path');
    const sampled = sampleTrace(trace, 14);
    for (const point of sampled) {
      const target = screenToWorld(point, width, VIEW_HEIGHT, pose.z);
      publishNav({
        pos_xy_nav_mode: FLIGHT_NAV.POS_MODE,
        pos_z_nav_mode: FLIGHT_NAV.POS_MODE,
        target_pos_x: pose.x + target.x,
        target_pos_y: pose.y + target.y,
        target_pos_z: target.z,
      });
      await wait(PATH_SEND_INTERVAL_MS);
    }
    setArmed(false);
    setPathStatus(`sent ${sampled.length} waypoints`);
  };

  return (
    <Screen>
      <View style={styles.header}>
        <ConnectionSignal state={connected ? 'connected' : 'closed'} showLabel={false} size={14} />
        <Text style={styles.title}>Live</Text>
      </View>
      <View style={styles.pills}>
        <StatusPill
          label="Flight"
          value={flightState ? `${flightState.label} (${flightState.code})` : 'unknown'}
          tone={flightState?.tone || 'warn'}
        />
        <StatusPill
          label="Battery"
          value={battery?.percentage == null ? '--' : `${battery.percentage.toFixed(0)}%`}
          tone={(battery?.percentage ?? 100) < 25 ? 'bad' : 'ok'}
        />
        <StatusPill
          label="Error"
          value={modelError?.maxAbs == null ? '--' : modelError.maxAbs.toFixed(3)}
          tone={(modelError?.maxAbs ?? 0) > 0.2 ? 'warn' : 'ok'}
        />
      </View>

      <Card title="3D live view" subtitle={pose ? formatPose(pose) : 'waiting for odometry'}>
        <View
          style={styles.viewer}
          onLayout={event => setWidth(Math.max(260, event.nativeEvent.layout.width))}
          {...panResponder.panHandlers}>
          <Svg width="100%" height={VIEW_HEIGHT} viewBox={`0 0 ${width} ${VIEW_HEIGHT}`}>
            <Rect x={0} y={0} width={width} height={VIEW_HEIGHT} rx={8} fill="#101820" />
            {gridLines(width, VIEW_HEIGHT).map((line, index) => (
              <Line key={index} {...line} stroke="#2f3b46" strokeWidth={1} />
            ))}
            <Path d={`M${width / 2} 32 L${width / 2} ${VIEW_HEIGHT - 24}`} stroke="#34495a" strokeWidth={1} />
            {trace.length > 1 ? (
              <Polyline points={tracePoints} fill="none" stroke={colors.warn} strokeWidth={3} strokeLinecap="round" />
            ) : null}
            <Circle cx={projectedPose.x} cy={projectedPose.y} r={12} fill={colors.accent} />
            <Line
              x1={projectedPose.x}
              y1={projectedPose.y}
              x2={projectedPose.x + 22}
              y2={projectedPose.y - 10}
              stroke="#ffffff"
              strokeWidth={3}
              strokeLinecap="round"
            />
            {trace.map((point, index) => (
              <Circle key={`${point.x}-${point.y}-${index}`} cx={point.x} cy={point.y} r={2.5} fill="#f6ad55" />
            ))}
          </Svg>
        </View>
        <View style={styles.row}>
          <ActionButton
            label={armed ? 'Path Armed' : 'Arm Path'}
            tone={armed ? 'danger' : 'secondary'}
            disabled={!connected || flightState?.code !== 5 || trace.length < 2}
            onPress={() => setArmed(value => !value)}
            style={styles.flex}
          />
          <ActionButton label="Fly Path" disabled={!canFlyPath} onPress={flyPath} style={styles.flex} />
          <ActionButton label="Clear" tone="secondary" onPress={clearPath} />
        </View>
        <Text style={styles.status}>{pathStatus}</Text>
        <Text style={styles.status}>
          error rms T {formatNumber(modelError?.translationRms, 'm')} / R{' '}
          {formatNumber(modelError?.rotationRms, 'rad')} / max {formatNumber(modelError?.maxAbs, '')}
        </Text>
      </Card>

      <Card title="Camera" subtitle={camera?.status || 'waiting'}>
        {camera?.uri ? (
          <Image source={{uri: camera.uri}} resizeMode="contain" style={styles.camera} />
        ) : (
          <View style={[styles.camera, styles.cameraEmpty]}>
            <Text style={styles.emptyText}>No compressed image frame</Text>
          </View>
        )}
        {camera?.stamp ? <Text style={styles.status}>stamp {camera.stamp}</Text> : null}
      </Card>

    </Screen>
  );
}

function projectPoint(point: TracePoint, width: number, height: number): TracePoint {
  return {x: width / 2 + point.x, y: height * 0.55 + point.y};
}

function screenToWorld(point: TracePoint, width: number, height: number, z: number) {
  const scale = 42;
  const dx = (point.x - width / 2) / scale;
  const dy = (height * 0.55 - point.y) / scale;
  return {
    x: (dx + dy) * 0.5,
    y: (dy - dx) * 0.5,
    z,
  };
}

function clampPoint(x: number, y: number, width: number): TracePoint {
  return {
    x: Math.max(8, Math.min(width - 8, x)),
    y: Math.max(8, Math.min(VIEW_HEIGHT - 8, y)),
  };
}

function sampleTrace(points: TracePoint[], maxPoints: number) {
  if (points.length <= maxPoints) {
    return points;
  }
  const step = (points.length - 1) / (maxPoints - 1);
  return Array.from({length: maxPoints}, (_, index) => points[Math.round(index * step)]);
}

function gridLines(width: number, height: number) {
  const lines = [];
  for (let offset = -width; offset <= width; offset += 40) {
    lines.push({x1: offset, y1: height * 0.72, x2: offset + width, y2: height * 0.28});
    lines.push({x1: offset, y1: height * 0.28, x2: offset + width, y2: height * 0.72});
  }
  return lines;
}

function distance(a: TracePoint, b: TracePoint) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function wait(ms: number) {
  return new Promise<void>(resolve => setTimeout(() => resolve(), ms));
}

function formatPose(pose: {x: number; y: number; z: number}) {
  return `x ${pose.x.toFixed(2)}  y ${pose.y.toFixed(2)}  z ${pose.z.toFixed(2)}`;
}

function formatNumber(value: number | undefined, unit: string) {
  return value == null ? '--' : `${value.toFixed(3)}${unit ? ` ${unit}` : ''}`;
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    color: colors.ink,
    fontSize: typography.title,
    fontWeight: '800',
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  viewer: {
    overflow: 'hidden',
    borderRadius: radius.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
  status: {
    color: colors.muted,
    fontFamily: typography.mono,
    fontSize: typography.small,
  },
  camera: {
    width: '100%',
    height: 220,
    borderRadius: radius.sm,
    backgroundColor: '#101820',
  },
  cameraEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: colors.muted,
  },
});
