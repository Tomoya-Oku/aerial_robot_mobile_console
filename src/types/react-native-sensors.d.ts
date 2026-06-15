declare module 'react-native-sensors' {
  export const SensorTypes: {
    gyroscope: string;
  };

  export function setUpdateIntervalForType(type: string, interval: number): void;

  export const gyroscope: {
    subscribe: (next: (value: {x: number; y: number; z: number}) => void) => {
      unsubscribe: () => void;
    };
  };
}
