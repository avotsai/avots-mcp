# openclaw

[openclaw](https://github.com/openclaw/openclaw) speaks remote MCP natively over Streamable HTTP, so there is **no `mcp-remote` bridge and no Node requirement** — just point it at `https://mcp.avots.ai/` with a Bearer header.

## Setup

1. Mint a key at [Settings → Integrations](https://app.avots.ai/#/settings/integrations) on avots — copy the `av_mcp_<48hex>` value while it is on screen.
2. Open `~/.openclaw/openclaw.json` and add a server under `mcp.servers`:

```json5
{
  mcp: {
    servers: {
      avots: {
        url: "https://mcp.avots.ai/",
        transport: "streamable-http",
        headers: { Authorization: "Bearer av_mcp_YOUR_KEY_HERE" }
      }
    }
  }
}
```

(See [`examples/openclaw.json`](../examples/openclaw.json) for a copy-paste-ready version.)

3. Save. openclaw connects on its next run and the avots tools become available.

> **One config for chat *and* tools.** openclaw also supports OpenAI-compatible model providers, so the same `openclaw.json` can point its LLM at avots too — one `av_mcp_` key for both. See the combined config at [avots.ai/openai/openclaw](https://avots.ai/openai/openclaw).

## Verify

Ask openclaw:

> Call check_balance via the avots MCP server.

## Troubleshooting

- **401 errors** → key revoked or mistyped. Re-mint at Settings → Integrations.
- **Connection / TLS errors** → keep the trailing slash on the URL: `https://mcp.avots.ai/`.
- **OAuth prompts** → not needed here. A static `headers.Authorization` Bearer is the simplest auth for avots; you do not need `openclaw mcp login`.
