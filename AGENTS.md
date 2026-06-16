# AGENTS.md

このリポジトリは、`/home/oku/ros/jsk_aerial_robot_ws/src/jsk_aerial_robot/robots` 配下の aerial robot を iOS から操作・監視する React Native アプリ `DRACON` を構築するための作業領域である。実装時は以下の要件を優先する。

## 目的

- React Native で iOS 向けのモバイルコンソールアプリを作る。
- ROS 1 の robot PC に接続し、rosbridge/rosapi 経由でロボット操作、ROS graph 管理、コマンド送信、状態監視を行う。
- 既存 Web 実装 `/home/oku/ros/jsk_aerial_robot_ws/src/jsk_aerial_robot/aerial_robot_web` の機能と操作体系を参考にし、モバイルネイティブ UI として再構成する。
- `Build iOS Apps` プラグインの iOS 開発指針を参考にし、iOS の Safe Area、タブナビゲーション、アクセシビリティ、Simulator 実行検証を前提にする。

## 参照元

- ロボット群: `/home/oku/ros/jsk_aerial_robot_ws/src/jsk_aerial_robot/robots`
- Web コンソール: `/home/oku/ros/jsk_aerial_robot_ws/src/jsk_aerial_robot/aerial_robot_web`
- キーボード操作: `/home/oku/ros/jsk_aerial_robot_ws/src/jsk_aerial_robot/aerial_robot_base/scripts/keyboard_command.py`

`~ros/...` と書かれた要件は、この環境では `/home/oku/ros/...` を参照する。

## 技術スタック

- Framework: React Native
- Language: TypeScript
- iOS project: React Native CLI か Expo Dev Client のどちらかを採用する。ROS WebSocket、iOS ネイティブ設定、将来の Bonjour/QR/ローカルネットワーク権限を扱いやすい構成を優先する。
- Navigation: `@react-navigation/native` と bottom tabs を基本にする。
- ROS connection: rosbridge WebSocket を使う。`roslib` が React Native で問題を起こす場合は、薄い ROS bridge client wrapper を自前で分離し、publish/subscribe/service call の境界を明確にする。
- State: 接続状態、選択ロボット、namespace、topic/node/service 一覧、teleop 設定は feature ごとに分割し、グローバル共有は最小限にする。

## 必須タブ

最低限、以下のタブを用意する。

1. Joystick
   - 仮想ジョイスティック、方向ボタン、緊急操作を配置する。
   - `keyboard_command.py` と同等の操作を実装する。
   - iPhone のジャイロ入力によるドローン操作モードを用意する。
   - Arm、Takeoff、Land、Force Landing、Halt は誤操作を避けるため、危険度に応じて確認 UI または長押し UI を検討する。

2. ROS 管理
   - node/topic/service を一覧表示する。
   - node の publications/subscriptions/services を表示する。
   - topic の type、publishers、subscribers、最新メッセージ preview を表示する。
   - topic publish 用 JSON editor を提供し、`rosapi/message_details` から message template を生成する。
   - service call UI を用意する。

3. Console
   - コマンド送信用ターミナル風 UI を用意する。
   - 送信履歴、実行ログ、接続エラー、ROS 応答を時系列に表示する。
   - robot PC 側で任意 shell 実行が必要な場合は、ROS 側に安全な中継 node/service を置く。アプリから無制限の shell 実行 API を直接叩かない。

4. Plot
   - PlotJuggler のリアルタイムプロットを参考に、ROS topic の数値系列をリアルタイム表示する。
   - 複数 series の選択、pause/resume、clear、表示 window 幅、最新値表示を備える。
   - 最初の実装では `std_msgs/*`, `geometry_msgs/*`, `nav_msgs/Odometry`, `sensor_msgs/Imu` などの JSON payload から数値 leaf field を抽出して時系列化する。

## 追加してよいタブ

