# Claude.ai web (Customize → Connectors)

Claude.ai web supports remote MCP servers natively via the OAuth 2.0 "Connect" flow. No token copy-paste - just paste the URL, click Connect, sign in to avots in the popup, and Claude.ai stores the token for you.

## Setup (OAuth, recommended)

1. Open Claude.ai → click your avatar → **Customize**.
2. Open the **Connectors** tab, click the **`+`** button, choose **Add custom connector**.
3. Fill in:
   - **Name**: `avots`
   - **Remote MCP server URL**: `https://mcp.avots.ai/`
   - Leave the OAuth fields empty.
4. Click **Add**.
5. On the connector card click **Connect**. A popup opens - sign in to your avots account, click **Allow**, and Claude.ai stores the token automatically.

Each Claude.ai client gets its own internal key (visible in [Settings → Integrations](https://app.avots.ai/#/settings/integrations) as `oauth:…`). Revoke any time - Claude.ai will prompt you to reconnect on next use.

## Verify

Inside any Claude.ai conversation:

> List the avots tools and call check_balance.

You should see Claude call `check_balance` and report your current token balance.

## Alternative - manual `?t=KEY` URL

If you can't get OAuth to complete for any reason (corporate proxy stripping headers, browser extensions interfering with popup flows, etc.) there's a fallback that embeds the key directly in the URL:

1. Open [Settings → Integrations](https://app.avots.ai/#/settings/integrations) on avots and mint a new MCP key. Copy the full `av_mcp_<48hex>` value while it's still on screen (it's shown once).
2. Open Claude.ai → avatar → **Customize** → **Connectors** → **`+`** → **Add custom connector**.
3. Fill in:
   - **Name**: `avots`
   - **Remote MCP server URL**: `https://mcp.avots.ai/?t=av_mcp_YOUR_KEY_HERE`
   - Leave OAuth fields empty.
4. Click **Add**. The connector card shows a green dot once Claude.ai successfully calls `tools/list` - no separate Connect click needed.

The key is read from `?t=...` and treated as a Bearer token. Revoke from Settings → Integrations any time.

## Troubleshooting

- **OAuth popup closes immediately or loops** → make sure popups are not blocked for `claude.ai` and `mcp.avots.ai` in your browser. If it still fails, use the manual `?t=KEY` URL above.
- **Server returns 401** → key revoked or wrong format. Mint a fresh one.
- **Tools show up but every call returns "Daily spend limit reached"** → you have a daily USD cap set in Settings → Billing; raise it or wait until UTC midnight.
- **`generate_image` returns a "Show Image" button instead of an inline preview** → known Claude.ai web behaviour for cross-origin image URLs in markdown. The image IS attached as a native MCP `image` block (Claude Desktop / Cursor / Cline inline it natively); on the web, click "Show Image" to view.
