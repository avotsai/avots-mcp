# avots-mcp tools reference

The server registers seven tools. The canonical schema lives at `tools/list` on `https://mcp.avots.ai/` - this page is the human-readable mirror, kept in sync by hand. If you need the machine-readable version with full JSON Schema, just call `tools/list` against the server with your Bearer key.

## Free tools (no token cost)

### `check_balance`

Returns the user's current balance, subscription tier, daily-cap status, and a list of available top-up packs.

### `list_models`

Lists every active model on avots with its per-call cost in internal tokens. Accepts an optional `category` filter (`chat` | `image` | `video` | `audio` | `search` | `all`).

### `check_job`

Polls an async generation job (created by `generate_video`) by `job_id`. Returns `status` (`queued` | `running` | `completed` | `failed`), and on completion the result URLs + reconciled `tokens_charged`.

## Paid tools

### `chat`

Send a prompt to any active chat model on avots - useful when the user wants Claude to delegate something to GPT-5, DeepSeek R1, Gemini 3 Pro, Sonar Pro, etc. for a second opinion.

Arguments:

- `prompt` (required) - the user / system prompt.
- `model` - OR model id (e.g. `anthropic/claude-opus-4.7`, `openai/gpt-5.5-pro`, `deepseek/deepseek-r1`, `perplexity/sonar-pro`). Default: `anthropic/claude-sonnet-4.6`.

Cost: ~10-1000 ⚡ depending on model + prompt size.

### `generate_image`

Synchronous image generation. Returns the image both as a native MCP `image` content block (base64) AND as a hosted URL. Blocks 5-30 seconds.

Arguments:

- `prompt` (required) - describe the picture: subject, style, lighting, composition, color palette.
- `model` - one of: `google/gemini-2.5-flash-image` (default - best aspect support), `google/gemini-3-pro-image-preview` (best quality), `google/gemini-3.1-flash-image-preview` (latest), `openai/gpt-5-image-mini` (square only).
- `aspect_ratio` - `1:1` | `16:9` | `9:16` | `4:3` | `3:4`. Default `1:1`.
- `num_images` - 1..4. Default 1.

Cost: ~200-500 ⚡ per image.

> **Display note.** The image ships as a native MCP `image` block - Claude Desktop, Cursor, Cline render it inline natively. On Claude.ai web a markdown image URL would render as a "Show Image" button (cross-origin renderer behaviour) regardless of CORS / Content-Type - so the tool description tells Claude NOT to re-embed the URL in its reply. Just play / view the image from the tool result panel.

### `generate_video`

Async video generation with **two-step confirmation**.

**Step 1 - preview**: call `generate_video` WITHOUT the `confirmed` flag. The server does NOT submit, does NOT reserve any tokens. It returns a preview card with the estimated cost for the selected model plus a sorted list of alternative video models with prices for the same params. Show the list, ask the user which model they want.

**Step 2 - submit**: call `generate_video` again with `confirmed: true` and the chosen `model`. The job is submitted, a `job_id` returned, and tokens reserved. Poll with `check_job` (every 30s for the first 3 min, then every 60s; up to 10 min total).

**On submit error**: NO auto-fallback. The server returns an alternatives card with prices and the provider's error message - the user picks a different model.

Arguments:

- `prompt` (required) - scene description.
- `model` - `orv:*` (OpenRouter Video) or `fal:*` (Fal.ai) family. Defaults to `orv:bytedance/seedance-2.0`. Common picks: `orv:bytedance/seedance-2.0` (cheap, great i2v), `orv:bytedance/seedance-1-5-pro` (cheapest, has audio), `orv:google/veo-3.1` / `orv:google/veo-3.1-fast` (Google), `orv:kwaivgi/kling-v3.0-pro` (premium), `orv:openai/sora-2-pro` (premium), `orv:x-ai/grok-imagine-video`, `fal:fal-ai/veo3` / `/fast`, `fal:fal-ai/kling-video/v2.1/{pro,standard}`.
- `duration` - 1..15 seconds. Default 5.
- `aspect_ratio` - `16:9` | `9:16` | `1:1` | `4:3` | `3:4` | `21:9`. Default `16:9`.
- `resolution` - `480p` | `720p` | `1080p`. Default `720p`.
- `audio` - boolean. Default `false`. Note: this only controls the REQUEST flag. Several models (Kling Pro, Veo 3.x, Sora) generate audio natively whether or not this flag is set; others (Seedance 2.0, Grok Imagine) produce silent video regardless. The server does NOT probe the resulting mp4.
- `image_url` - optional first-frame image (avots-hosted URL or `data:` URI) for image-to-video. Seedance / Veo / Kling auto-swap to their i2v variant when this is set.
- `confirmed` - boolean, default `false`. **Required `true` to submit**; otherwise you get the preview card.

Cost: ~200-5000 ⚡ depending on model + duration + resolution.

### `generate_audio`

Synchronous music / audio generation via ElevenLabs Music, ACE-Step, Stable Audio. Blocks 10-60 seconds.

Arguments:

- `prompt` (required) - music description: genre, mood, instruments, tempo, era, reference artists.
- `model` - model id (audio category from `list_models`). Default `fal:fal-ai/elevenlabs/music`.
- `duration` - 5..180 seconds. Default 30.
- `lyrics` - optional, for vocal generation (ElevenLabs Music supports this).

Cost: ~100-800 ⚡.

## Common patterns

### "List models for this category"

Use `list_models` with the right `category` filter (`chat`, `image`, `video`, `audio`) rather than guessing model ids - it returns the live catalog with prices, so it's always up to date.

### Variable cost preview before video

The two-step `generate_video` flow is exactly this - call without `confirmed`, show the user the preview card, get their pick, call again with `confirmed: true`. Never call with `confirmed: true` on the first attempt without an explicit user OK.

### Refunds

If a tool call fails AFTER reserving tokens (e.g. provider returns `AccountOverdueError`), the server refunds the reserve back to the user's balance and resets the message cost to 0 so the daily USD cap is unaffected. No manual intervention needed.
