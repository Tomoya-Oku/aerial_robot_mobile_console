import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {DashboardScreen} from '@features/dashboard/DashboardScreen';
import {JoystickScreen} from '@features/joystick/JoystickScreen';
import {GyroScreen} from '@features/gyro/GyroScreen';
import {LiveViewScreen} from '@features/live/LiveViewScreen';
import {ModelScreen} from '@features/model/ModelScreen';
import {RosGraphScreen} from '@features/rosGraph/RosGraphScreen';
import {ConsoleScreen} from '@features/console/ConsoleScreen';
import {PlotScreen} from '@features/plot/PlotScreen';
import {RosBagScreen} from '@features/rosbag/RosBagScreen';
import {SettingsScreen} from '@features/settings/SettingsScreen';
import {colors} from '@design/colors';
import {TabIcon, TabIconName} from '@components/TabIcon';

export type RootTabParamList = {
  Dashboard: undefined;
  Joystick: undefined;
  Gyro: undefined;
  Live: undefined;
  Model: undefined;
  ROS: undefined;
  Console: undefined;
  Plot: undefined;
  Rosbag: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const icons: Record<keyof RootTabParamList, TabIconName> = {
  Dashboard: 'dashboard',
  Joystick: 'joystick',
  Gyro: 'gyro',
  Live: 'live',
  Model: 'model',
  ROS: 'ros',
  Console: 'console',
  Plot: 'plot',
  Rosbag: 'rosbag',
  Settings: 'settings',
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
          // eslint-disable-next-line react/no-unstable-nested-components
          tabBarIcon: ({color, size}) => (
            <TabIcon name={icons[route.name]} color={color} size={size} />
          ),
        })}>
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="Joystick" component={JoystickScreen} />
        <Tab.Screen name="Gyro" component={GyroScreen} />
        <Tab.Screen name="Live" component={LiveViewScreen} />
        <Tab.Screen name="Model" component={ModelScreen} />
        <Tab.Screen name="ROS" component={RosGraphScreen} />
        <Tab.Screen name="Console" component={ConsoleScreen} />
        <Tab.Screen name="Plot" component={PlotScreen} />
        <Tab.Screen name="Rosbag" component={RosBagScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
