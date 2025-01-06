# Claude-GAS-Bridge

Node.js を用いて、[MCP (Model Context Protocol)](https://modelcontextprotocol.io/) クライアント（例: Claude Desktop）と GAS Interpreter（Google Apps Script 側）を接続するブリッジサーバーです。  
`bridge.mjs` 内で [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk) の MCP サーバーを起動し、GAS のWebエンドポイントへ HTTP POST する機能を提供します。

## 構成概要

```
claude-gas-bridge/
├─ bridge.mjs               # メインのMCPサーバーコード
├─ package.json
├─ package-lock.json
└─ ... (その他ファイル)
```

- `bridge.mjs`  
  MCPサーバー本体。`execute-gas` というツールを定義し、クライアントから受け取ったGASスクリプトを指定の WebApp（Apps Script）エンドポイントへ転送します。  
  ツール呼び出し時、タイトル・スクリプト本文・APIキーを JSON で送信する形です。

## 必要環境

- **Node.js 18 以上**  
  `@modelcontextprotocol/sdk` が Node 18 以降を推奨しています  
- **GAS Interpreter のデプロイ済み**  
  Google Apps Script で GAS Interpreter を正しくデプロイし、ウェブアプリのURLを取得しておく  
- （オプション）Claude Desktop 等、MCP クライアント

## セットアップ

1. **ソースを取得**
   ```bash
   git clone <このリポジトリのURL>
   cd claude-gas-bridge
   ```

2. **依存パッケージをインストール**
   ```bash
   npm install
   ```
   ※ Yarn でも可

3. **GASのデプロイURLを設定**  
   `bridge.mjs` 内の `GAS_ENDPOINT` を、実際のApps ScriptのURLに書き換える。  
   例：
   ```js
   const GAS_ENDPOINT = "https://script.google.com/macros/s/AKfycbxxxxx/exec";
   ```

4. **Node.js でサーバー起動**
   ```bash
   node bridge.mjs
   ```
   コンソールに `"Bridge server started (Stdio). Waiting for requests..."` と表示されたら待機状態となり、MCPクライアントからの呼び出しを受け付けます。

## Claude Desktop との連携 (例)

もし Claude Desktop で利用する場合、`claude_desktop_config.json` に以下のように設定します:

```jsonc
{
  "mcpServers": {
    "gas-bridge": {
      "command": "node",
      "args": [
        "/絶対パス/claude-gas-bridge/bridge.mjs"
      ]
    }
  }
}
```

1. Claude Desktop を再起動
2. チャット画面下部のツール一覧（ハンマーアイコン）で `execute-gas` が見えるはずです
3. 「ChatGPT を通じて GASスクリプトを実行したい」などの指示をすると、`bridge.mjs` がリクエストを受け、GAS Interpreterに転送します

## APIキーの管理について

- GAS Interpreter 側が API キーを要求する場合は、ツール呼び出し時に `"apiKey": "..."` を指定するか、`bridge.mjs` 内部で環境変数を参照して埋め込むなど適宜調整してください。

## トラブルシュート

- **Node.js のバージョン**  
  Node 18 以上かを確認
- **プロセスがすぐ終了する**  
  `bridge.mjs` 最後の `await new Promise(() => {})` が必要です
- **GAS へリクエストが飛ばない**  
  デプロイURLや認証スコープを再確認し、`console.error` ログを追ってみてください
- **Claude Desktop でツール一覧に表示されない**  
  `claude_desktop_config.json` のパスが正しいか確認。Claude を再起動してみる

---

上記 README はあくまで目安です。運用環境に合わせて内容を追記・変更してください。
