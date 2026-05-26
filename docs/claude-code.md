# Claude Code (CLI)

Claude Code supports remote MCP servers over Streamable HTTP directly - no `mcp-remote` bridge needed.

## Setup

1. Mint a key at [Settings → Integrations](https://app.avots.ai/#/settings/integrations) on avots - copy the `av_mcp_<48hex>` value while it's on screen.
2. Run this single command in any terminal:

```sh
claude mcp add --transport http avots https://mcp.avots.ai/ \
  --header "Authorization: Bearer av_mcp_YOUR_KEY_HERE"
```

That's it - Claude Code stores the entry in its global MCP config and connects on the next session.

## Verify

Inside a Claude Code session, type:

```
/mcp
```

You should see `avots` listed with status `✔ connected`. Then ask Claude:

> Call check_balance.

## Troubleshooting

- **`avots` shows as disconnected** → the Bearer token is wrong or revoked. Re-run `claude mcp add` with a fresh key (it overwrites the existing entry).
- **`/mcp` doesn't list avots at all** → make sure you're running Claude Code, not Claude Desktop. They're separate products with separate configs.
- **You want a per-project config** → use `claude mcp add --scope project` (default is `--scope user`).
