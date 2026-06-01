# naminote

勉強特化のページ制ノートソフト（Windows 11）

> **This software was created with the assistance of AI (Claude by Anthropic).**

## 特徴

- ページが満杯になると自動で次のページへ移動
- フォントサイズ調整（A＋ / A－、10〜36pt）
- ページナビゲーション（前後移動、ページ追加）
- ノートの保存・履歴管理
- 罫線付きのシンプルなノート UI

## ダウンロード

[Releases](../../releases) からインストーラー版またはポータブル版をダウンロードしてください。

| ファイル | 説明 |
|---------|------|
| `naminote Setup x.x.x.exe` | インストーラー版 |
| `naminote-portable.exe` | インストール不要のポータブル版 |

## 開発環境でのセットアップ

```bash
npm install
```

### 起動

`start.bat` をダブルクリック、または：

```bash
# ELECTRON_RUN_AS_NODE を必ずクリアしてから起動
SET ELECTRON_RUN_AS_NODE=
npx electron .
```

### ビルド

`build.bat` を管理者として実行（またはダブルクリックで自動昇格）

出力先: `C:\naminote_dist`

## ライセンス

Public Domain — [The Unlicense](LICENSE)  
自由に改変・再配布・商用利用できます。
