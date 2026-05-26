# Cline (VS Code extension)

Cline's MCP support uses the same stdio shape as Claude Desktop and Cursor, so we use the [`mcp-remote`](https://www.npmjs.com/package/mcp-remote) bridge to expose `mcp.avots.ai`. **Requires Node.js installed** (for `npx`).

## Setup

1. Mint a key at [Settings → Integrations](https://app.avots.ai/#/settings/integrations) on avots - copy the `av_mcp_<48hex>` value while it's on screen.
2. Open VS Code → Cline sidebar → **`⚙` icon (top right) → MCP Servers**.
3. Click **Edit MCP Settings**. Cline opens its config JSON. Add:

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

(See [`examples/cline.json`](../examples/cline.json) for a copy-paste-ready version.)

4. Save. Cline reconnects automatically and the avots tools appear in the MCP Servers panel.

## Verify

In a Cline chat:

> Call check_balance via the avots MCP server.

Cline will surface the tool call inline and show your balance.

## Troubleshooting

- **Cline can't find `npx`** → VS Code on macOS sometimes doesn't pick up Node from `~/.zshrc` / `~/.bash_profile`. Either install Node system-wide via Homebrew (`brew install node`) or add a `"PATH"` env override in the MCP entry.
- **401 errors** → key revoked or wrong. Re-mint.
- **The "avots" entry shows red** → click it in the MCP Servers panel to see the connection error. Most often it's PATH-related (see above).
