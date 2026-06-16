import 'react-native-gesture-handler';
import React, {PropsWithChildren} from 'react';
import {StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {RosProvider} from '@ros/RosContext';
import {useFirstLaunchBridgePrompt} from '@features/settings/useBridgePrompt';
import {RootTabs} from './navigation/RootTabs';
import {colors} from '@design/colors';

// Runs first-launch side effects that need RosContext, then renders the app.
function AppGate({children}: PropsWithChildren) {
  useFirstLaunchBridgePrompt();
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
