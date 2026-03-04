# 「にすまな」システム詳細仕様書

## 1. プロジェクト概要
### 1.1 コンセプト
「スキマ時間でちょいアプデ。」をキャッチコピーとした、若手社員向けのナレッジ共有・学習集会所。管理者（先輩）が良質な学習リソースを共有し、ユーザー（後輩）がそれを効率的に消化・評価するエコシステムを提供する。

### 1.2 主なターゲット
- **学習者**: 質の高い情報を短時間で取得したい若手社員。
- **管理者**: 組織内の知識の底上げを図りたいシニアエンジニア・メンター。

---

## 2. 技術スタック
### 2.1 フロントエンド
- **Framework**: Next.js 15.5.9 (App Router / Static Export モード)
- **Library**: React 19.2.1
- **Styling**: Tailwind CSS (ユーティリティファースト), ShadCN UI (Radix UI ベースのコンポーネント)
- **Icons**: Lucide-React
- **State Management**: React Context API (LinkContext) + Firebase Real-time Listeners

### 2.2 バックエンド (BaaS)
- **Platform**: Firebase (Google Cloud)
- **Authentication**: Firebase Authentication (Email/Password 認証)
- **Database**: Cloud Firestore (NoSQL ドキュメント指向データベース)
- **Hosting**: Firebase Hosting

---

## 3. システムアーキテクチャ
### 3.1 リアルタイム・同期設計
Firestore の `onSnapshot` を活用し、他ユーザーの学習開始・完了状況、評価、タイムラインが即座に反映される。
- **LinkContext**: アプリケーション全体のグローバルステートを管理。Firestore へのサブスクリプションを一元化し、コンポーネント間の不必要な再レンダリングを抑制。

### 3.2 サーバーレス・セキュリティ
`firestore.rules` による堅牢なアクセス制御。
- **管理者権限**: `/admins/{userId}` ドキュメントの存在を確認する関数 `isAdmin()` を定義し、特定ドキュメント（学習リンクの作成・編集、ユーザー管理）への書き込みを厳格に制限。
- **所有権チェック**: ユーザー個人の進捗データ（`/users/{userId}/progress`）は、本人以外からの書き込みを拒否。

---

## 4. 機能詳細
### 4.1 学習リンク管理 (Learning Resources)
- **CRUD機能**: 管理者はタイトル、URL、説明、タグ、カラー、アイコンをカスタマイズしてリンクを投稿。
- **確認テスト**: 外部リンク、または直接アップロードされたHTML（Sandbox化されたiframeで実行）による理解度チェック。
- **複製機能**: 既存の教材をベースにした派生教材の迅速な作成。

### 4.2 独自アルゴリズム：コンテンツ推奨ロジック
情報の質を担保するため、以下の動的評価システムを導入。
- **判定条件**: 
  1. `高評価数 >= (全登録ユーザー数 * 0.1)` (10%以上のリーチ)
  2. かつ `高評価数 > 低評価数`
- **ステータス**: 
  - 上記を満たす場合：`推奨コンテンツ` (Sparkles バッジ付与)
  - 満たさない場合：`非推奨コンテンツ` (Caution バッジ付与)

### 4.3 学習ステータス・トラッキング
- **3段階の状態**: `未着手`、`学習中`、`受講済み`。
- **統計同期**: 管理者画面から「統計情報の再集計」を実行可能。Firestore の非同期な増分更新（increment）で稀に生じるカウントのズレを、実データに基づきバッチ処理で一括修正する。

### 4.4 アクティビティ・タイムライン
- 学習の開始・完了、新着投稿、情報更新をログとして保存。
- **ユーザー識別**: ログに保存された UID をキーに、表示の瞬間に最新の `users` ドキュメントを参照。氏名が登録されていれば「氏名（姓名）」を優先表示し、未登録ならメールアドレスを表示する堅牢なフォールバック設計。

### 4.5 ユーザー・管理者管理
- **管理パネル**: 新規ユーザー登録、管理者権限の付与/解除、学習進捗の確認、最終ログイン日時の監視。
- **プロファイル**: 姓・名の登録機能。

---

## 5. データモデル (Firestore 構成)

### 5.1 /users/{userId}
ユーザーの基本情報。
- `id`, `email`, `lastName`, `firstName`, `lastLoginAt`, `createdAt`

### 5.2 /learningLinks/{linkId}
共有リンクのマスター。
- `title`, `url`, `testUrl`, `testHtml`, `tags`, `completedCount`, `learningCount`, `upvoteCount`, `downvoteCount`

### 5.3 /activities/{activityId}
活動ログ。
- `type`, `userId`, `linkTitle`, `timestamp`

### 5.4 /users/{userId}/progress/{linkId}
個人の進捗。
- `status` (unstarted | learning | completed)

---

## 6. 技術的アピールポイント（SE向け）
- **Hydration Mismatch 対策**: `useEffect` によるクライアントサイド・マウント後の初期化を徹底。
- **Context API の最適化**: `useMemo` と `useCallback` を多用し、Firebase のリスナーと React のレンダリングサイクルを高度に調和。
- **UX/UI**: Framer Motion ライクな Tailwind アニメーション、ShadCN によるアクセシビリティ担保。
- **拡張性**: すべてのドキュメントにタイムスタンプとUIDを保持しており、将来的なビッグデータ解析や AI によるパーソナライズ推奨への拡張が容易。