- Dashboard: 接続状態、namespace、robot type、pose、battery、flight state、topic/node 数を集約する。
- Model: URDF/odometry/joint_states の簡易ビューア。Web 版の Three.js URDF viewer 相当を React Native で実現できない場合は、まず pose/joint state の数値ビューから始める。
- Rosbag: `/aerial_robot_web/rosbag/{start,stop,status}` 互換の録画操作を実装する。
- Settings: bridge URL、robot namespace、pose topic、速度 step、接続先履歴、危険操作の確認設定を管理する。

## ジョイスティック仕様

`keyboard_command.py` の操作を React Native UI に対応させる。

### Teleop command topics

`<robot_ns>/teleop_command/<command>` に `std_msgs/Empty` を publish する。

| 操作 | keyboard | command topic |
| --- | --- | --- |
| Arm / motor arming | `r` | `<robot_ns>/teleop_command/start` |
| Takeoff | `t` | `<robot_ns>/teleop_command/takeoff` |
| Land | `l` | `<robot_ns>/teleop_command/land` |
| Force landing | `f` | `<robot_ns>/teleop_command/force_landing` |
| Halt / motor stop | `h` | `<robot_ns>/teleop_command/halt` |

`x` は `task_start` に `std_msgs/Empty` を publish する操作として扱う。

### FlightNav velocity commands

`<robot_ns>/uav/nav` に `aerial_robot_msgs/FlightNav` を publish する。

基本値:

- `control_frame = FlightNav.WORLD_FRAME`
- `target = FlightNav.COG`
- `xy_vel = 0.2`
- `z_vel = 0.2`
- `yaw_vel = 0.2`

| 操作 | keyboard | FlightNav fields |
| --- | --- | --- |
| Forward | `w` | `pos_xy_nav_mode = VEL_MODE`, `target_vel_x = +xy_vel` |
| Backward | `s` | `pos_xy_nav_mode = VEL_MODE`, `target_vel_x = -xy_vel` |
| Left | `a` | `pos_xy_nav_mode = VEL_MODE`, `target_vel_y = +xy_vel` |
| Right | `d` | `pos_xy_nav_mode = VEL_MODE`, `target_vel_y = -xy_vel` |
| Turn left | `q` | `yaw_nav_mode = VEL_MODE`, `target_omega_z = +yaw_vel` |
| Turn right | `e` | `yaw_nav_mode = VEL_MODE`, `target_omega_z = -yaw_vel` |
| Up | `[` | `pos_z_nav_mode = VEL_MODE`, `target_vel_z = +z_vel` |
| Down | `]` | `pos_z_nav_mode = VEL_MODE`, `target_vel_z = -z_vel` |

ジョイスティック入力はデッドゾーン、最大速度 clamp、送信周期制限、通信断時の停止処理を必ず設計する。危険操作は通常移動ボタンと視覚的に分ける。

### Gyro control

- `react-native-sensors` の gyroscope を使い、端末の角速度から `FlightNav` 速度指令を生成する。
- roll 相当を `target_vel_y`、pitch 相当を `target_vel_x`、yaw 相当を `target_omega_z` に割り当てる。
- dead zone、gain、max velocity、publish interval を設定可能にする。
- ジャイロ操作は明示的な enable toggle がオンの間だけ publish する。
- 通信断、画面離脱、toggle off のタイミングでセンサー購読を解除する。

## ROS/rosbridge 機能要件

- bridge URL は `ws://<host>:9090` を既定にし、設定画面で変更可能にする。
- namespace は `robot_ns` として保持し、空文字と `/name` の両方を正規化する。
- graph 更新は rosapi の `/rosapi/nodes`, `/rosapi/topics`, `/rosapi/services` を使い、短周期 polling に偏りすぎない。
- topic 詳細は `/rosapi/topic_type`, `/rosapi/publishers`, `/rosapi/subscribers` を使う。
- node 詳細は `/rosapi/node_details` を使う。
- message template は `/rosapi/message_details` から生成する。
- publish/subscribe/service call は UI コンポーネントから直接呼ばず、ROS client service 層に集約する。
- reconnect、timeout、エラー表示、手動再接続を実装する。

## UI/UX 方針

