import {useCallback} from 'react';
import {useRos} from '@ros/RosContext';
import {nsJoin} from '@ros/topics';

export const FLIGHT_NAV = {
  NO_NAVIGATION: 0,
  VEL_MODE: 1,
  POS_MODE: 2,
  ACC_MODE: 3,
  POS_VEL_MODE: 4,
  GPS_WAYPOINT_MODE: 5,
  WORLD_FRAME: 0,
  COG: 1,
} as const;

export function createFlightNav(fields: Record<string, number>) {
  return {
    control_frame: FLIGHT_NAV.WORLD_FRAME,
    target: FLIGHT_NAV.COG,
    ...fields,
  };
}

export function useFlightNavPublisher() {
  const {client, robotNs, state} = useRos();
  const connected = state === 'connected';

  const publishTeleop = useCallback(
    (command: string) => {
      if (!client || !connected) {
        throw new Error('ROS bridge is not connected');
      }
      client.publish(nsJoin(robotNs, `teleop_command/${command}`), 'std_msgs/Empty', {});
    },
    [client, connected, robotNs],
  );

  const publishTaskStart = useCallback(() => {
    if (!client || !connected) {
      throw new Error('ROS bridge is not connected');
    }
    client.publish('/task_start', 'std_msgs/Empty', {});
  }, [client, connected]);

  const publishNav = useCallback(
    (fields: Record<string, number>) => {
      if (!client || !connected) {
        throw new Error('ROS bridge is not connected');
      }
      client.publish(nsJoin(robotNs, 'uav/nav'), 'aerial_robot_msgs/FlightNav', createFlightNav(fields));
    },
    [client, connected, robotNs],
  );

  return {connected, publishTeleop, publishTaskStart, publishNav};
}
