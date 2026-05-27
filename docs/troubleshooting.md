# Troubleshooting

Cross-client issues collected in one place. For client-specific setup gotchas see the per-client guide ([Claude.ai web](claude-web.md), [Claude Desktop](claude-desktop.md), [Claude Code](claude-code.md), [Cursor](cursor.md), [Cline](cline.md)).

## Authentication

### 401 Unauthorized on every call

The Bearer token is missing, revoked, or malformed.

1. Confirm the token starts with `av_mcp_` and is followed by 48 hex characters.
2. Open [Settings → Integrations](https://app.avots.ai/#/settings/integrations) and check the key isn't revoked.
3. Mint a fresh key and update your client config. Keys are shown **once** — if you lost the value, revoke and mint again, you can't read it back.

### 401 on Claude.ai web after the OAuth popup closes successfully

There's a known [Claude.ai-side regression](https://github.com/anthropics/claude-ai-mcp/issues) (~March 2026) where the OAuth flow completes, the token is minted, but Claude.ai never sends a Bearer-authenticated request. Workaround: use the manual `?t=av_mcp_KEY` URL — see [claude-web.md § manual URL](claude-web.md#alternative--manual-tkey-url).

### Tools list works, but every call returns "Daily spend limit reached"

You have a daily USD cap set in Settings → Billing. Either raise it or wait until UTC midnight when the counter resets. The cap is enforced on every paid tool call before any model is dispatched.

## Cost / billing

### "Insufficient balance" but I just topped up

Top-ups are reconciled by an hourly cron on the server. If you just paid and the balance hasn't moved, wait up to one hour. If it still hasn't credited, contact [hello@avots.ai](mailto:hello@avots.ai) with the Stripe receipt ID.

### Tool failed but tokens were deducted

If a tool call fails *after* reserving tokens (e.g. the provider returns an upstream error), the server automatically refunds the reserve and resets the message cost to 0 — the daily USD cap is unaffected. The refund usually shows up within a few seconds. If after a minute you see a permanent deduction with no successful result, that's a bug worth reporting.

### `generate_video` says "submit error" and lists alternatives

By design. The server **does not auto-fallback** to a different model — you'd silently get billed for a pricier alternative. Instead it returns the alternatives card so you (or your client) can pick a substitute and re-call with `confirmed: true`. See [tools.md § generate_video](tools.md#generate_video).

## Two-step video flow

### My client submitted the video on the first call without asking

The client invoked `generate_video` with `confirmed: true` straight away. The intended flow is:

1. First call **without** `confirmed` → returns a preview card (cost + alternatives), no submit, no reserve.
2. Show the card to the user, get their pick.
3. Second call with `confirmed: true` + chosen `model` → actually submits.

If your client skips step 1, that's a client behaviour problem. For Claude.ai and Claude Code, just ask the model `"don't submit yet — show me the preview first."` in your prompt. The tool description tells the model to ask before submitting, but explicit instruction wins.

### Long video gen — when do I poll `check_job`?

Recommended cadence: every 30 seconds for the first 3 minutes, then every 60 seconds, up to 10 minutes total. Veo Fast / Seedance return in 1-3 min; Veo 3.1 / Kling Pro / Sora 2 Pro typically 3-8 min.

If `status` is still `running` after 10 min, something's wrong on the provider side — open the job in your avots web dashboard for the full error log.

## Image rendering

### Image shows up as a "Show Image" button instead of inline (Claude.ai web)

Known Claude.ai web cross-origin renderer behaviour for any image URL embedded in markdown, regardless of CORS / Content-Type headers. The image **is** attached as a native MCP `image` content block — Claude Desktop / Cursor / Cline render it inline natively. On the web, click "Show Image" to view it, or download the URL from the tool result panel.

### Image looks correct but Claude re-embeds the URL in its reply text

The tool description asks Claude *not* to do that. If it keeps happening, add `"don't re-embed the image URL in your reply text — I'll view it from the tool panel"` to your prompt.

## Rate limits & quotas

### 429 Too Many Requests

You hit the per-key rate limit. The body usually includes a `retry_after` hint. Two common causes:

- A loop in your client that retries failed calls without backoff. Add jitter.
- A burst of parallel video submissions over your plan's parallel-job cap.

Plan caps and per-tool limits are in your Settings page. Raise plan or wait for the window.

### Parallel video cap blocked my batch

Each plan has a maximum number of concurrent video jobs (Free: 1, Standard: 3, Pro: 8, VIP: 16 at the time of writing). Jobs over the cap return an error rather than queueing. Submit in batches matching your cap, or upgrade the plan.

## Connectivity (stdio bridge clients)

### `npx mcp-remote` not found / server stays on "loading…" (Claude Desktop / Cursor / Cline)

`npx` isn't on the PATH that the desktop app inherits. macOS apps launched from Finder don't read `~/.zshrc` or `~/.bash_profile` — only `launchd`'s PATH.

Fixes, in order of preference:

1. Install Node system-wide via Homebrew: `brew install node`. Restart the client app fully (quit + reopen).
2. Use an absolute path in the config: replace `"command": "npx"` with `"command": "/opt/homebrew/bin/npx"` (or wherever `which npx` reports).
3. As a last resort, set a `"PATH"` env var in the MCP server entry:
   ```json
   "env": { "PATH": "/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin" }
   ```

### Server appears to connect, then drops a few seconds later

Almost always the `mcp-remote` bridge process is being killed by macOS sandboxing or by the host app's process supervisor. Update `mcp-remote` (`npx mcp-remote@latest --help`) and the host app to the latest version. If it persists with Claude Desktop, switch to Claude Code (no bridge needed, native HTTP MCP).

## "It connected but no tools appear"

1. Re-open the MCP panel in your client — there's often a 1-2 second delay between connect and tool enumeration.
2. Confirm `tools/list` works by calling the server directly with curl:
   ```sh
   curl -X POST https://mcp.avots.ai/ \
     -H "Authorization: Bearer av_mcp_YOUR_KEY_HERE" \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
   ```
   You should get a JSON-RPC response with all seven tools. If curl works but your client doesn't see them, the issue is on the client side.
3. Fully quit + reopen the host app. A window reload is not enough for Claude Desktop / Cursor / Cline.

## When to ask for help

If you've checked the above and the issue persists:

- Open an issue at [github.com/avotsai/avots-mcp/issues](https://github.com/avotsai/avots-mcp/issues) with: client name + version, redacted config, exact error text, and the timestamp (UTC) of the failing call so support can grep server logs.
- Or write to [hello@avots.ai](mailto:hello@avots.ai).
- For account / billing questions, the Telegram bot [@AvotsAIbot](https://t.me/AvotsAIbot) is the fastest channel.
