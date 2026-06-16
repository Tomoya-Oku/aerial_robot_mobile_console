import {useEffect, useRef} from 'react';
import {Alert, Platform} from 'react-native';
import {getJSON, setJSON, STORAGE_KEYS} from '@lib/storage';
import {useRos} from '@ros/RosContext';

const DEFAULT_BRIDGE_URL = 'ws://localhost:9090';

/**
 * On the very first launch, ask for the Bridge URL once.
 * Cancelling keeps the default ws://localhost:9090. Runs only after storage
 * has hydrated so a previously saved URL is not overwritten.
 */
export function useFirstLaunchBridgePrompt() {
  const {hydrated, bridgeUrl, setBridgeUrl} = useRos();
  const askedRef = useRef(false);

  useEffect(() => {
    if (!hydrated || askedRef.current) {
      return;
    }
    askedRef.current = true;

    getJSON<boolean>(STORAGE_KEYS.bridgePrompted).then(alreadyPrompted => {
      if (alreadyPrompted) {
        return;
      }
      const finish = (value: string) => {
        const next = value.trim() || DEFAULT_BRIDGE_URL;
        setBridgeUrl(next);
        setJSON(STORAGE_KEYS.bridgePrompted, true);
      };

      if (Platform.OS === 'ios') {
        Alert.prompt(
          'Bridge URL',
          'rosbridge の接続先を入力してください。\nキャンセルすると ws://localhost:9090 を使用します。',
          [
            {text: 'キャンセル', style: 'cancel', onPress: () => finish(DEFAULT_BRIDGE_URL)},
            {text: 'OK', onPress: value => finish(value ?? DEFAULT_BRIDGE_URL)},
          ],
          'plain-text',
          bridgeUrl || DEFAULT_BRIDGE_URL,
          'url',
        );
      } else {
        // Alert.prompt is iOS-only; fall back to the persisted/default value.
        finish(bridgeUrl || DEFAULT_BRIDGE_URL);
      }
    });
  }, [hydrated, bridgeUrl, setBridgeUrl]);
}
