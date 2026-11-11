# Firebase Authentication & Member Portal 🔐

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Firebase: v10 Modular SDK](https://img.shields.io/badge/Firebase-v10%20Modular%20SDK-orange.svg)](https://firebase.google.com/)
[![Vanilla JS](https://img.shields.io/badge/JavaScript-Vanilla%20ES%20Modules-yellow.svg)](app.js)
[![CI](https://github.com/saitarus/firebase-auth-portal/actions/workflows/ci.yml/badge.svg)](https://github.com/saitarus/firebase-auth-portal/actions)

**Firebase Auth ＆ Firestore を活用した、モダン Vanilla JavaScript による会員管理・ダッシュボード ポータル**

A production-ready member authentication portal and user dashboard built with modern Vanilla JavaScript ES Modules, Firebase Authentication, and Cloud Firestore.

---

## 🌟 主な特徴 (Features)

1. **Firebase v10 Modular SDK 完全対応**
   - CDN から直接 ES Modules を読み込み、ビルドツール不要で動作。
   - 軽量・高速なツリーシェイキング対応インポート構文。
2. **多機能認証フロー (Authentication Suite)**
   - メールアドレス / パスワードによる新規登録・サインイン
   - Google アカウントによるポップアップ 1 クリック認証
   - セッション永続化（`onAuthStateChanged`）と安全なサインアウト
3. **会員ダッシュボード ＆ リアルタイムプロファイル管理**
   - ユーザー表示名・アバター・最終ログイン日時の管理
   - Cloud Firestore と連携したアクティビティ履歴の自動記録
   - 評価レート・実績バッジ表示コンポーネント
4. **優れた UI / UX 設計**
   - パスワード表示切り替えトグル、利用規約モーダル
   - スタイリッシュなトースト通知（Success / Error / Info）
   - CSS3 トランジションによるスムーズなローディングアニメーション

---

## 📁 ディレクトリ構成 (Architecture)

```text
firebase-auth-portal/
├── tests/
│   └── test_portal.py              # 構造整合性＆セキュリティ検査テスト
├── .github/
│   └── workflows/
│       └── ci.yml                  # GitHub Actions CI
├── index.html                      # 会員ポータル UI
├── app.js                          # Firebase 認証・Firestore 連携ロジック
├── style.css                       # レスポンシブ スタイリング
├── firebase-config.js              # 設定ファイル（プレースホルダー）
├── firebase-config.example.js      # 設定テンプレート
├── firebase.json                   # Firebase Hosting 設定
├── .gitignore                      # 認証情報除外設定
├── LICENSE                         # MIT ライセンス
└── README.md                       # 本ドキュメント
```

---

## 🚀 クイックスタート (Quick Start)

### 1. リポジトリのクローン

```bash
git clone https://github.com/saitarus/firebase-auth-portal.git
cd firebase-auth-portal
```

### 2. Firebase 設定の登録

Firebase Console（https://console.firebase.google.com/）でプロジェクトを作成し、ウェブアプリを登録します。

発行された構成値を `firebase-config.js` に貼り付けます：

```javascript
// firebase-config.js
export const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.firebasestorage.app",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};
```

### 3. ローカル実行

```bash
# 簡易 HTTP サーバーで起動
python -m http.server 8080
```

ブラウザで `http://localhost:8080` を開きます。

---

## 🛡️ セキュリティ設計 (Security Best Practices)

- **API キーの分離**: 本番用の構成キーは Git 管理から除外し、`.example.js` のみを提供。
- **Firestore セキュリティルール**: 認証済みユーザー本人の UID に紐づくドキュメントのみ読み書きを許可するゼロトラスト設計を推奨。

---

## 📄 ライセンス (License)

本プロジェクトは [MIT License](LICENSE) のもとで公開されています。
