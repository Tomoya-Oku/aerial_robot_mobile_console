export type RosConnectionState = 'idle' | 'connecting' | 'connected' | 'closed' | 'error';

export type RosGraph = {
  nodes: string[];
  topics: string[];
  services: string[];
};

export type RosTopicType = {
  topic: string;
  type: string;
};

export type RosNodeDetails = {
  publications: string[];
  subscriptions: string[];
  services: string[];
};

export type RosTopicDetails = {
  type: string;
  publishers: string[];
  subscribers: string[];
};

export type RosMessage = Record<string, unknown>;

export type PlotSample = {
  time: number;
  value: number;
};

export type PlotSeries = {
  key: string;
  topic: string;
  field: string;
  color: string;
  samples: PlotSample[];
  latest?: number;
};
