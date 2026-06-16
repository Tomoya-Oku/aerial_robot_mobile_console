import {FLIGHT_NAV} from '@features/joystick/useFlightNavPublisher';

export type GyroVector = {
  x: number;
  y: number;
  z: number;
};

export type GyroOptions = {
  deadZone: number;
  gain: number;
  maxVel: number;
  maxYaw: number;
};

// Maps device angular velocity to FlightNav velocity fields with dead zone and clamp.
export function mapGyroToFlightNav(gyro: GyroVector, options: GyroOptions) {
  const clamp = (value: number, max: number) => {
    if (Math.abs(value) < options.deadZone) {
      return 0;
    }
    return Math.max(-max, Math.min(max, value * options.gain));
  };

  return {
    pos_xy_nav_mode: FLIGHT_NAV.VEL_MODE,
    yaw_nav_mode: FLIGHT_NAV.VEL_MODE,
    target_vel_x: clamp(-gyro.y, options.maxVel),
    target_vel_y: clamp(gyro.x, options.maxVel),
    target_omega_z: clamp(gyro.z, options.maxYaw),
  };
}
