import {createFlightNav, FLIGHT_NAV} from '@features/joystick/useFlightNavPublisher';

describe('FlightNav payloads', () => {
  it('matches keyboard_command.py defaults', () => {
    expect(createFlightNav({pos_xy_nav_mode: FLIGHT_NAV.VEL_MODE, target_vel_x: 0.2})).toEqual({
      control_frame: FLIGHT_NAV.WORLD_FRAME,
      target: FLIGHT_NAV.COG,
      pos_xy_nav_mode: FLIGHT_NAV.VEL_MODE,
      target_vel_x: 0.2,
    });
  });
});
