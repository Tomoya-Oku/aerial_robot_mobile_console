import React from 'react';
import Svg, {Circle, Path, Polyline, Rect} from 'react-native-svg';

export type TabIconName =
  | 'dashboard'
  | 'joystick'
  | 'ros'
  | 'plot'
  | 'console'
  | 'settings'
  | 'gyro'
  | 'rosbag';

type Props = {
  name: TabIconName;
  color: string;
  size?: number;
};

// Line-style icons drawn with react-native-svg so no extra icon font dependency is needed.
export function TabIcon({name, color, size = 24}: Props) {
  const stroke = color;
  const sw = 1.8;
  const common = {
    stroke,
    strokeWidth: sw,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'dashboard' && (
        <>
          <Rect x={3} y={3} width={7} height={9} rx={1} {...common} />
          <Rect x={3} y={15} width={7} height={6} rx={1} {...common} />
          <Rect x={14} y={3} width={7} height={6} rx={1} {...common} />
          <Rect x={14} y={12} width={7} height={9} rx={1} {...common} />
        </>
      )}
      {name === 'joystick' && (
        <>
          <Circle cx={12} cy={9} r={5} {...common} />
          <Circle cx={12} cy={9} r={1.6} fill={stroke} stroke="none" />
          <Path d="M7 14 L5 21 H19 L17 14" {...common} />
        </>
      )}
      {name === 'ros' && (
        // ROS logo: 3x3 grid of dots
        <>
          {[5, 12, 19].map(cy =>
            [5, 12, 19].map(cx => (
              <Circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={2} fill={stroke} stroke="none" />
            )),
          )}
        </>
      )}
      {name === 'plot' && (
        <>
          <Polyline points="3,17 9,11 13,14 21,5" {...common} />
          <Path d="M3 3 V21 H21" {...common} />
        </>
      )}
      {name === 'console' && (
        <>
          <Rect x={3} y={4} width={18} height={16} rx={2} {...common} />
          <Polyline points="7,9 10,12 7,15" {...common} />
          <Path d="M13 15 H17" {...common} />
        </>
      )}
      {name === 'settings' && (
        <>
          <Circle cx={12} cy={12} r={3} {...common} />
          <Path
            d="M12 2 v3 M12 19 v3 M2 12 h3 M19 12 h3 M4.9 4.9 l2.1 2.1 M17 17 l2.1 2.1 M19.1 4.9 l-2.1 2.1 M7 17 l-2.1 2.1"
            {...common}
          />
        </>
      )}
      {name === 'gyro' && (
        <>
          <Circle cx={12} cy={12} r={9} {...common} />
          <Path d="M3 12 a9 5 0 0 0 18 0 a9 5 0 0 0 -18 0" {...common} />
          <Path d="M12 3 a5 9 0 0 0 0 18 a5 9 0 0 0 0 -18" {...common} />
        </>
      )}
      {name === 'rosbag' && (
        <>
          <Path d="M4 7 c0 -2 16 -2 16 0 v10 c0 2 -16 2 -16 0 Z" {...common} />
          <Path d="M4 7 c0 2 16 2 16 0" {...common} />
          <Circle cx={12} cy={14} r={2.4} fill={stroke} stroke="none" />
        </>
      )}
    </Svg>
  );
}
