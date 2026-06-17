import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const log = (...args: unknown[]) => console.error("[channel-bridge]", ...args);

const BEERCAN_URL = process.env.BEERCAN_URL ?? "http://100.114.129.95:9100";
const AGENT_NAME = process.env.AGENT_NAME ?? process.env.USER ?? "unknown";
if (AGENT_NAME === "unknown") {
  log("AGENT_NAME env is required (falls back to $USER)");
  process.exit(1);
}

const server = new Server(
  { name: "beercan-bridge", version: "1.0.0" },
  {
    capabilities: {
      experimental: { "claude/channel": {} },
      tools: {},
    },
  },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "reply",
      description: "Send a message back to the Telegram chat this channel serves",
      inputSchema: {
        type: "object" as const,
        properties: {
          chat_id: { type: "string", description: "Telegram chat to reply in" },
          text: { type: "string", description: "Message text to send" },
          reply_to: {
            type: "string",
            description: "Optional Telegram message_id to thread under",
          },
          format: {
            type: "string",
            enum: ["text", "markdownv2"],
            description: "Optional render mode",
          },
          files: {
            type: "array",
            items: { type: "string" },
            description: "Absolute file paths to attach",
          },
        },
        required: ["chat_id", "text"],
      },
    },
    {
      name: "react",
      description: "Add an emoji reaction to a Telegram message",
      inputSchema: {
        type: "object" as const,
        properties: {
          chat_id: { type: "string", description: "Telegram chat" },
          message_id: { type: "string", description: "Message to react to" },
          emoji: { type: "string", description: "Emoji to react with" },
        },
        required: ["chat_id", "message_id", "emoji"],
      },
    },
    {
      name: "edit_message",
      description: "Edit a previously sent Telegram message",
      inputSchema: {
        type: "object" as const,
        properties: {
          chat_id: { type: "string", description: "Telegram chat" },
          message_id: { type: "string", description: "Message to edit" },
          text: { type: "string", description: "New message text" },
          format: {
            type: "string",
            enum: ["text", "markdownv2"],
            description: "Optional render mode",
          },
        },
        required: ["chat_id", "message_id", "text"],
      },
    },
    {
      name: "download_attachment",
      description: "Download a Telegram file by file_id",
      inputSchema: {
        type: "object" as const,
        properties: {
          file_id: { type: "string", description: "Telegram file_id to download" },
        },
        required: ["file_id"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const args = req.params.arguments as Record<string, unknown>;

  if (req.params.name === "reply") {
    try {
      const r = await fetch(`${BEERCAN_URL}/api/telegram/reply`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          agent: AGENT_NAME,
          chat_id: args.chat_id,
          text: args.text,
          reply_to: args.reply_to,
          format: args.format,
          files: args.files,
        }),
      });
      const ok = r.ok;
      const body = await r.text();
      return {
        content: [{ type: "text", text: ok ? `sent` : `reply failed: HTTP ${r.status} ${body}` }],
        isError: !ok,
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `reply failed: ${String(err)}` }],
        isError: true,
      };
    }
  }

  if (req.params.name === "react") {
    try {
      const r = await fetch(`${BEERCAN_URL}/api/telegram/react`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          agent: AGENT_NAME,
          chat_id: args.chat_id,
          message_id: args.message_id,
          emoji: args.emoji,
        }),
      });
      const ok = r.ok;
      return {
        content: [{ type: "text", text: ok ? "reacted" : `react failed: HTTP ${r.status}` }],
        isError: !ok,
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `react failed: ${String(err)}` }],
        isError: true,
      };
    }
  }

  if (req.params.name === "edit_message") {
    try {
      const r = await fetch(`${BEERCAN_URL}/api/telegram/edit`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          agent: AGENT_NAME,
          chat_id: args.chat_id,
          message_id: args.message_id,
          text: args.text,
          format: args.format,
        }),
      });
      const ok = r.ok;
      return {
        content: [{ type: "text", text: ok ? "edited" : `edit failed: HTTP ${r.status}` }],
        isError: !ok,
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `edit failed: ${String(err)}` }],
        isError: true,
      };
    }
  }

  if (req.params.name === "download_attachment") {
    try {
      const r = await fetch(`${BEERCAN_URL}/api/telegram/download`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          agent: AGENT_NAME,
          file_id: args.file_id,
        }),
      });
      const ok = r.ok;
      const body = await r.json() as { path?: string };
      return {
        content: [{ type: "text", text: ok ? body.path ?? "downloaded" : `download failed: HTTP ${r.status}` }],
        isError: !ok,
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `download failed: ${String(err)}` }],
        isError: true,
      };
    }
  }

  throw new Error(`unknown tool: ${req.params.name}`);
});

function buildMeta(fields: Record<string, unknown>): Record<string, string> {
  const meta: Record<string, string> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (v === null || v === undefined) continue;
    meta[k] = String(v);
  }
  return meta;
}

async function emitChannelMessage(text: string, meta: Record<string, string>) {
  await server.notification({
    method: "notifications/claude/channel",
    params: { content: text, meta },
  });
}

interface InboundBody {
  text: string;
  chat_id: string | number;
  message_id: number;
  user_id?: string | number | null;
  username?: string | null;
  chat_type?: string | null;
  reply_to?: number | null;
  image_path?: string | null;
  attachment_file_id?: string | null;
}

async function pollLoop() {
  log(`polling ${BEERCAN_URL}/api/telegram/inbox/${AGENT_NAME}`);
  for (;;) {
    try {
      const res = await fetch(
        `${BEERCAN_URL}/api/telegram/inbox/${encodeURIComponent(AGENT_NAME!)}?wait=25`,
      );
      if (res.ok) {
        const { messages } = (await res.json()) as {
          messages: Array<{ body: string; id: string }>;
        };
        for (const m of messages) {
          let parsed: InboundBody;
          try {
            parsed = JSON.parse(m.body) as InboundBody;
          } catch {
            log("skipping unparseable message:", m.id);
            continue;
          }
          const meta = buildMeta({
            source: "telegram",
            chat_id: parsed.chat_id,
            message_id: parsed.message_id,
            user_id: parsed.user_id,
            user: parsed.username,
            chat_type: parsed.chat_type,
            reply_to: parsed.reply_to,
            image_path: parsed.image_path,
            attachment_file_id: parsed.attachment_file_id,
            beercan_message_id: m.id,
          });
          await emitChannelMessage(parsed.text, meta);
          log(`delivered msg ${m.id} from chat ${parsed.chat_id}`);
        }
      } else {
        log(`inbox poll: HTTP ${res.status}`);
        await new Promise((r) => setTimeout(r, 2000));
      }
    } catch (err) {
      log("poll error:", err);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

const transport = new StdioServerTransport();
await server.connect(transport);
log("connected to MCP transport");
void pollLoop();
