// bridge.mjs
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
import fetch from "node-fetch"; // if using Node <18, or remove if on Node 18+

// === 追加: Node.js の例外キャッチ
process.on("uncaughtException", (err) => {
  console.error("UncaughtException:", err);
});
process.on("unhandledRejection", (reason, promise) => {
  console.error("UnhandledRejection:", reason);
});

// 1) Create an MCP server instance
console.error("Starting MCP server instance...");
const server = new Server(
  {
    name: "gas-bridge",
    version: "1.0.0"
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  console.error("ListToolsRequest received");
  return {
    tools: [
      {
        name: "execute-gas",
        description: "Execute custom GAS script",
        inputSchema: {
          type: "object",
          properties: {
            title:  { type: "string" },
            script: { type: "string" },
            apiKey: { type: "string" }
          },
          required: ["script", "apiKey"]
        }
      }
    ]
  };
});

// 3) Handler: 実際にツールが呼ばれたとき
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  console.error("CallToolRequest received:", JSON.stringify(request, null, 2));
  const { name, arguments: args } = request.params;
  if (name !== "execute-gas") {
    console.error(`Unknown tool called: ${name}`);
    throw new Error(`Unknown tool: ${name}`);
  }
  const { title = "untitled", script, apiKey } = args;

  // 外部に投げる前にログを残す
  console.error("Sending request to GAS endpoint with:", {
    title,
    scriptLength: script?.length,
    apiKeyMask: apiKey ? "***" : "(none)"
  });

  const GAS_ENDPOINT = "https://script.google.com/macros/s/AKfycbxxxxx/exec";  // ← あなたのGASエンドポイント

  try {
    const response = await fetch(GAS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, script, apiKey })
    });
    if (!response.ok) {
      const text = await response.text();
      console.error(`GAS HTTP error: ${response.status} - ${response.statusText}`);
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `GAS HTTP error: ${response.status} - ${response.statusText}\n${text}`
          }
        ]
      };
    }

    const data = await response.json();
    console.error("Response from GAS endpoint:", data);

    if (!data.success) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: data.error || "GAS returned error"
          }
        ]
      };
    }

    return {
      content: [
        {
          type: "text",
          text: data.result || "No result from GAS"
        }
      ]
    };
  } catch (err) {
    console.error("Fetch error:", err);
    return {
      isError: true,
      content: [
        { type: "text", text: `Fetch error: ${err.message}` }
      ]
    };
  }
});

// 4) 起動用: Stdioを介してClaudeと通信
console.error("Connecting transport...");
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("Bridge server started (Stdio). Waiting for requests...");

// ★ Node がすぐ終了しないため、イベントループをブロック
await new Promise(() => {});
