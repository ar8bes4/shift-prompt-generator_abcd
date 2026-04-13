# 🗓️ shift-prompt-generator_abcd

> [!INFO] ステータス: 稼働中
> スタッフの実名を伏せつつ、最適なシフト表を AI で作成するための**「匿名化特化型」**プロンプト生成ツールです。

![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![Security](https://img.shields.io/badge/Privacy-Anonymization-green?style=flat-square)

## 🚀 概要 (Overview)
基本機能は `shift-prompt-generator` と同様ですが、出力されるプロンプトにおいてスタッフ名が「Aさん」「Bさん」のように自動で記号化されます。機密情報の扱いに厳しい組織や、パブリックな AI チャットに実名を送信したくないケースに最適化されています。

## ✨ 機能・特徴 (Features)
- **自動アノニマイズ**: 入力された実名を、プロンプト生成時に一括で匿名記号（A, B, C...）へ置換。
- **プライバシー保護**: 外部サーバーへのデータ送信は一切なし。完全にブラウザ内で匿名化処理が完結。
- **逆変換の容易性**: 記号と実名の対応関係をブラウザ上で保持（セッション内）し、作成後のシフト割当をスムーズにします。
- **特定パターン対応**: 四交代（A, B, C, D）や、特定の役割分担に特化したプロンプト・テンプレートを搭載。

## 🛠 技術構成 (Tech Stack)
- **Frontend**: React (Functional Components)
- **Logic**: String manipulation for anonymization
- **Development**: Vite
- **Security Strategy**: Client-Side Data Scrubbing

---
**Focus**: Privacy & Data Protection in Medical Workflow
