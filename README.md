# にすまな - Learning Knowledge Base

AI機能を無効化し、クレジットカード登録不要の **Firebase Hosting (Sparkプラン)** で完全に無料で運用するためのガイドです。

## 🚀 無料で公開・デプロイする具体的手順

この手順を完了すると、あなたのアプリが `https://<プロジェクトID>.web.app` で世界中に公開されます。

### 1. 準備：Firebase CLI のインストール
ターミナル（コマンドプロンプト）を開き、Firebase を操作するためのツールをインストールします。
```bash
npm install -g firebase-tools
```

### 2. ログイン
Google アカウントでログインします。
```bash
firebase login
```

### 3. プロジェクトの初期化
アプリのルートディレクトリ（この README がある場所）で実行します。
```bash
firebase init hosting
```
**対話形式での回答例:**
*   `Are you ready to proceed?`: **Yes**
*   `Project Setup`: **Use an existing project** を選択し、自分のプロジェクトを選ぶ
*   `What do you want to use as your public directory?`: **out** （⚠️重要：デフォルトの `public` ではなく `out` と入力してください）
*   `Configure as a single-page app?`: **Yes**
*   `Set up automatic builds and deploys with GitHub?`: **No** (後で設定可能です)
*   `File out/index.html already exists. Overwrite?`: **No**

### 4. ビルドの実行
Next.js を静的ファイル（HTML/JS/CSS）に変換します。これにより `out` フォルダが自動生成されます。
```bash
npm run build
```

### 5. デプロイ（公開）
生成された `out` フォルダの内容を Firebase にアップロードします。
```bash
firebase deploy
```

---

## 💡 運用のポイント（完全無料を維持するために）

*   **クレジットカードは不要**: `firebase init hosting` で標準の Hosting を選んでいる限り、Sparkプラン（無料）のまま公開できます。
*   **Firestore の制限**: 読み取り 50,000回/日、書き込み 20,000回/日 までは無料です。個人や少人数での利用ならまず超えることはありません。
*   **再デプロイ**: リンクを追加したり、コードを変更したりした後は、再度 **手順 4 と 5** を実行するだけで更新が反映されます。

---
&copy; 2024 にすまな
