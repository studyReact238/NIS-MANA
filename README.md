# にすまな - Learning Knowledge Base

AI機能を無効化し、クレジットカード登録不要の **Firebase Hosting (Sparkプラン)** で完全に無料で運用するためのガイドです。

## 🚀 無料で公開・デプロイする具体的手順

この手順を完了すると、あなたのアプリが `https://<プロジェクトID>.web.app` で世界中に公開されます。

### 1. アプリのルートディレクトリを確認
この環境におけるルートディレクトリの絶対パスは以下です：
**`/home/user/app`**

ターミナル（画面下の「Terminal」タブ）を開き、以下のコマンドを打つことで現在地を確認できます：
```bash
pwd
```
`/home/user/app` と表示されれば、そこがルートディレクトリです。`ls` コマンドで `package.json` が見えることを確認してください。

### 2. Firebase CLI のインストール
ターミナルで以下を実行します（まだの場合）。
```bash
npm install -g firebase-tools
```

### 3. ログイン
Google アカウントでログインします。
```bash
firebase login --no-localhost
```
※ブラウザが開けない環境の場合は、表示されるURLをコピーして手元のブラウザで開き、認証コードを貼り付けてください。

### 4. プロジェクトの初期化
ルートディレクトリ（`/home/user/app`）で実行します。
```bash
firebase init hosting
```
**対話形式での回答例:**
*   `Are you ready to proceed?`: **Yes**
*   `Project Setup`: **Use an existing project** を選択し、自分のプロジェクトを選ぶ
*   `What do you want to use as your public directory?`: **out** （⚠️重要：デフォルトの `public` ではなく `out` と入力してください）
*   `Configure as a single-page app?`: **Yes**
*   `Set up automatic builds and deploys with GitHub?`: **No**
*   `File out/index.html already exists. Overwrite?`: **No**

### 5. ビルドの実行
Next.js を静的ファイル（HTML/JS/CSS）に変換します。
```bash
npm run build
```

### 6. デプロイ（公開）
生成された `out` フォルダの内容を Firebase にアップロードします。
```bash
firebase deploy
```

---

## 💡 運用のポイント（完全無料を維持するために）

*   **クレジットカードは不要**: `firebase init hosting` で標準の Hosting を選んでいる限り、Sparkプラン（無料）のまま公開できます。
*   **Firestore の制限**: 読み取り 50,000回/日、書き込み 20,000回/日 までは無料です。
*   **再デプロイ**: リンクを追加したり、コードを変更したりした後は、再度 **手順 5 と 6** を実行するだけで更新が反映されます。

---
&copy; 2024 にすまな
