import React, {PropsWithChildren, createContext, useCallback, useContext, useMemo, useRef, useState} from 'react';
import {RosBridgeClient} from './rosClient';
import {RosConnectionState, RosGraph} from './rosTypes';
import {normalizeNs} from './topics';

type RosContextValue = {
  bridgeUrl: string;
  robotNs: string;
  poseTopic: string;
  state: RosConnectionState;
  error: string;
  graph: RosGraph;
  client?: RosBridgeClient;
  setBridgeUrl: (value: string) => void;
  setRobotNs: (value: string) => void;
  setPoseTopic: (value: string) => void;
  connect: () => void;
  disconnect: () => void;
  refreshGraph: () => Promise<void>;
};

const defaultGraph: RosGraph = {nodes: [], topics: [], services: []};
const RosContext = createContext<RosContextValue | undefined>(undefined);

export function RosProvider({children}: PropsWithChildren) {
  const [bridgeUrl, setBridgeUrl] = useState('ws://localhost:9090');
  const [robotNs, setRobotNsState] = useState('/dragon');
  const [poseTopic, setPoseTopic] = useState('/dragon/ground_truth');
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
      onOpen: () => setState('connected'),
      onClose: () => setState(current => (current === 'closed' ? 'closed' : 'closed')),
      onError: message => {
        setError(message);
        setState('error');
      },
    });
  }, [bridgeUrl]);

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

  const setRobotNs = useCallback((value: string) => {
    const ns = normalizeNs(value);
    setRobotNsState(ns);
    setPoseTopic(ns ? `${ns}/ground_truth` : '/ground_truth');
  }, []);

  const value = useMemo<RosContextValue>(
    () => ({
      bridgeUrl,
      robotNs,
      poseTopic,
      state,
      error,
      graph,
      client: clientRef.current,
      setBridgeUrl,
      setRobotNs,
      setPoseTopic,
      connect,
      disconnect,
      refreshGraph,
    }),
    [bridgeUrl, connect, disconnect, error, graph, poseTopic, refreshGraph, robotNs, setRobotNs, state],
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
