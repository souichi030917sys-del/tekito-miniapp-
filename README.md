# Word Sprint 100

英単語100語を学べるシンプルな学習サイトです。  
`index.html` をそのまま GitHub Pages に公開できます。

## ローカル確認

```powershell
cd C:\Users\httbs\tekito-miniapp
start index.html
```

## 第三者にも公開する手順（GitHub Pages）

1. リモートを設定

```powershell
git remote add origin https://github.com/souichi030917sys-del/tekito-miniapp-.git
```

2. 変更をコミットしてプッシュ

```powershell
git add .
git commit -m "Create public vocabulary study site"
git push -u origin main
```

3. GitHub で Pages を有効化
- リポジトリの `Settings` -> `Pages`
- `Build and deployment` の `Source` を `Deploy from a branch`
- `Branch` を `main`、`/ (root)` にして保存

4. 公開URL
- 数分後に以下で公開されます:  
`https://souichi030917sys-del.github.io/tekito-miniapp-/`

## 機能

- 英単語の表示
- 日本語訳の入力と答え合わせ
- 答え表示
- 単語順シャッフル
- 正答率の保存（localStorage）
