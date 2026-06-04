# LibreChat

LibreChat supports remote MCP servers natively (Streamable HTTP), so **no `mcp-remote` bridge is needed**.

## Setup

1. Mint a key at [Settings → Integrations](https://app.avots.ai/#/settings/integrations) — copy the `av_mcp_<48hex>` value.
2. Add a top-level `mcpServers` block to `librechat.yaml`:

```yaml
mcpServers:
  avots:
    type: streamable-http
    url: "https://mcp.avots.ai/"
    headers:
      Authorization: "Bearer av_mcp_YOUR_KEY_HERE"
```

(See [`examples/librechat.yaml`](../examples/librechat.yaml). To keep the key out of the file, set `AVOTS_KEY=av_mcp_…` in `.env` and use `Authorization: "Bearer ${AVOTS_KEY}"`.)

3. Restart LibreChat. The avots tools appear in the tools / MCP panel.

> **One file for chat *and* tools.** LibreChat can also use avots as an OpenAI-compatible model endpoint in the same `librechat.yaml` (under `endpoints.custom`) — one `av_mcp_` key for both. See [avots.ai/openai/librechat](https://avots.ai/openai/librechat).

## Verify

In a conversation:

> Call check_balance via the avots MCP server.

## Troubleshooting

- **401 errors** → re-mint the key.
- **Server not showing up** → confirm `mcpServers` is at the **top level** of `librechat.yaml` (not nested under `endpoints`), then restart.
- **`${AVOTS_KEY}` not resolving** → it must be defined in the `.env` LibreChat loads.
