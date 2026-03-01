
# にすまな - スキマ時間でちょいアプデ。(完全無料版)

AI機能を無効化し、クレジットカード登録不要の **Firebase Hosting (Sparkプラン)** で完全に無料で運用するためのガイドです。

## 🚀 デプロイ（公開）の具体的手順

この画面下の **「Terminal」タブ** で以下の通りに入力してください。

### 1. 正しい場所に移動する
まず、アプリの「本棚」に相当する場所に移動します。
```bash
# 自分のホームディレクトリに移動
cd ~

# ファイル一覧を表示
ls
```
※ `ls` と打った時に `package.json` というファイルが見える場所が「ルートディレクトリ」です。

**もし見つからない場合:**
```bash
# 現在地を `/workspace` に変更して確認
cd /workspace
ls
```

### 2. Firebase ツールを準備する
```bash
npm install -g firebase-tools
```

### 3. ログイン（Google アカウント）
```bash
firebase login --no-localhost
```
※ 画面に表示される URL をブラウザで開き、ログインを許可して、表示されたコードをターミナルに貼り付けてください。

### 4. プロジェクトの初期化
```bash
firebase init hosting
```
**質問への答え方:**
*   `Project Setup`: **Use an existing project** を選び、自分のプロジェクトを選択
*   `Public directory`: **out** と入力（⚠️重要：デフォルトの `public` ではなく `out`）
*   `Configure as a single-page app`: **Yes**
*   `Overwrite out/index.html?`: **No**

### 5. ビルド（ウェブサイトの作成）
Next.js を「静的ファイル（HTML/JS）」に変換します。
```bash
npm run build
```

### 6. デプロイ（世界中に公開！）
```bash
firebase deploy
```
完了すると、`https://[プロジェクトID].web.app` のような URL が表示されます。それがあなたのサイトのアドレスです。

---
&copy; 2026 にすまな制作委員会
