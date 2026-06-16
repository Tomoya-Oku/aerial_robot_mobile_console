import {useEffect, useRef} from 'react';
import {Alert} from 'react-native';
import {useRos} from '@ros/RosContext';

/**
 * Shows a popup when a connection attempt succeeds (any state -> connected).
 * Tracks the previous state so it fires once per successful connect.
 */
export function useConnectToast() {
  const {state, bridgeUrl} = useRos();
  const prevRef = useRef(state);

  useEffect(() => {
    if (state === 'connected' && prevRef.current !== 'connected') {
      Alert.alert('接続成功', `${bridgeUrl} に接続成功しました`);
    }
    prevRef.current = state;
  }, [state, bridgeUrl]);
}
