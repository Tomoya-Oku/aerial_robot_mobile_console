export type FlightStateInfo = {
  code: number;
  label: string;
  tone: 'ok' | 'warn' | 'bad';
};

export type BatteryTelemetry = {
  voltage?: number;
  percentage?: number;
  remainingMinutes?: number;
};

export type Pose3 = {
  x: number;
  y: number;
  z: number;
};

export type ModelErrorTelemetry = {
  translationRms?: number;
  rotationRms?: number;
  maxAbs?: number;
  source: string;
};

export type CameraFrame = {
  uri?: string;
  stamp?: string;
  status: string;
};

export const FLIGHT_STATES: Record<number, Omit<FlightStateInfo, 'code'>> = {
  0: {label: 'ARM_OFF', tone: 'warn'},
  1: {label: 'START', tone: 'warn'},
  2: {label: 'ARM_ON', tone: 'warn'},
  3: {label: 'TAKEOFF', tone: 'warn'},
  4: {label: 'LAND', tone: 'warn'},
  5: {label: 'HOVER', tone: 'ok'},
  6: {label: 'STOP', tone: 'bad'},
  16: {label: 'LOW_BATTERY', tone: 'bad'},
  17: {label: 'FORCE_LANDING', tone: 'bad'},
};

export function parseFlightState(message: any): FlightStateInfo | undefined {
  const raw = typeof message?.data === 'number' ? message.data : Number(message?.data);
  if (!Number.isFinite(raw)) {
    return undefined;
  }
  const code = Math.trunc(raw);
  const info = FLIGHT_STATES[code] || {label: `STATE_${code}`, tone: 'warn' as const};
  return {code, ...info};
}

export function parseBatteryTelemetry(message: any, fullBatteryMinutes: number): BatteryTelemetry {
  const voltage = firstFiniteNumber(
    message?.voltage,
    message?.data,
    message?.vector?.x,
    message?.power_supply_voltage,
  );
  const rawPercentage = firstFiniteNumber(
    message?.percentage_voltage,
    message?.percentage,
    message?.percent,
    message?.data_percent,
    message?.vector?.y,
  );
  const percentage =
    rawPercentage == null ? undefined : rawPercentage <= 1 ? rawPercentage * 100 : rawPercentage;
  const remainingMinutes =
    percentage == null || !Number.isFinite(fullBatteryMinutes)
      ? undefined
      : Math.max(0, (percentage / 100) * fullBatteryMinutes);
  return {voltage, percentage, remainingMinutes};
}

export function parsePose(message: any): Pose3 | undefined {
  const position = message?.pose?.pose?.position || message?.pose?.position || message?.position;
  const x = firstFiniteNumber(position?.x);
  const y = firstFiniteNumber(position?.y);
  const z = firstFiniteNumber(position?.z);
  if (x == null || y == null || z == null) {
    return undefined;
  }
  return {x, y, z};
}

export function parseModelError(message: any, source = 'debug/pose/pid'): ModelErrorTelemetry | undefined {
  const translation = ['x', 'y', 'z']
    .map(axis => firstFiniteNumber(message?.[axis]?.err_p, message?.[axis]?.error, message?.[axis]))
    .filter((value): value is number => value != null);
  const rotation = ['roll', 'pitch', 'yaw']
    .map(axis => firstFiniteNumber(message?.[axis]?.err_p, message?.[axis]?.error, message?.[axis]))
    .filter((value): value is number => value != null);

  const flat: number[] = Array.isArray(message?.data)
    ? message.data.map((value: unknown) => Number(value)).filter((value: number) => Number.isFinite(value))
    : [];
  const values = translation.length || rotation.length ? [...translation, ...rotation] : flat;
  if (!values.length) {
    return undefined;
  }

  return {
    translationRms: translation.length ? rms(translation) : flat.length ? rms(flat) : undefined,
    rotationRms: rotation.length ? rms(rotation) : undefined,
    maxAbs: Math.max(...values.map(value => Math.abs(value))),
    source,
  };
}

export function parseCameraFrame(message: any): CameraFrame {
  const format = String(message?.format || 'jpeg').toLowerCase();
  const data = typeof message?.data === 'string' ? message.data : '';
  if (!data) {
    return {status: 'waiting for compressed image'};
  }
  const mime = format.includes('png') ? 'image/png' : 'image/jpeg';
  return {
    uri: data.startsWith('data:') ? data : `data:${mime};base64,${data}`,
    stamp: stampToText(message?.header?.stamp),
    status: format || 'compressed',
  };
}

export function estimateTopicType(topic: string): string {
  if (topic.endsWith('/flight_state')) {
    return 'std_msgs/UInt8';
  }
  if (topic.endsWith('/uav_power')) {
    return 'geometry_msgs/Vector3Stamped';
  }
  if (topic.endsWith('/battery_voltage_status')) {
    return 'std_msgs/Float32';
  }
  if (topic.includes('battery')) {
    return 'aerial_robot_msgs/AerialRobotStatus';
  }
  if (topic.includes('image') || topic.includes('camera')) {
    return 'sensor_msgs/CompressedImage';
  }
  if (topic.includes('debug/pose/pid')) {
    return 'aerial_robot_msgs/PoseControlPid';
  }
  if (topic.includes('shape_control_error')) {
    return 'std_msgs/Float64MultiArray';
  }
  return 'nav_msgs/Odometry';
}

function rms(values: number[]) {
  return Math.sqrt(values.reduce((sum, value) => sum + value * value, 0) / values.length);
}

function firstFiniteNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number)) {
      return number;
    }
  }
  return undefined;
}

function stampToText(stamp: any) {
  const secs = firstFiniteNumber(stamp?.secs, stamp?.sec);
  const nsecs = firstFiniteNumber(stamp?.nsecs, stamp?.nanosec);
  if (secs == null) {
    return undefined;
  }
  return `${secs}.${String(Math.trunc(nsecs || 0)).padStart(9, '0')}`;
}
