# Cursor

Cursor's MCP support uses the same stdio shape as Claude Desktop, so we use the [`mcp-remote`](https://www.npmjs.com/package/mcp-remote) bridge to expose `mcp.avots.ai`. **Requires Node.js installed** (for `npx`).

## Setup

1. Mint a key at [Settings → Integrations](https://app.avots.ai/#/settings/integrations) on avots - copy the `av_mcp_<48hex>` value while it's on screen.
2. Open Cursor → **Settings → Cursor Settings → MCP → Add new MCP server**.
3. Cursor opens `~/.cursor/mcp.json`. Paste this (merge with existing `mcpServers` if any):

```json
{
  "mcpServers": {
    "avots": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://mcp.avots.ai/",
        "--header",
        "Authorization: Bearer av_mcp_YOUR_KEY_HERE"
      ]
    }
  }
}
```

(See [`examples/cursor.mcp.json`](../examples/cursor.mcp.json) for a copy-paste-ready version.)

4. Save the file. The avots server should appear in the MCP list within a few seconds; if not, restart Cursor.

## Verify

In any Cursor chat:

> Use the avots MCP server to call check_balance.

Cursor should surface the tool call and show your balance.

## Troubleshooting

- **Server stays on "loading…"** → check `npx` works in a terminal outside Cursor (`npx mcp-remote --help`). Cursor inherits the user's PATH; if Node was installed in a non-standard location it may not be visible.
- **401 on every call** → the Bearer token is wrong or revoked. Mint a fresh key.
- **Want a project-local config** → put the same JSON in `<project>/.cursor/mcp.json`; Cursor picks it up automatically.
