
# にすまな - Learning Knowledge Base (完全無料版)

AI機能を無効化し、クレジットカード登録不要の **Firebase Hosting (Sparkプラン)** で完全に無料で運用するためのガイドです。

## 🚀 デプロイ（公開）の具体的手順

この画面下の **「Terminal」タブ** で以下の通りに入力してください。

### 1. 正しい場所に移動する
まず、アプリの「本棚」に相当する場所に移動します。
```bash
# 今いる場所のファイル一覧を表示
ls

# もしフォルダ名（例: app など）が見えたら、その中に入ります
# 例: cd app

# どこにあるか分からない場合は、以下のコマンドで検索
find . -maxdepth 3 -name package.json
```
※ `ls` と打った時に `package.json` というファイルが見える場所が「ルートディレクトリ」です。**必ずこの場所で作業してください。**

### 2. 現在地を確認する
正しい場所にいるか（`package.json` があるか）確認します。
```bash
ls
```
ファイル名がずらっと出れば成功です。

### 3. Firebase ツールを準備する
```bash
npm install -g firebase-tools
```

### 4. ログイン（Google アカウント）
```bash
firebase login --no-localhost
```
※ 画面に表示される URL をブラウザで開き、ログインを許可して、表示されたコードをターミナルに貼り付けてください。

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
