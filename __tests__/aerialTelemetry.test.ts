import {
  parseBatteryTelemetry,
  parseCameraFrame,
  estimateTopicType,
  parseFlightState,
  parseModelError,
  parsePose,
} from '@ros/aerialTelemetry';

describe('aerial telemetry parsers', () => {
  it('labels JSK aerial robot flight states', () => {
    expect(parseFlightState({data: 5})).toEqual({code: 5, label: 'HOVER', tone: 'ok'});
    expect(parseFlightState({data: 16})).toEqual({code: 16, label: 'LOW_BATTERY', tone: 'bad'});
    expect(parseFlightState({data: 17})).toEqual({code: 17, label: 'FORCE_LANDING', tone: 'bad'});
    expect(parseFlightState({data: 9})).toEqual({code: 9, label: 'STATE_9', tone: 'warn'});
  });

  it('estimates remaining flight minutes from battery percentage', () => {
    expect(parseBatteryTelemetry({voltage: 22.4, percentage_voltage: 50}, 12)).toEqual({
      voltage: 22.4,
      percentage: 50,
      remainingMinutes: 6,
    });
    expect(parseBatteryTelemetry({vector: {x: 22.4, y: 40}}, 10)).toEqual({
      voltage: 22.4,
      percentage: 40,
      remainingMinutes: 4,
    });
  });

  it('matches verified JSK aerial robot telemetry topic types', () => {
    expect(estimateTopicType('/dragon/flight_state')).toBe('std_msgs/UInt8');
    expect(estimateTopicType('/dragon/uav_power')).toBe('geometry_msgs/Vector3Stamped');
    expect(estimateTopicType('/dragon/battery_voltage_status')).toBe('std_msgs/Float32');
    expect(estimateTopicType('/dragon/debug/pose/pid')).toBe('aerial_robot_msgs/PoseControlPid');
  });

  it('parses odometry-like pose messages', () => {
    expect(parsePose({pose: {pose: {position: {x: 1, y: 2, z: 3}}}})).toEqual({x: 1, y: 2, z: 3});
  });

  it('summarizes PoseControlPid model error fields', () => {
    const result = parseModelError({
      x: {err_p: 0.3},
      y: {err_p: 0.4},
      z: {err_p: 0},
      roll: {err_p: 0.1},
      pitch: {err_p: 0},
      yaw: {err_p: 0},
    });
    expect(result?.translationRms).toBeCloseTo(Math.sqrt((0.09 + 0.16) / 3));
    expect(result?.rotationRms).toBeCloseTo(Math.sqrt(0.01 / 3));
    expect(result?.maxAbs).toBe(0.4);
  });

  it('builds image data URIs for compressed camera frames', () => {
    expect(parseCameraFrame({format: 'jpeg', data: 'abc'}).uri).toBe('data:image/jpeg;base64,abc');
  });
});
