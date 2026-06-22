import React, {PropsWithChildren, createContext, useCallback, useContext, useMemo, useRef, useState} from 'react';
import {RosBridgeClient} from './rosClient';
import {RosConnectionState, RosGraph} from './rosTypes';
import {normalizeNs} from './topics';
import {usePersistentState} from '@lib/usePersistentState';
import {pushHistory, STORAGE_KEYS} from '@lib/storage';
import {DEFAULT_JOYSTICK_KIND, JoystickKind} from '@lib/joystick';

type RosContextValue = {
  bridgeUrl: string;
  robotNs: string;
  poseTopic: string;
  flightStateTopic: string;
  batteryTopic: string;
  cameraTopic: string;
  modelErrorTopic: string;
  fullBatteryFlightMinutes: string;
  joystickKind: JoystickKind;
  bridgeUrlHistory: string[];
  robotNsHistory: string[];
  poseTopicHistory: string[];
  state: RosConnectionState;
  error: string;
  graph: RosGraph;
  hydrated: boolean;
  client?: RosBridgeClient;
  setBridgeUrl: (value: string) => void;
  setRobotNs: (value: string) => void;
  setPoseTopic: (value: string) => void;
  setFlightStateTopic: (value: string) => void;
  setBatteryTopic: (value: string) => void;
  setCameraTopic: (value: string) => void;
  setModelErrorTopic: (value: string) => void;
  setFullBatteryFlightMinutes: (value: string) => void;
  setJoystickKind: (value: JoystickKind) => void;
  connect: () => void;
  disconnect: () => void;
  refreshGraph: () => Promise<void>;
};

const defaultGraph: RosGraph = {nodes: [], topics: [], services: []};
const RosContext = createContext<RosContextValue | undefined>(undefined);

