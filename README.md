# DRACON

**DRACON** は、[JSK aerial robot](https://github.com/jsk-ros-pkg/jsk_aerial_robot) を iPhone から操作・監視する React Native 製の iOS モバイルコンソールです。ROS 1 の robot PC に rosbridge / rosapi 経由で接続し、teleop 操作・ROS graph 管理・コマンド送信・状態監視・リアルタイムプロットを行います。

既存 Web コンソール (`aerial_robot_web`) と `keyboard_command.py` の操作体系をモバイルネイティブ UI として再構成しています。

---

## 機能

アプリは 6 つのタブで構成されます。

| タブ | 内容 |
| --- | --- |
| **Dashboard** | 接続状態・namespace・robot type・pose・flight state・topic/node 数を集約表示 |
| **Joystick** | 仮想ジョイスティック・方向ボタン・gyro 操作・危険操作 (Arm/Takeoff/Land 等) |
| **ROS** | node / topic / service 一覧、topic 詳細・最新メッセージ preview、JSON publish、service call |
| **Plot** | ROS topic の数値系列を PlotJuggler 風にリアルタイム表示 (pause/resume/clear/window 幅) |
| **Console** | コマンド送信・実行ログ・接続エラー・ROS 応答を時系列表示 |
| **Settings** | rosbridge URL・robot namespace・pose topic・速度 step・接続先履歴・危険操作の確認設定 |

### Joystick / Teleop

`keyboard_command.py` 互換の操作を実装しています。

**Teleop command** — `<robot_ns>/teleop_command/<command>` に `std_msgs/Empty` を publish:

| 操作 | key | command topic |
| --- | --- | --- |
| Arm | `r` | `teleop_command/start` |
| Takeoff | `t` | `teleop_command/takeoff` |
| Land | `l` | `teleop_command/land` |
| Force landing | `f` | `teleop_command/force_landing` |
| Halt | `h` | `teleop_command/halt` |
| Task start | `x` | `task_start` |

**Velocity command** — `<robot_ns>/uav/nav` に `aerial_robot_msgs/FlightNav` を publish (`control_frame = WORLD_FRAME`, `target = COG`, 既定 `xy_vel = z_vel = yaw_vel = 0.2`):

| 操作 | key | FlightNav |
| --- | --- | --- |
| Forward / Backward | `w` / `s` | `pos_xy_nav_mode = VEL_MODE`, `target_vel_x = ±xy_vel` |
| Left / Right | `a` / `d` | `pos_xy_nav_mode = VEL_MODE`, `target_vel_y = ±xy_vel` |
| Turn left / right | `q` / `e` | `yaw_nav_mode = VEL_MODE`, `target_omega_z = ±yaw_vel` |
| Up / Down | `[` / `]` | `pos_z_nav_mode = VEL_MODE`, `target_vel_z = ±z_vel` |

ジョイスティック入力にはデッドゾーン・最大速度 clamp・送信周期制限・通信断時の停止処理を実装しています。Arm / Takeoff / Land / Force Landing / Halt は誤操作防止のため確認 / 長押し UI で分離しています。

### Gyro control

`react-native-sensors` の gyroscope から `FlightNav` 速度指令を生成します。roll → `target_vel_y`、pitch → `target_vel_x`、yaw → `target_omega_z`。dead zone / gain / max velocity / publish interval を設定可能で、enable toggle がオンの間だけ publish し、通信断・画面離脱・toggle off で購読を解除します。

---

## アーキテクチャ

```text
src/
  app/            App.tsx, navigation/RootTabs.tsx
  features/
    joystick/     JoystickScreen, TeleopControls, GyroControls, useFlightNavPublisher
    rosGraph/     RosGraphScreen, PublishBox
    plot/         PlotScreen, SeriesPlot
    console/      ConsoleScreen
    dashboard/    DashboardScreen
    settings/     SettingsScreen
  ros/            rosClient, RosContext, rosTypes, topics, messageTemplate
  components/     Screen, Card, ActionButton, StatusPill
  design/         colors, spacing, typography
```

- publish / subscribe / service call は UI から直接呼ばず **`src/ros` のクライアント層に集約**しています。
- ROS graph 更新は rosapi (`/rosapi/nodes`, `/rosapi/topics`, `/rosapi/services`)、topic 詳細は (`/rosapi/topic_type`, `/rosapi/publishers`, `/rosapi/subscribers`)、message template は `/rosapi/message_details` を使用します。
- namespace は空文字と `/name` の双方を正規化して保持します。

---

## 必要環境

- Node.js >= 20
- iOS 開発: macOS + Xcode（CocoaPods, iOS Simulator）
- 接続先: rosbridge_server が動作する ROS 1 robot PC（既定 `ws://localhost:9090`）

## セットアップ

```bash
npm install

# iOS native 依存 (macOS のみ)
cd ios && bundle install && bundle exec pod install && cd ..

# 起動
npm run ios          # iOS Simulator で実行
npm start            # Metro bundler

# 品質チェック
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm test             # jest
```

robot PC へ接続する際は Settings で rosbridge URL を robot PC の LAN IP（`ws://<host>:9090`）に変更してください。

---

## iOS / Xcode Cloud

- Bundle identifier: `dev.oktm.dracon`
- Info.plist には `NSLocalNetworkUsageDescription`（ローカル rosbridge 接続）、`NSMotionUsageDescription`（gyro 操作）を設定済み。`NSAllowsLocalNetworking` 有効により `ws://` のローカル接続が可能です。

[Xcode Cloud](https://developer.apple.com/xcode-cloud/) で自動ビルド / TestFlight 配信を行います。clone 直後の依存解決は [`ios/ci_scripts/ci_post_clone.sh`](ios/ci_scripts/ci_post_clone.sh)（Node 20 + `npm ci` + `pod install`）が担当します。workflow 自体は Xcode / App Store Connect 上で設定します。

## CI

GitHub Actions ([.github/workflows/ci.yml](.github/workflows/ci.yml)) で以下を実行します。

- **js**: typecheck / lint / Jest（ubuntu）
- **ios-pods**: `ios/Podfile` がある場合に macOS ランナーで `pod install` の sanity check

## テスト

`keyboard_command.py` と同等の topic / message が publish されることを単体テスト（[`__tests__/`](__tests__/)）で検証しています。`react-native-sensors` は [`__mocks__/`](__mocks__/) でモックします。

---

## 安全に関する注意

⚠️ 実機・実ロボットで使用する前に、必ず simulation または安全な mock topic で操作を確認してください。危険操作（Arm / Takeoff / Land / Force Landing / Halt）の accidental tap 対策と、通信断時の停止処理が機能することを確認してください。

## 参照

- ロボット群: `jsk_aerial_robot/robots`
- Web コンソール: `jsk_aerial_robot/aerial_robot_web`
- キーボード操作: `aerial_robot_base/scripts/keyboard_command.py`
