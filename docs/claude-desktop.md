# Claude Desktop

Claude Desktop only supports local (stdio) MCP servers, so we use the [`mcp-remote`](https://www.npmjs.com/package/mcp-remote) bridge to expose `mcp.avots.ai` over stdio. **Requires Node.js installed** (for `npx`).

## Setup

1. Mint a key at [Settings → Integrations](https://app.avots.ai/#/settings/integrations) on avots - copy the `av_mcp_<48hex>` value while it's on screen.
2. Open your `claude_desktop_config.json`:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
3. Add the `avots` entry under `mcpServers` (create the file if it doesn't exist):

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

(See [`examples/claude-desktop.json`](../examples/claude-desktop.json) for a copy-paste-ready version.)

4. Save the file and **fully restart Claude Desktop** (quit + reopen - a window reload is not enough).
5. The avots tools should appear in the tools menu (hammer icon at the bottom of the chat input).

## Verify

In any conversation:

> Call check_balance from the avots server.

Claude Desktop will surface the tool call inline and show your current token balance.

## Troubleshooting

- **No tools appear** → check the file path is correct for your OS, the JSON is valid (a trailing comma will silently break it), and you fully quit + reopened Claude Desktop.
- **`mcp-remote` not found** → make sure Node.js is installed and `npx` is on PATH. Test in a terminal: `npx mcp-remote --help`.
- **Tools appear but every call errors "Unauthorized"** → the token in the `--header` line is wrong or revoked. Mint a fresh key and update the config.
- **Inline image embed not working** → Claude Desktop should inline base64 image content blocks natively. If you see only "[image: …]" placeholders, update Claude Desktop to the latest version.
