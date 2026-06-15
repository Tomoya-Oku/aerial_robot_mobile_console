import {mapGyroToFlightNav} from '@features/joystick/GyroControls';
import {FLIGHT_NAV} from '@features/joystick/useFlightNavPublisher';

describe('gyro control mapping', () => {
  it('maps gyro values to clamped FlightNav velocity fields', () => {
    expect(
      mapGyroToFlightNav(
        {x: 2, y: -2, z: 3},
        {deadZone: 0.05, gain: 0.35, maxVel: 0.4, maxYaw: 0.5},
      ),
    ).toEqual({
      pos_xy_nav_mode: FLIGHT_NAV.VEL_MODE,
      yaw_nav_mode: FLIGHT_NAV.VEL_MODE,
      target_vel_x: 0.4,
      target_vel_y: 0.4,
      target_omega_z: 0.5,
    });
  });

  it('applies a dead zone', () => {
    expect(
      mapGyroToFlightNav(
        {x: 0.01, y: -0.01, z: 0.01},
        {deadZone: 0.05, gain: 0.35, maxVel: 0.4, maxYaw: 0.5},
      ),
    ).toMatchObject({
      target_vel_x: 0,
      target_vel_y: 0,
      target_omega_z: 0,
    });
  });
});
