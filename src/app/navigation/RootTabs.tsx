import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Text} from 'react-native';
import {DashboardScreen} from '@features/dashboard/DashboardScreen';
import {JoystickScreen} from '@features/joystick/JoystickScreen';
import {RosGraphScreen} from '@features/rosGraph/RosGraphScreen';
import {ConsoleScreen} from '@features/console/ConsoleScreen';
import {PlotScreen} from '@features/plot/PlotScreen';
import {SettingsScreen} from '@features/settings/SettingsScreen';
import {colors} from '@design/colors';

export type RootTabParamList = {
  Dashboard: undefined;
  Joystick: undefined;
  ROS: undefined;
  Plot: undefined;
  Console: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const icons: Record<keyof RootTabParamList, string> = {
  Dashboard: 'D',
  Joystick: 'J',
  ROS: 'R',
  Plot: 'P',
  Console: 'C',
  Settings: 'S',
};

export function RootTabs() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({route}) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.muted,
          tabBarStyle: {
            borderTopColor: colors.line,
            backgroundColor: colors.surface,
          },
          tabBarIcon: ({color}) => (
            <Text style={{color, fontWeight: '800'}}>{icons[route.name]}</Text>
          ),
        })}>
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="Joystick" component={JoystickScreen} />
        <Tab.Screen name="ROS" component={RosGraphScreen} />
        <Tab.Screen name="Plot" component={PlotScreen} />
        <Tab.Screen name="Console" component={ConsoleScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
