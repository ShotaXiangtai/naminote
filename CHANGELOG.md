# Changelog

## v1.0.0 (2026-06-01)

### Breaking Changes

- **Electron → Tauri 2 へ移行**: バックエンドを Rust で書き直しました。
  - ノートの保存場所が変わります（以前の Electron 版のデータは引き継がれません）
    - 旧: `%APPDATA%\naminote\notes\`
    - 新: `%APPDATA%\com.github.ShotaXiangtai.naminote\notes\`

### New Features

- **文字カウント機能**: ツールバーの「文字数」ボタン（または Ctrl+K）でトグル。全ページの文字出現回数を多い順に表示します
- **タッチスワイプ対応**: エディタ上で左右スワイプしてページを切り替えられます
- **モバイルレスポンシブ**: スマホ・タブレット向けのレイアウト最適化

### Improvements

- アプリサイズの大幅削減（Electron 比）
- 起動速度の向上
- ネイティブパフォーマンス

### Distribution

| プラットフォーム | ファイル | 備考 |
|---|---|---|
| Windows | `.exe` / `.msi` | |
| macOS | `.dmg` | Universal Binary（Apple Silicon + Intel）。未署名のため右クリック→開く |
| Linux | `.AppImage` | |
| Linux | `.flatpak` | |
| Android | `.apk` | Debug ビルド（サイドロード用） |
