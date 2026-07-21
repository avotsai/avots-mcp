# avots-mcp tools reference

The server registers **19 tools**. The canonical schema lives at `tools/list` on `https://mcp.avots.ai/` - this page is the human-readable mirror, kept in sync by hand. If you need the machine-readable version with full JSON Schema, just call `tools/list` against the server with your Bearer key.

Many paid tools use a **two-step confirmation flow**: the first call (without `confirmed`) is a free preview that returns the exact cost and submits nothing; the second call with `confirmed: true` actually submits and reserves tokens. Tools that follow this flow are marked "two-step" below.

## Free tools (no token cost)

### `check_balance`

Returns the user's current balance, subscription tier, daily-cap status, and the full pricing catalog (welcome pack if eligible + all monthly subscriptions), each with an auto-login checkout URL. This is the single source of truth for avots pricing - there is no public pricing page to scrape.

### `list_models`

Lists every active model on avots with its per-call cost in internal tokens. Accepts an optional `category` filter (`chat` | `image` | `video` | `audio` | `search` | `all`). Each entry carries an `input_spec` describing what the model accepts (e.g. max reference images / videos).

### `list_avatars`

Lists the user's saved avatars - reusable face identities (the visual equivalent of cloned voices). Returns `[{id, name, image, voice}]`. Pass an avatar's name to `generate_talking_avatar`, or `avatar:<id|name>` as a face URL in `face_swap_video` / `recreate_trend`, to reuse the exact same face every time.

### `list_trends`

Browse the avots Studio trend catalog - curated viral templates: face-swap videos and images, ads, animations, surprise scenes. Entries with `swappable: true` can be recreated with the user's own face via `recreate_trend`. Returns id, category, description, preview URL and the catalog cost.

Arguments: `category` (`image` | `video` | `all`), `limit` (1..60, default 30).

### `check_job`

Polls an async generation job by `job_id`. Returns `status` (`queued` | `running` | `completed` | `failed`), and on completion the result URLs + reconciled `tokens_charged`. Poll every 30s for the first 3 minutes, then every 60s, up to 10 minutes - provider queues can legitimately hold a job 5+ minutes during peak hours.

## Chat

### `chat`

Send a prompt to any active chat model on avots - useful when the user wants Claude to delegate something to GPT-5, DeepSeek R1, Gemini 3 Pro, Sonar Pro, etc. for a second opinion.

Arguments:

- `prompt` (required) - the user / system prompt.
- `model` - OR model id (e.g. `anthropic/claude-opus-4.8`, `openai/gpt-5.5-pro`, `deepseek/deepseek-r1`, `perplexity/sonar-pro`). Default: `anthropic/claude-sonnet-4.6`.

Cost: ~10-1000 ⚡ depending on model + prompt size.

## Images

### `generate_image`

Synchronous image generation - OR photo **editing** when `image_urls` is provided. Returns the image both as a native MCP `image` content block (base64) AND as a hosted URL. Blocks 5-60 seconds.

Arguments:

- `prompt` (required) - describe the picture: subject, style, lighting, composition, color palette. In edit mode: what to change.
- `model` - one of: `google/gemini-3.1-flash-image` (default - Nano Banana, fast + reliable aspect), `google/gemini-3-pro-image-preview` (max quality photoreal), `google/gemini-3.1-flash-image-preview`, `openai/gpt-5-image-mini` (square only), `fal:fal-ai/flux-pro/v1.1` (photoreal + detail), `fal:fal-ai/flux/dev` (cheap FLUX), `fal:fal-ai/ideogram/v3` (best text-in-image typography), `fal:fal-ai/recraft-v3` (vector / logo / poster).
- `aspect_ratio` - `1:1` | `16:9` | `9:16` | `4:3` | `3:4`. Default `1:1`.
- `num_images` - 1..4. Default 1.
- `image_urls` - EDIT MODE: 1-4 source photo(s) to edit / restyle per the prompt (change background, outfit, style, merge subjects). Each entry: external `https://` URL, `data:` URI, or an avots `/v1/files/<uuid>` URL. Editing runs on the Nano Banana family; a non-Google model choice is auto-swapped.
- `format` - `png` (default) or `svg`. **`svg` works only with `fal:fal-ai/recraft-v3`** and returns a real vector SVG file (infinitely scalable - logos, icons, flat illustrations). Costs 2x the raster price and ships as a hosted URL only (no inline base64 preview).

Cost: ~200-500 ⚡ per image (SVG: 2x).

> **Display note.** The image ships as a native MCP `image` block - Claude Desktop, Cursor, Cline render it inline natively. On Claude.ai web a markdown image URL would render as a "Show Image" button regardless of CORS / Content-Type - so the tool description tells Claude NOT to re-embed the URL in its reply. Just view the image from the tool result panel.

