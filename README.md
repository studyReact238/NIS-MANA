
# にすまな - Learning Knowledge Base (完全無料版)

AI機能を無効化し、クレジットカード登録不要の **Firebase Hosting (Sparkプラン)** で完全に無料で運用するためのガイドです。

## 🚀 無料で公開・デプロイする具体的手順

### 1. 正しいディレクトリに移動
ターミナル（画面下の「Terminal」タブ）を開き、以下のコマンドを必ず最初に実行してください：
```bash
cd /home/user/app
```
その後、以下のコマンドで `package.json` が見えることを確認します：
```bash
ls
```

### 2. Firebase CLI のインストール
ターミナルで以下を実行します。
```bash
npm install -g firebase-tools
```

### 3. ログイン
Google アカウントでログインします。
```bash
firebase login --no-localhost
```

### 4. プロジェクトの初期化
ルートディレクトリで実行します。
```bash
firebase init hosting
```
**対話形式での回答例:**
*   `Project Setup`: **Use an existing project** を選択し、自分のプロジェクトを選ぶ
*   `What do you want to use as your public directory?`: **out** （⚠️重要：デフォルトの `public` ではなく `out` と入力）
*   `Configure as a single-page app?`: **Yes**
*   `File out/index.html already exists. Overwrite?`: **No**

### 5. ビルドの実行
Next.js を静的ファイルに変換します。
```bash
npm run build
```
※ここでエラーが出る場合は、必ず `cd /home/user/app` を実行したか確認してください。

### 6. デプロイ（公開）
```bash
firebase deploy
```

---
&copy; 2024 にすまな