- モバイルファーストで、片手操作時も主要操作に届く配置にする。
- タブ UI は `Joystick`, `ROS`, `Console`, `Dashboard/Settings` などに整理する。
- 操作系は高コントラスト、状態監視は密度高め、危険操作は赤系かつ確認アクション付きにする。
- iOS Safe Area、Dynamic Type、VoiceOver label、44pt 以上のタッチターゲットを守る。
- Dashboard/管理画面は装飾より可読性を優先し、topic 名や JSON が折り返し・スクロールできるようにする。
- アプリ内に長い説明文を置かず、操作に必要なラベル、状態、エラーだけを表示する。

## 初期ファイル構成案

実装を始める場合は、少なくとも以下の分割を目指す。

```text
src/
  app/
    App.tsx
    navigation/
      RootTabs.tsx
  features/
    joystick/
      JoystickScreen.tsx
      TeleopControls.tsx
      useFlightNavPublisher.ts
    rosGraph/
      RosGraphScreen.tsx
      NodeList.tsx
      TopicList.tsx
      TopicDetails.tsx
      PublishBox.tsx
    console/
      ConsoleScreen.tsx
      CommandInput.tsx
      ConsoleLog.tsx
    plot/
      PlotScreen.tsx
      SeriesPlot.tsx
    dashboard/
      DashboardScreen.tsx
    settings/
      SettingsScreen.tsx
  ros/
    rosClient.ts
    rosTypes.ts
    topics.ts
    messageTemplate.ts
  design/
    colors.ts
    spacing.ts
    typography.ts
```

## 検証

- iOS Simulator で起動確認する。
- GitHub Actions で typecheck、lint、test を実行する。
- rosbridge 未接続、接続中、接続済み、切断、再接続失敗の状態を確認する。
- `keyboard_command.py` と同じ topic/message が publish されることを単体テストまたは mock rosbridge で確認する。
- 実機接続前に危険操作の accidental tap 対策を確認する。
- 実機・実ロボットで試す前に simulation または安全な mock topic で操作確認する。

## 20260616修正点
- ✅ 画面が全体サイズギリギリなので，ノッチ部分を考えて調整
- ✅ タブアイコンをそれぞれ設定する．ROSはROSのロゴ，Settingsは歯車アイコンなど．
- ✅ 入力可能部分は入力履歴を保存し，次回以降入力しやすくする．
- ✅ 初回起動時にBridge URLを尋ねてデフォルト値にする．キャンセルの場合はws://localhost:9090
- ✅ Dashboardの左にリアルタイムで接続状況を表す信号（赤: 接続できていない，緑: 接続済み）を表示
- ✅ Connectボタンを押して接続成功したときにポップアップで「〜に接続成功した」旨を表示
- Joystickタブ
  - スクロールできないように．１画面に要素を集約する
  - Bridge, namespaceを削除
  - 上下左右の操作は右手親指で操作しやすいように，右側にコントロールを置く
  - yaw+, yaw-, up, downを左側に置く
  - arm, takeoff, land, f.land, haltは真ん中に置く
  - ジョイスティックはボタン長押しでも効くようにする
  - ジョイスティックの種類としてSettingsタブでボール式（スマホ版ドラクエなど）やVirtual Stickと切り替えられるようにする．
  - Virtual Stickを実装
  - Gyro Controlは別タブに移行する
- Gyro Controlタブ
  - 傾き加減が分かりやすいような表示（ビジュアル）をする
- Settingsタブ
  - ✅ Bridge URLに対し，アプリを閉じても前回内容を保存する．また，接続履歴を保存し，選択できるようにする．
  - ✅ robot namespace, pose topicについても前回内容を保存する．また，接続履歴を保存し，選択できるようにする．
  - ✅ ジョイスティックの種類を切り替えられるようにする．これも前回内容を保存する．
  - ✅ 自分の署名を追加（Tomoya Oku）
  - ✅ GithubリポジトリURLを追加: https://github.com/Tomoya-Oku/aerial_robot_mobile_console
- Consoleタブ
  - ターミナルのようなUIに変更
  - コマンド送信履歴を保存
  - Plotタブの左に配置
- RosBagタブ
  - ROSBAGのレコード開始ボタン
  - ROSBAGの記録トピック選択