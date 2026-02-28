# にすまな - Learning Knowledge Base

AI機能を無効化し、クレジットカード登録不要の **Firebase Hosting (Sparkプラン)** で完全に無料で運用するためのガイドです。

## 🚀 無料で公開・デプロイする具体的手順

この手順を完了すると、あなたのアプリが `https://<プロジェクトID>.web.app` で世界中に公開されます。

### 1. アプリのルートディレクトリを確認
「ルートディレクトリ」とは、この `README.md` や `package.json` ファイルが直接置かれている**一番上のフォルダ**のことです。ターミナル（コマンドプロンプト）でこのフォルダを開いて以下の操作を行います。

### 2. Firebase CLI のインストール
ターミナルを開き、Firebase を操作するためのツールをインストールします（まだの場合）。
```bash
npm install -g firebase-tools
```

### 3. ログイン
Google アカウントでログインします。
```bash
firebase login
```

### 4. プロジェクトの初期化
ルートディレクトリで実行します。
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
Next.js を静的ファイル（HTML/JS/CSS）に変換します。これにより `out` フォルダが自動生成されます。
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
