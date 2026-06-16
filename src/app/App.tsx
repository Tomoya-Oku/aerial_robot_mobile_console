import 'react-native-gesture-handler';
import React, {PropsWithChildren} from 'react';
import {StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {RosProvider} from '@ros/RosContext';
import {useFirstLaunchBridgePrompt} from '@features/settings/useBridgePrompt';
import {useConnectToast} from '@features/dashboard/useConnectToast';
import {RootTabs} from './navigation/RootTabs';
import {colors} from '@design/colors';

// Runs app-wide side effects that need RosContext, then renders the app.
function AppGate({children}: PropsWithChildren) {
  useFirstLaunchBridgePrompt();
  useConnectToast();
  return <>{children}</>;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <RosProvider>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <AppGate>
          <RootTabs />
        </AppGate>
      </RosProvider>
    </SafeAreaProvider>
  );
}
