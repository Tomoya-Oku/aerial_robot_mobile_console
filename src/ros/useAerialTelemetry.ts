import {useEffect, useMemo, useState} from 'react';
import {
  BatteryTelemetry,
  CameraFrame,
  FlightStateInfo,
  ModelErrorTelemetry,
  Pose3,
  estimateTopicType,
  parseBatteryTelemetry,
  parseCameraFrame,
  parseFlightState,
  parseModelError,
  parsePose,
} from './aerialTelemetry';
import {useRos} from './RosContext';

export type AerialTelemetry = {
  flightState?: FlightStateInfo;
  battery?: BatteryTelemetry;
  pose?: Pose3;
  modelError?: ModelErrorTelemetry;
  camera?: CameraFrame;
};

export function useAerialTelemetry({includeCamera = false}: {includeCamera?: boolean} = {}): AerialTelemetry {
  const {
    client,
    state,
    poseTopic,
    flightStateTopic,
    batteryTopic,
    cameraTopic,
    modelErrorTopic,
    fullBatteryFlightMinutes,
  } = useRos();
  const connected = state === 'connected';
  const [flightState, setFlightState] = useState<FlightStateInfo>();
  const [battery, setBattery] = useState<BatteryTelemetry>();
  const [pose, setPose] = useState<Pose3>();
  const [modelError, setModelError] = useState<ModelErrorTelemetry>();
  const [camera, setCamera] = useState<CameraFrame>({status: 'camera disabled'});

  const batteryMinutes = useMemo(() => Number(fullBatteryFlightMinutes) || 0, [fullBatteryFlightMinutes]);

  useEffect(() => {
    if (!client || !connected) {
      return undefined;
    }
    const unsubscribers = [
      client.subscribe(flightStateTopic, estimateTopicType(flightStateTopic), message => {
        const next = parseFlightState(message);
        if (next) {
          setFlightState(next);
        }
      }, 200),
      client.subscribe(batteryTopic, estimateTopicType(batteryTopic), message => {
        setBattery(parseBatteryTelemetry(message, batteryMinutes));
      }, 1000),
      client.subscribe(poseTopic, estimateTopicType(poseTopic), message => {
        const next = parsePose(message);
        if (next) {
          setPose(next);
        }
      }, 100),
      client.subscribe(modelErrorTopic, estimateTopicType(modelErrorTopic), message => {
        const next = parseModelError(message, modelErrorTopic);
        if (next) {
          setModelError(next);
        }
      }, 250),
    ];

    if (includeCamera) {
      setCamera({status: 'waiting for frame'});
      unsubscribers.push(
        client.subscribe(cameraTopic, estimateTopicType(cameraTopic), message => {
          setCamera(parseCameraFrame(message));
        }, 250),
      );
    }

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [
    batteryMinutes,
    batteryTopic,
    cameraTopic,
    client,
    connected,
    flightStateTopic,
    includeCamera,
    modelErrorTopic,
    poseTopic,
  ]);

  return {flightState, battery, pose, modelError, camera};
}