export function RosProvider({children}: PropsWithChildren) {
  const [bridgeUrl, setBridgeUrl, bridgeHydrated] = usePersistentState(
    STORAGE_KEYS.bridgeUrl,
    'ws://localhost:9090',
  );
  const [robotNs, setRobotNsState] = usePersistentState(STORAGE_KEYS.robotNs, '/dragon');
  const [poseTopic, setPoseTopic] = usePersistentState(STORAGE_KEYS.poseTopic, '/dragon/ground_truth');
  const [flightStateTopic, setFlightStateTopic] = usePersistentState(
    STORAGE_KEYS.flightStateTopic,
    '/dragon/flight_state',
  );
  const [batteryTopic, setBatteryTopic] = usePersistentState(
    STORAGE_KEYS.batteryTopic,
    '/dragon/uav_power',
  );
  const [cameraTopic, setCameraTopic] = usePersistentState(
    STORAGE_KEYS.cameraTopic,
    '/dragon/camera/image_raw/compressed',
  );
  const [modelErrorTopic, setModelErrorTopic] = usePersistentState(
    STORAGE_KEYS.modelErrorTopic,
    '/dragon/debug/pose/pid',
  );
  const [fullBatteryFlightMinutes, setFullBatteryFlightMinutes] = usePersistentState(
    STORAGE_KEYS.fullBatteryFlightMinutes,
    '12',
  );
  const [joystickKind, setJoystickKind] = usePersistentState<JoystickKind>(
    STORAGE_KEYS.joystickKind,
    DEFAULT_JOYSTICK_KIND,
  );
  const [bridgeUrlHistory, setBridgeUrlHistory] = usePersistentState<string[]>(
    STORAGE_KEYS.bridgeUrlHistory,
    [],
  );
  const [robotNsHistory, setRobotNsHistory] = usePersistentState<string[]>(
    STORAGE_KEYS.robotNsHistory,
    [],
  );
  const [poseTopicHistory, setPoseTopicHistory] = usePersistentState<string[]>(
    STORAGE_KEYS.poseTopicHistory,
    [],
  );

  const [state, setState] = useState<RosConnectionState>('idle');
  const [error, setError] = useState('');
  const [graph, setGraph] = useState<RosGraph>(defaultGraph);
  const clientRef = useRef<RosBridgeClient>();

  const disconnect = useCallback(() => {
    clientRef.current?.close();
    clientRef.current = undefined;
    setState('closed');
  }, []);

  const connect = useCallback(() => {
    setState('connecting');
    setError('');
    clientRef.current?.close();
    const next = new RosBridgeClient(bridgeUrl);
    clientRef.current = next;
    next.connect({
      onOpen: () => {
        setState('connected');
        // Remember inputs that led to a successful connection.
        setBridgeUrlHistory(pushHistory(bridgeUrlHistory, bridgeUrl));
        setRobotNsHistory(pushHistory(robotNsHistory, robotNs));
        setPoseTopicHistory(pushHistory(poseTopicHistory, poseTopic));
      },
      onClose: () => setState(current => (current === 'closed' ? 'closed' : 'closed')),
      onError: message => {
        setError(message);
        setState('error');
      },
    });
  }, [
    bridgeUrl,
    bridgeUrlHistory,
    poseTopic,
    poseTopicHistory,
    robotNs,
    robotNsHistory,
    setBridgeUrlHistory,
    setPoseTopicHistory,
    setRobotNsHistory,
  ]);

  const refreshGraph = useCallback(async () => {
    const client = clientRef.current;
    if (!client) {
      return;
    }
    const [nodes, topics, services] = await Promise.all([
      client.callService<{nodes: string[]}>('/rosapi/nodes', 'rosapi/Nodes'),
      client.callService<{topics: string[]}>('/rosapi/topics', 'rosapi/Topics'),
      client.callService<{services: string[]}>('/rosapi/services', 'rosapi/Services'),
    ]);
    setGraph({
      nodes: nodes.nodes || [],
      topics: topics.topics || [],
      services: services.services || [],
    });
  }, []);

  const setRobotNs = useCallback(
    (value: string) => {
      const ns = normalizeNs(value);
      setRobotNsState(ns);
      setPoseTopic(ns ? `${ns}/ground_truth` : '/ground_truth');
      setFlightStateTopic(ns ? `${ns}/flight_state` : '/flight_state');
      setBatteryTopic(ns ? `${ns}/uav_power` : '/uav_power');
      setCameraTopic(ns ? `${ns}/camera/image_raw/compressed` : '/camera/image_raw/compressed');
      setModelErrorTopic(ns ? `${ns}/debug/pose/pid` : '/debug/pose/pid');
    },
    [
      setBatteryTopic,
      setCameraTopic,
      setFlightStateTopic,
      setModelErrorTopic,
      setPoseTopic,
      setRobotNsState,
    ],
  );

  const value = useMemo<RosContextValue>(
    () => ({
      bridgeUrl,
      robotNs,
      poseTopic,
      flightStateTopic,
      batteryTopic,
      cameraTopic,
      modelErrorTopic,
      fullBatteryFlightMinutes,
      joystickKind,
      bridgeUrlHistory,
      robotNsHistory,
      poseTopicHistory,
      state,
      error,
      graph,
      hydrated: bridgeHydrated,
      client: clientRef.current,
      setBridgeUrl,
      setRobotNs,
      setPoseTopic,
      setFlightStateTopic,
      setBatteryTopic,
      setCameraTopic,
      setModelErrorTopic,
      setFullBatteryFlightMinutes,
      setJoystickKind,
      connect,
      disconnect,
      refreshGraph,
    }),
    [
      batteryTopic,
      bridgeUrl,
      bridgeHydrated,
      bridgeUrlHistory,
      cameraTopic,
      connect,
      disconnect,
      error,
      flightStateTopic,
      fullBatteryFlightMinutes,
      graph,
      joystickKind,
      modelErrorTopic,
      poseTopic,
      poseTopicHistory,
      refreshGraph,
      robotNs,
      robotNsHistory,
      setBridgeUrl,
      setBatteryTopic,
      setCameraTopic,
      setFlightStateTopic,
      setFullBatteryFlightMinutes,
      setJoystickKind,
      setModelErrorTopic,
      setPoseTopic,
      setRobotNs,
      state,
    ],
  );

  return <RosContext.Provider value={value}>{children}</RosContext.Provider>;
}

export function useRos() {
  const value = useContext(RosContext);
  if (!value) {
    throw new Error('useRos must be used inside RosProvider');
  }
  return value;
}
