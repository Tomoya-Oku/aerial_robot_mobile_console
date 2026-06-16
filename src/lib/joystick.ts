// Joystick input style, selectable in Settings and persisted across launches.
export type JoystickKind = 'buttons' | 'ball' | 'virtual';

export const JOYSTICK_KINDS: {value: JoystickKind; label: string; hint: string}[] = [
  {value: 'buttons', label: 'ボタン式', hint: '方向ボタンで離散指令'},
  {value: 'ball', label: 'ボール式', hint: 'スマホ版ドラクエ風の追従パッド'},
  {value: 'virtual', label: 'Virtual Stick', hint: 'アナログスティック'},
];

export const DEFAULT_JOYSTICK_KIND: JoystickKind = 'buttons';
