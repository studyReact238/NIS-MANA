# にすまな - Learning Knowledge Base

AI機能を無効化し、完全に無料で運用可能なスマート学習リンク管理ツールです。

## 無料で公開・運用する方法

このアプリは、クレジットカードを登録せずに **Firebase Hosting (Sparkプラン)** で世界中に無料公開できます。

### 公開手順
1.  **Firebase CLI のインストール**: `npm install -g firebase-tools`
2.  **ログイン**: `firebase login`
3.  **初期化**: `firebase init hosting`
    *   `What do you want to use as your public directory?` には `out` と入力。
    *   `Configure as a single-page app?` は `Yes` を選択。
    *   `Set up automatic builds and deploys with GitHub?` は任意。
4.  **ビルド**: `npm run build` (Next.js が `out` フォルダに静的ファイルを生成します)
5.  **デプロイ**: `firebase deploy`

### 運用のポイント
*   **Firestore の無料枠**: 読み取り 50,000回/日、書き込み 20,000回/日 までは無料です。
*   **AI機能**: Sparkプラン（静的サイト）では AI 要約機能は動作しないため、ボタンを非表示にしています。
*   **画像**: `next/image` は静的サイト用に最適化なし（unoptimized）の設定になっています。

---
&copy; 2024 にすまな
