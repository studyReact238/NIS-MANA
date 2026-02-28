
# にすまな - Learning Knowledge Base (完全無料版)

AI機能を無効化し、クレジットカード登録不要の **Firebase Hosting (Sparkプラン)** で完全に無料で運用するためのガイドです。

## 💻 ターミナル（コマンドプロンプト）について
Windows の「コマンドプロンプト」と、この画面下の「Terminal」は同じ役割のツールですが、動いているシステムが異なります。

*   **画面下の Terminal**: Google のクラウド（Linux）で動いています。パスは `/home/user/app` です。
*   **自分の Windows PC**: あなたのパソコン（Windows）で動いています。パスは `C:\Users\名前\...` のようになります。

---

## 🚀 無料で公開・デプロイする具体的手順

この画面下の **「Terminal」タブ** で以下の通りに入力してください。

### 1. 正しい場所に移動する
まず、アプリの「本棚」に相当する場所に移動します。
```bash
cd /home/user/app
```
※ Windows のコマンドプロンプトと同じように、`cd` は「フォルダ移動」の命令です。

### 2. 現在地を確認する
正しい場所にいるか（`package.json` があるか）確認します。
```bash
ls
```
※ Windows の `dir` コマンドに相当します。ファイル名がずらっと出れば成功です。

### 3. Firebase ツールを準備する
```bash
npm install -g firebase-tools
```

### 4. ログイン（Google アカウント）
```bash
firebase login --no-localhost
```
※ 画面に表示される指示（URL）に従って、ブラウザでログインを許可してください。

### 5. プロジェクトの初期化
```bash
firebase init hosting
```
**質問への答え方:**
*   `Project Setup`: **Use an existing project** を選び、自分のプロジェクトを選択
*   `Public directory`: **out** と入力（⚠️重要：デフォルトの `public` ではなく `out`）
*   `Configure as a single-page app`: **Yes**
*   `Overwrite out/index.html?`: **No**

### 6. ビルド（ウェブサイトの作成）
Next.js を「静的ファイル（HTML/JS）」に変換します。
```bash
npm run build
```

### 7. デプロイ（世界中に公開！）
```bash
firebase deploy
```
完了すると、`https://[プロジェクトID].web.app` のような URL が表示されます。それがあなたのサイトのアドレスです。

---
&copy; 2024 にすまな
