# Word Sprint 1000

大学受験向け英単語を学習するWebアプリです。  
現在の収録は **1000語**（動詞300 / 名詞400 / 形容詞・副詞300）。

## 主な機能

- 英単語の出題
- 日本語訳の入力と答え合わせ
- 複数の意味表示
- 解説ボタンで以下を表示
  - 品詞
  - 複数意味
  - 用法メモ
  - 例文（EN/JA）
- 正答率の保存（localStorage）

## データ生成

語彙データは `Oxford 5000` を元に抽出し、日本語訳は `ejdict` を参照して生成しています。

```powershell
cd C:\Users\httbs\tekito-miniapp
npm.cmd install
npm.cmd run generate
```

生成先:
- `data/vocab1000.js`

## ローカル確認

```powershell
cd C:\Users\httbs\tekito-miniapp
start index.html
```

## 公開URL

GitHub Pages:
- `https://souichi030917sys-del.github.io/tekito-miniapp-/`
