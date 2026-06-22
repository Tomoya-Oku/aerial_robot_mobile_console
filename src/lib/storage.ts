import AsyncStorage from '@react-native-async-storage/async-storage';

// Persisted keys live in one place so they are easy to audit and migrate.
export const STORAGE_KEYS = {
  bridgeUrl: 'dracon.bridgeUrl',
  robotNs: 'dracon.robotNs',
  poseTopic: 'dracon.poseTopic',
  flightStateTopic: 'dracon.flightStateTopic',
  batteryTopic: 'dracon.batteryTopic',
  cameraTopic: 'dracon.cameraTopic',
  modelErrorTopic: 'dracon.modelErrorTopic',
  fullBatteryFlightMinutes: 'dracon.fullBatteryFlightMinutes',
  joystickKind: 'dracon.joystickKind',
  bridgeUrlHistory: 'dracon.history.bridgeUrl',
  robotNsHistory: 'dracon.history.robotNs',
  poseTopicHistory: 'dracon.history.poseTopic',
  consoleHistory: 'dracon.history.console',
  bridgePrompted: 'dracon.bridgePrompted',
} as const;

export async function getJSON<T>(key: string): Promise<T | undefined> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw == null ? undefined : (JSON.parse(raw) as T);
  } catch {
    return undefined;
  }
}

export async function setJSON(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage failures must never crash the UI; persistence is best-effort.
  }
}

export async function removeKey(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // ignore
  }
}

// Most-recent-first, de-duplicated, capped input history for text fields.
export function pushHistory(list: string[], value: string, max = 10): string[] {
  const next = value.trim();
  if (!next) {
    return list;
  }
  return [next, ...list.filter(item => item !== next)].slice(0, max);
}
