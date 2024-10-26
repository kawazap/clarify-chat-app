# ClarifyChat

AIを活用した質問明確化チャットアプリケーション

## 特徴

- OpenAI APIを使用した対話型チャット
- 曖昧な質問の自動検出と明確化
- リアルタイムのレスポンス
- モダンなUI/UX

## 技術スタック

- Next.js 15.0.1
- TypeScript
- Tailwind CSS
- OpenAI API
- Docker

## セットアップ

1. リポジトリのクローン:
```bash
git clone https://github.com/kawazap/clarify-chat-app.git
cd clarify-chat-app
```

2. 環境変数の設定:
```bash
cp .env.example .env
# .envファイルを編集してAPIキーなどを設定
```

3. Dockerでの起動:
```bash
docker compose up --build
```

4. ブラウザでアクセス:
```
http://localhost:3000
```

## 環境変数

- `OPENAI_API_KEY`: OpenAI APIキー
- `OPENAI_MODEL`: 使用するモデル（デフォルト: gpt-4o）

## 開発

- `docker compose up`: 開発サーバーの起動
- `docker compose down`: サーバーの停止
- `docker compose build --no-cache`: イメージの再ビルド
