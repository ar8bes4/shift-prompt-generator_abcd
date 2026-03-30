# 🗓️ shift-prompt-generator_abcd (Anonymous Version)

> [!INFO] ステータス: テスト中
> スタッフ各員の希望シフトを AI 用データに変換する SPA ツールの、スタッフの実名を伏せて管理する**「一般化（アノニマイズ）バージョン」**です。

## 🚀 概要 (Overview)
基本機能は `shift-prompt-generator` と同様ですが、出力されるプロンプトにおいてスタッフ名が「Aさん」「Bさん」「Cさん」のように記号化されます。機密情報の取り扱いに厳しい環境や、外部のクラウド AI（実名を送信したくない場合）でも安心して利用可能です。特定の A/B/C/D パターンに最適化された出力調整も行われています。

## ✨ 機能・特徴 (Features)
- **匿名化ロジック**: 入力された名前を順次記号に置き換えてプロンプトを生成。
- **セキュアな設計**: 全ての処理をローカルのブラウザ内で行う（クライアントサイド処理）。
- **共通の操作性**: 通常版と同じ UI/UX で、匿名化のみを自動実行。

## 🛠 技術構成 (Tech Stack)
- **Frontend**: React + Vite
- **セキュリティ**: Client-Side Only

---
**Focus**: Privacy & Data Protection in Medical Workflow
