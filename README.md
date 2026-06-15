# DRACON

ROS 1 / rosbridge 経由で aerial robot を操作・監視する React Native iOS アプリです。

## 主な機能

- Joystick: `keyboard_command.py` 相当の teleop command と `FlightNav` 速度指令
- Gyro Control: iPhone の gyroscope から `FlightNav` 速度指令を生成
- ROS Graph: node/topic/service 一覧、topic preview、JSON publish
- Plot: PlotJuggler 風のリアルタイム数値 topic プロット
- Console: 安全な ROS topic/service 操作用コマンド UI
- Settings: rosbridge URL、robot namespace、pose topic の設定

## 開発

```bash
npm install
npm run typecheck
npm test
npm run lint
npm run ios
```

rosbridge の既定 URL は `ws://localhost:9090` です。実機では robot PC の LAN IP に変更してください。

## CI

GitHub Actions は typecheck、lint、Jest を実行します。`ios/Podfile` が存在する場合だけ CocoaPods の dependency sanity check も実行します。
