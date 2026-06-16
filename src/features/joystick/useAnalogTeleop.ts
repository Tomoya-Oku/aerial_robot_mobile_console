import {useCallback, useEffect, useRef} from 'react';
import {FLIGHT_NAV, useFlightNavPublisher} from './useFlightNavPublisher';

type Options = {
  deadZone?: number;
  interval?: number;
};

/**
 * Drives xy velocity from a normalized stick/ball vector.
 * - Publishes at a fixed rate while active (throttled), not on every move.
 * - Applies a dead zone and clamps to the configured max velocity.
 * - Publishes an explicit zero-velocity stop on release for safety.
 *
 * Pad convention: up = forward (+x), right = -y, matching keyboard_command.py.
 */
export function useAnalogTeleop(xyVel: number, options: Options = {}) {
  const {connected, publishNav} = useFlightNavPublisher();
  const deadZone = options.deadZone ?? 0.12;
  const interval = options.interval ?? 100;
  const vectorRef = useRef({x: 0, y: 0});
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const sendFromVector = useCallback(() => {
    const {x, y} = vectorRef.current;
    const magnitude = Math.hypot(x, y);
    const active = magnitude >= deadZone;
    try {
      publishNav({
        pos_xy_nav_mode: FLIGHT_NAV.VEL_MODE,
        target_vel_x: active ? -y * xyVel : 0,
        target_vel_y: active ? -x * xyVel : 0,
      });
    } catch {
      // Ignore transient publish failures (e.g. mid-disconnect); stop() handles cleanup.
    }
  }, [deadZone, publishNav, xyVel]);

  const setVector = useCallback((x: number, y: number) => {
    vectorRef.current = {x, y};
  }, []);

  const start = useCallback(() => {
    if (timerRef.current || !connected) {
      return;
    }
    sendFromVector();
    timerRef.current = setInterval(sendFromVector, interval);
  }, [connected, interval, sendFromVector]);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = undefined;
    }
    vectorRef.current = {x: 0, y: 0};
    try {
      publishNav({
        pos_xy_nav_mode: FLIGHT_NAV.VEL_MODE,
        target_vel_x: 0,
        target_vel_y: 0,
      });
    } catch {
      // ignore
    }
  }, [publishNav]);

  useEffect(
    () => () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    },
    [],
  );

  return {connected, setVector, start, stop};
}
