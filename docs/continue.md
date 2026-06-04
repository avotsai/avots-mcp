# Continue.dev

Continue (VS Code / JetBrains) supports remote MCP servers in `config.yaml` over Streamable HTTP — **no bridge needed**.

## Setup

1. Mint a key at [Settings → Integrations](https://app.avots.ai/#/settings/integrations) — copy the `av_mcp_<48hex>` value.
2. Add an `mcpServers` entry to `~/.continue/config.yaml`:

```yaml
mcpServers:
  - name: avots
    type: streamable-http
    url: https://mcp.avots.ai/
    requestOptions:
      headers:
        Authorization: Bearer av_mcp_YOUR_KEY_HERE
```

(See [`examples/continue.yaml`](../examples/continue.yaml). The Bearer header goes under `requestOptions.headers` — that is the part most people miss.)

3. Save and reload Continue. The avots tools appear in the agent's tool list.

> **One file for chat *and* tools.** Continue can also run avots as an OpenAI-compatible model in the same `config.yaml` (`provider: openai`, `apiBase: https://api.avots.ai/openai/v1`) — one `av_mcp_` key for both. See [avots.ai/openai/continue](https://avots.ai/openai/continue).

## Verify

In Continue agent mode:

> Call check_balance via the avots MCP server.

## Troubleshooting

- **401 errors** → re-mint the key.
- **Header ignored / 401 despite a key** → the Bearer header must be under `requestOptions.headers`, not directly on the server entry.
- **Tools not listed** → MCP tools surface in **agent** mode; make sure you are not in plain chat mode.