## Video

### `generate_video`

Async video generation, **two-step**. Call without `confirmed` for a preview card (estimated cost + a sorted list of alternative video models with prices), then again with `confirmed: true` and the chosen `model` to submit. Poll with `check_job`. On submit error there is NO auto-fallback - the server returns the alternatives card and the user picks.

Arguments:

- `prompt` (required) - scene description: subject, action, camera movement, lighting, style.
- `model` - `orv:*` (OpenRouter Video) or `fal:*` (Fal.ai). Default `orv:bytedance/seedance-2.0` (cheap, great i2v character consistency). Common picks: `orv:bytedance/seedance-1-5-pro` (cheapest with audio), `orv:google/veo-3.1` / `-fast`, `orv:kwaivgi/kling-v3.0-pro`, `orv:openai/sora-2-pro`, `orv:x-ai/grok-imagine-video`, `fal:fal-ai/veo3` / `/fast`, `fal:fal-ai/kling-video/v2.1/{standard|pro}`, `fal:google/gemini-omni-flash` (t2v WITH synchronized audio + dialogue; `/image-to-video` for photo → talking video).
- `duration` - 1..15 seconds. Default 5.
- `aspect_ratio` - `16:9` | `9:16` | `1:1` | `4:3` | `3:4` | `21:9`. Default `16:9`.
- `resolution` - `480p` | `720p` | `1080p`. Default `720p`.
- `audio` - boolean request flag. Some models (Kling v3 Pro, Veo 3.x, Sora) produce audio natively regardless; others (Seedance 2.0, Grok Imagine) stay silent regardless.
- `image_url` - optional first-frame image for image-to-video (i2v auto-swap).
- `image_urls` - MULTIPLE reference photos, only for reference-capable models: `fal:fal-ai/kling-video/v3/pro/image-to-video` takes up to 4 photos of one character (identity preserved), Seedance reference-to-video models take up to 9. Check `list_models` → `input_spec.images.max`.
- `video_urls` - MOTION-reference clips ("repeat the movement from this video"), only for reference-capable models (Kling v3 pro i2v: 1 clip ≤ 15s; Seedance r2v: up to 3, ≤ 15s total).
- `confirmed` - required `true` to submit.

Cost: ~200-5000 ⚡ depending on model + duration + resolution.

### `face_swap_video`

Swap the face in a target video with a face from a photo, keeping the original motion + scene (fal pixverse). Async, **two-step**. The face photo must be a head-and-shoulders portrait - a full-body source drags clothing into the result. Accepts `avatar:<id|name>` to reuse a saved avatar.

Arguments: `target_video_url` (required), `face_image_url` (required), `confirmed`.

Cost: per second of the target clip, roughly 500-2000 ⚡.

### `edit_video`

Edit an existing video with plain-text instructions (Gemini Omni Flash Edit): change background, style, objects or scene - while the person, their motion, lip-sync and the ORIGINAL AUDIO stay untouched. Async, **two-step** (the preview measures the clip and returns the exact cost). Billed per second (~450 ⚡/sec); inputs longer than 30s are trimmed.

Arguments: `video_url` (required), `prompt` (required), `confirmed`.

This is different from `face_swap_video` (replaces the FACE) and `lipsync_video` (changes WHAT IS SAID) - `edit_video` changes the SCENE.

### `lipsync_video`

Re-sync the lips in an existing talking video to NEW speech - dubbing / re-voicing (fal sync-lipsync). Async, **two-step**. Two input modes: `text` (server voices it with ElevenLabs TTS, auto-detects language incl. Russian, pick a `voice` preset) OR `audio_url` (ready track). Source clip: front-facing talking head, max 20 seconds.

Arguments: `video_url` (required), `text` OR `audio_url`, `voice`, `confirmed`.

Cost: typically 300-600 ⚡.

## Avatars and talking heads

### `create_avatar`

Save a reusable avatar (face identity) for use across talking-avatar and face-swap calls. Provide `name` plus EITHER `image_url` (ready portrait - free, stored + face-checked) OR `portrait_prompt` (server generates the portrait, ~200-500 ⚡, **two-step**). Optional `voice` sets the avatar's default cloned voice. Limit 20 per account.

### `generate_talking_avatar`

Make a short video of a portrait speaking the user's exact text: portrait (generated from `portrait_prompt` or reused via `avatar`), ElevenLabs TTS (auto-detects language incl. Russian), lip-sync. Async, **two-step**. `tier`: `quality` (OmniHuman HD, slower, default) or `fast` (~1-2 min). Voice presets: Aria, Sarah, Charlotte, Matilda (female), Roger, George, Charlie, Brian (male), or the user's own cloned voice by name.

