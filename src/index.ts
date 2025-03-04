#!/usr/bin/env node
/**
 * シンプルなMCPサーバー
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListToolsRequestSchema,
  CallToolRequestSchema
} from "@modelcontextprotocol/sdk/types.js";

// シンプルなツールを定義
function listTools() {
  return {
    tools: [
      {
        name: "get_current_time",
        description: "現在の時刻を取得する",
        inputSchema: {
          type: "object",
          properties: {},
          required: []
        }
      },
      {
        name: "echo_message",
        description: "メッセージをそのまま返す",
        inputSchema: {
          type: "object",
          properties: {
            message: {
              type: "string",
              description: "エコーするメッセージ"
            }
          },
          required: ["message"]
        }
      }
    ]
  };
}

// リソースを定義
function listResources() {
  return {
    resources: [
      {
        uri: "simple://greeting",
        mimeType: "text/plain",
        name: "Greeting",
        description: "簡単な挨拶メッセージ"
      }
    ]
  };
}

// リソースの内容を取得
async function readResource(uri: string) {
  if (uri === "simple://greeting") {
    // 環境変数 SAMPLE_ENV を取得
    const sampleEnv = process.env.SAMPLE_ENV;
    
    // SAMPLE_ENV がない場合はエラーを投げる
    if (!sampleEnv) {
      throw new Error("環境変数 SAMPLE_ENV が設定されていません");
    }
    
    return {
      contents: [{
        uri,
        mimeType: "text/plain",
        text: `こんにちは！シンプルなMCPサーバーへようこそ。\n環境変数 SAMPLE_ENV: ${sampleEnv}`
      }]
    };
  }
  
  throw new Error(`不明なリソース: ${uri}`);
}

// ツールを実行
async function executeTools(toolName: string, args: any) {
  switch (toolName) {
    case "get_current_time": {
      const now = new Date().toISOString();
      return {
        content: [
          {
            type: "text",
            text: `現在の時刻: ${now}`
          }
        ]
      };
    }
    
    case "echo_message": {
      const message = args.message || "メッセージがありません";
      return {
        content: [
          {
            type: "text",
            text: `あなたのメッセージ: ${message}`
          }
        ]
      };
    }
    
    default:
      throw new Error("不明なツール");
  }
}

// MCPサーバーを作成
const server = new Server(
  {
    name: "simple-mcp-server",
    version: "0.1.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

// リソース一覧のハンドラー
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return listResources();
});

// リソース内容取得のハンドラー
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  return await readResource(request.params.uri);
});

// ツール一覧のハンドラー
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return listTools();
});

// ツール実行のハンドラー
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  return await executeTools(
    request.params.name, 
    request.params.arguments
  );
});

// サーバーを起動
async function main() {
  try {
    // 起動時に環境変数 SAMPLE_ENV の存在を確認
    if (!process.env.SAMPLE_ENV) {
      throw new Error("環境変数 SAMPLE_ENV が設定されていません。サーバーを起動できません。");
    }
    
    console.error("シンプルなMCPサーバーを起動しています...");
    const transport = new StdioServerTransport();
    await server.connect(transport);
  } catch (error) {
    console.error("サーバー初期化エラー:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("サーバーエラー:", error);
  process.exit(1);
});