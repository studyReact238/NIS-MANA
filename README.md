# Welcome to Antigravity!

Welcome to your new developer home! Your Firebase Studio project has been successfully migrated to Antigravity.

Antigravity is our next-generation, agent-first IDE designed for high-velocity, autonomous development. Because Antigravity runs locally on your machine, you now have access to powerful local workflows and fully integrated AI editing capabilities that go beyond a cloud-based web IDE.

## Getting Started
- **Run Locally**: Use the **Run and Debug** menu on the left sidebar to start your local development server.
  - Or in a terminal run `npm run dev` and visit `http://localhost:9002`.
- **Deploy**: You can deploy your changes to Firebase App Hosting by using the integrated terminal and standard Firebase CLI commands, just as you did in Firebase Studio.
- **Cleanup**: Cleanup unused artifacts with the @cleanup workflow.

Enjoy the next era of AI-driven development!

File any bugs at https://github.com/firebase/firebase-tools/issues

**Firebase Studio Export Date:** 2026-10-01


---

## Previous README.md contents:


# にすまな - スキマ時間でちょいアプデ。(完全無料版)

AI機能を無効化し、クレジットカード登録不要の **Firebase Hosting (Sparkプラン)** で完全に無料で運用するためのガイドです。

## 🚀 デプロイ（公開）の具体的手順

この画面下の **「Terminal」タブ** で以下の通りに入力してください。

### 1. 正しい場所に移動する
アプリのルートディレクトリ（`/workspace`）にいることを確認します。
```bash
cd /workspace
ls
```
※ `ls` と打った時に `package.json` というファイルが見える場所が正解です。

### 2. Firebase ツールを準備する（未実施の場合）
```bash
npm install -g firebase-tools
```

### 3. ログイン（Google アカウント）
```bash
firebase login --no-localhost
```
※ 画面に表示される URL をブラウザで開き、ログインを許可して、表示されたコードをターミナルに貼り付けてください。

### 4. ビルド（ウェブサイトの作成）
**【重要】** デプロイの前に、Next.js を「静的ファイル（HTML/JS）」に変換して `out` ディレクトリを作成する必要があります。
```bash
npm run build
```
ビルドが完了したら、`ls -d out` と入力して `out` という名前のフォルダが存在することを確認してください。

### 5. プロジェクトの初期化（未実施の場合）
```bash
firebase init hosting
```
**質問への答え方:**
*   `Project Setup`: **Use an existing project** を選び、自分のプロジェクトを選択
*   `Public directory`: **out** と入力（⚠️重要：デフォルトの `public` ではなく `out`）
*   `Configure as a single-page app`: **Yes**
*   `Overwrite out/index.html?`: **No**

### 6. デプロイ（世界中に公開！）
```bash
firebase deploy
```
完了すると、`https://[プロジェクトID].web.app` のような URL が表示されます。それがあなたのサイトのアドレスです。

---
&copy; 2026 にすまな制作委員会