Arguments: `text` (required, up to ~500 chars ≈ 30s), `avatar` OR `portrait_prompt`, `voice`, `tier`, `style`, `confirmed`.

Cost: typically 600-2500 ⚡ depending on tier + text length.

### `generate_vlog`

Short VERTICAL talking-head vlog for Shorts / TikTok / Reels: the server writes a punchy spoken line from your `topic` and renders a character speaking it with native synced audio (HappyHorse 1.0). Async, **two-step**. Character: `character` (text description, portrait generated) or `character_url` (photo to animate).

Arguments: `topic` (required), `character` OR `character_url`, `duration` (3-15s), `resolution` (`720p` | `1080p`), `aspect` (`9:16` default | `1:1` | `16:9`), `confirmed`.

Different from `generate_talking_avatar`: the vlog writes its own script from a topic; the talking avatar reads your exact text.

## Audio

### `generate_audio`

Music OR spoken narration (fal models only). Async - returns a `job_id`, poll `check_job` (usually 10-120s). Returns hosted MP3/WAV URLs.

Arguments:

- `prompt` (required) - music: genre, mood, instruments, tempo, era. TTS: the EXACT words to speak, read verbatim.
- `model` - music: `fal:fal-ai/elevenlabs/music` (default, vocal + instrumental), `fal:fal-ai/musicgen`, `fal:fal-ai/stable-audio-25/text-to-audio`, `fal:fal-ai/ace-step`. Spoken voice / TTS: `fal:fal-ai/elevenlabs/tts/turbo-v2.5`.
- `duration` - 5..180 seconds. Default 30.
- `lyrics` - optional, for vocal generation.
- `voice` - TTS only: a preset (Aria, Sarah, Charlotte, Matilda, Roger, George, Charlie, Brian) or the user's own cloned voice by name. Default Aria.

Cost: ~50-800 ⚡. Avoid brand terms ("Pixar", "Disney") in music prompts - ElevenLabs rejects them.

## Studio

### `create_montage`

Slideshow video reel from 4-25 photos: Ken Burns zoom/pan + crossfades + optional music. Local render, flat ~200 ⚡. Async, usually under a minute.

Arguments: `image_urls` (required, 4-25, order preserved), `music` (`upbeat` | `chill` | `epic` | `none`), `aspect` (`9:16` default | `1:1` | `16:9`).

### `create_travel_poster`

Turn a face photo into a vintage travel poster: the person on a giant 3D map of a chosen country with its landmarks, passport, stamps and the country name in big serif caps. SYNCHRONOUS - returns the hosted image URL directly. 24 curated countries render best, but any country name works. Animate the result by passing its URL to `generate_video`.

Arguments: `image_url` (required), `country` (required), `aspect` (`3:4` default | `9:16` | `1:1` | `16:9`).

Cost: ~200-500 ⚡.

### `recreate_trend`

Put the user into a trend from `list_trends`: their face replaces the face in the trend's demo, scene + motion preserved (only trends with `swappable: true`). Image trends are synchronous (~15-30s); video trends are async and **two-step**.

Arguments: `trend_id` (required), `face_image_url` (required; accepts `avatar:<id|name>`), `confirmed` (video trends only).

## Utility

### `create_calendar_event`

Schedule a calendar event from natural language ("meeting tomorrow at 12 with Igor"). ~5 ⚡ for the LLM extraction. Lands directly in the user's linked Apple / Google calendar; otherwise returns an `.ics` file (base64) to offer as a download. Pass `timezone` (IANA) when known.

Arguments: `description` (required), `timezone`.

## Common patterns

### "List models for this category"

Use `list_models` with the right `category` filter (`chat`, `image`, `video`, `audio`) rather than guessing model ids - it returns the live catalog with prices, so it's always up to date.

### Cost preview before expensive jobs

Every expensive tool is two-step: call without `confirmed`, show the user the preview card, get their pick, call again with `confirmed: true`. Never call with `confirmed: true` on the first attempt without an explicit user OK.

### Reusable faces

Save an avatar once (`create_avatar`), then reference it everywhere: `avatar` in `generate_talking_avatar`, `avatar:<name>` in `face_swap_video.face_image_url` and `recreate_trend.face_image_url`. Same face, zero drift between videos.

### Refunds

If a tool call fails AFTER reserving tokens (e.g. provider returns `AccountOverdueError`), the server refunds the reserve back to the user's balance and resets the message cost to 0 so the daily USD cap is unaffected. No manual intervention needed.
