import 'react-native-gesture-handler';
import React from 'react';
import {StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {RosProvider} from '@ros/RosContext';
import {RootTabs} from './navigation/RootTabs';
import {colors} from '@design/colors';

export default function App() {
  return (
    <SafeAreaProvider>
      <RosProvider>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <RootTabs />
      </RosProvider>
    </SafeAreaProvider>
  );
}
