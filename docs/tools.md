# avots-mcp tools reference

The server registers nineteen tools. The canonical schema lives at `tools/list` on `https://mcp.avots.ai/` - this page is the human-readable mirror, kept in sync by hand. If you need the machine-readable version with full JSON Schema, just call `tools/list` against the server with your Bearer key.

## Free tools (no token cost)

### `check_balance`

Returns the user's current balance, subscription tier, daily-cap status, and a list of available top-up packs.

### `list_models`

Lists every active model on avots with its per-call cost in internal tokens. Accepts an optional `category` filter (`chat` | `image` | `video` | `audio` | `search` | `all`).

### `check_job`

Polls an async generation job (created by `generate_video`, `face_swap_video`, `generate_talking_avatar`, `lipsync_video`, `generate_vlog`, `create_montage`, or a video `recreate_trend`) by `job_id`. Returns `status` (`queued` | `running` | `completed` | `failed`), and on completion the result URLs + reconciled `tokens_charged`.

### `list_avatars`

Lists the user's saved avatars (reusable faces) by name and id, for use with `generate_talking_avatar` / `generate_vlog`. Free.

### `list_trends`

Browses the avots Studio **trend catalog** (the "Творчество" showcase): curated viral templates - face-swap videos and images, ads, animations, surprise scenes. Entries with `swappable: true` are face-swap trends the user can star in with their own photo via `recreate_trend`. Accepts `category` (`image` | `video` | `all`) and `limit` (1..60). Returns id, category, short description, preview URL and catalog cost. Free.

## Paid tools

### `chat`

Send a prompt to any active chat model on avots - useful when the user wants Claude to delegate something to GPT-5, DeepSeek R1, Gemini 3 Pro, Sonar Pro, etc. for a second opinion.

Arguments:

- `prompt` (required) - the user / system prompt.
- `model` - OR model id (e.g. `anthropic/claude-opus-4.8`, `openai/gpt-5.5-pro`, `deepseek/deepseek-r1`, `perplexity/sonar-pro`). Default: `anthropic/claude-sonnet-4.6`.

Cost: ~10-1000 ⚡ depending on model + prompt size.

### `generate_image`

Synchronous image generation - **or photo editing** when `image_urls` is provided (restyle, change background/outfit, merge subjects; runs on the Nano Banana editor family). Returns the image both as a native MCP `image` content block (base64) AND as a hosted URL. Blocks 5-30 seconds.

Arguments:

- `prompt` (required) - describe the picture: subject, style, lighting, composition, color palette.
- `model` - one of: `google/gemini-2.5-flash-image` (default - best aspect support), `google/gemini-3-pro-image-preview` (best quality), `google/gemini-3.1-flash-image-preview` (latest), `openai/gpt-5-image-mini` (square only).
- `aspect_ratio` - `1:1` | `16:9` | `9:16` | `4:3` | `3:4`. Default `1:1`.
- `num_images` - 1..4. Default 1. Ignored in edit mode (always 1).
- `image_urls` - **edit mode**: 1-4 source photos to edit per the prompt. Each entry: external `https://` URL, `data:` URI, or an avots `/v1/files/<uuid>` URL of the user's uploaded photo. Only `google/*-image` models can edit - any other model choice is auto-swapped to `google/gemini-2.5-flash-image`. The source photo's aspect ratio is preserved unless `aspect_ratio` is set explicitly.

Cost: ~200-500 ⚡ per image.

> **Display note.** The image ships as a native MCP `image` block - Claude Desktop, Cursor, Cline render it inline natively. On Claude.ai web a markdown image URL would render as a "Show Image" button (cross-origin renderer behaviour) regardless of CORS / Content-Type - so the tool description tells Claude NOT to re-embed the URL in its reply. Just play / view the image from the tool result panel.

### `generate_video`

Async video generation with **two-step confirmation**.

**Step 1 - preview**: call `generate_video` WITHOUT the `confirmed` flag. The server does NOT submit, does NOT reserve any tokens. It returns a preview card with the estimated cost for the selected model plus a sorted list of alternative video models with prices for the same params. Show the list, ask the user which model they want.

**Step 2 - submit**: call `generate_video` again with `confirmed: true` and the chosen `model`. The job is submitted, a `job_id` returned, and tokens reserved. Poll with `check_job` (every 30s for the first 3 min, then every 60s; up to 10 min total).

**On submit error**: NO auto-fallback. The server returns an alternatives card with prices and the provider's error message - the user picks a different model.

Arguments:

- `prompt` (required) - scene description.
- `model` - `orv:*` (OpenRouter Video) or `fal:*` (Fal.ai) family. Defaults to `orv:bytedance/seedance-2.0`. Common picks: `orv:bytedance/seedance-2.0` (cheap, great i2v), `orv:bytedance/seedance-1-5-pro` (cheapest, has audio), `orv:google/veo-3.1` / `orv:google/veo-3.1-fast` (Google), `orv:kwaivgi/kling-v3.0-pro` (premium), `orv:openai/sora-2-pro` (premium), `orv:x-ai/grok-imagine-video`, `fal:fal-ai/veo3` / `/fast`, `fal:fal-ai/kling-video/v2.1/{pro,standard}`, `fal:google/gemini-omni-flash` (text to video WITH synchronized audio and dialogue), `fal:google/gemini-omni-flash/image-to-video` (photo to video WITH sound/speech).
- `duration` - 1..15 seconds. Default 5.
- `aspect_ratio` - `16:9` | `9:16` | `1:1` | `4:3` | `3:4` | `21:9`. Default `16:9`.
- `resolution` - `480p` | `720p` | `1080p`. Default `720p`.
- `audio` - boolean. Default `false`. Note: this only controls the REQUEST flag. Several models (Kling Pro, Veo 3.x, Sora) generate audio natively whether or not this flag is set; others (Seedance 2.0, Grok Imagine) produce silent video regardless. The server does NOT probe the resulting mp4.
- `image_url` - optional first-frame image (avots-hosted URL or `data:` URI) for image-to-video. Seedance / Veo / Kling auto-swap to their i2v variant when this is set.
- `image_urls` - **multiple reference photos**, only for models that accept several images: `fal:fal-ai/kling-video/v3/pro/image-to-video` takes up to 4 photos of ONE character (identity preserved), Seedance reference-to-video models take up to 9. Per-model limits: `list_models` → `input_spec.images.max`. For a slideshow out of many photos use `create_montage` instead.
- `video_urls` - **motion-reference videos** ("repeat the movement from this clip"): Kling Elements takes 1 (≤15s), Seedance reference-to-video up to 3 (≤15s total). Check `input_spec.videos.max`. Not for editing an existing clip - that is `face_swap_video` / `lipsync_video`.
- `confirmed` - boolean, default `false`. **Required `true` to submit**; otherwise you get the preview card.

Cost: ~200-5000 ⚡ depending on model + duration + resolution.

### `face_swap_video`

Async face swap: replace the face in a **target video** with a face from a **source photo**, keeping the original motion and scene (powered by `fal-ai/pixverse`). Same **two-step confirmation** as `generate_video` (preview without `confirmed`, submit with `confirmed: true`). Returns a `job_id` - poll `check_job` until `completed`.

Arguments:

- `target_video_url` (required) - the video whose face is replaced. External `https://` URL or an avots-hosted `/v1/files/<uuid>` URL.
- `face_image_url` (required) - the source face photo (a close-up head-and-shoulders portrait works best). External URL or avots-hosted.
- `confirmed` - boolean, default `false`. Required `true` to submit; otherwise you get the cost preview.

Cost: ~500-2000 ⚡ (per second of the target clip).

### `edit_video`

**Edit an existing video with plain text** (Google Gemini Omni Flash Edit): change the background, style, objects or the whole scene - while the person, their motion, lip sync and the ORIGINAL AUDIO stay untouched. Async with the **two-step confirmation**: the preview call measures the real clip duration and quotes the exact cost; `confirmed: true` submits. Poll `check_job` (typically 1-4 min). Billed per second (~450 tokens/sec); clips longer than 30s are trimmed to the first 30s.

Arguments:

- `video_url` (required) - external `https://` URL or an avots-hosted `/v1/files/<uuid>` URL.
- `prompt` (required) - what to change, in any language. The person and speech are preserved automatically.
- `confirmed` - boolean; `true` to submit, omit for the duration + cost preview.

Different from `face_swap_video` (replaces the FACE) and `lipsync_video` (changes WHAT IS SAID): `edit_video` changes the SCENE and keeps the person and their voice.

### `generate_talking_avatar`

Make a short video of a **portrait speaking your text**. The server generates a front-facing portrait from your description, turns the text into speech (ElevenLabs TTS, auto-detects language incl. Russian), and lip-syncs the face. Async - returns a `job_id`; poll `check_job` (lip-sync is slow: HD / OmniHuman can take several minutes; the fast tier ~1-2 min).

Arguments:

- `portrait_prompt` (required) - what the avatar looks like, a real human face, e.g. "a young woman with brown hair and blue eyes, warm smile".
- `text` (required) - the exact words to say, read verbatim (no stage directions). Up to ~500 chars (~30s).
- `voice` - a preset (Aria, Sarah, Charlotte, Matilda / Roger, George, Charlie, Brian) or the user's own cloned voice by name. Default Aria. The cost preview (`confirmed: false`) lists the user's cloned voice names.
- `tier` - `quality` (OmniHuman, HD, most realistic, slower; default) or `fast` (SadTalker, 256p, ~1-2 min).
- `style` - optional portrait style: `photo` (default), `cinema`, `3d`, `anime`.
- `confirmed` - boolean. Must be `true` to submit; omit/false for a cost-only preview.

Cost: varies (portrait + TTS + lip-sync); see the preview card.

### `generate_audio`

Generate **music** OR **spoken voice / TTS** (`fal:*` models only). Async - returns a `job_id`; poll `check_job` until `completed` (usually 10-120s).

- **Music**: `fal:fal-ai/elevenlabs/music` (default, vocal + instrumental), `fal:fal-ai/musicgen`, `fal:fal-ai/stable-audio-25/text-to-audio`, `fal:fal-ai/ace-step`. Avoid brand / copyright terms (e.g. "Pixar", "Disney") - ElevenLabs Music rejects them with 422.
- **Spoken voice / narration**: model `fal:fal-ai/elevenlabs/tts/turbo-v2.5`, put the exact words in `prompt` (verbatim, no stage directions), auto-detects language incl. Russian.

Arguments:

- `prompt` (required) - music description, or the exact text to speak (TTS).
- `model` - audio model id from `list_models`. Default `fal:fal-ai/elevenlabs/music`.
- `duration` - 5..180 seconds. Default 30 (music).
- `lyrics` - optional lyrics for vocal music.
- `voice` - **TTS only**: a preset (Aria, Sarah, Charlotte, Matilda / Roger, George, Charlie, Brian) or the user's own cloned voice by name. Default Aria. Ignored by music models.

Cost: ~100-800 ⚡.

### `create_avatar`

Save a face as a **reusable avatar** so later tools can reference it by name. Provide a ready portrait via `image_url` (FREE - the face is stored + validated) OR a `portrait_prompt` to generate one (costs image tokens). Returns the avatar `id` + `name`.

Arguments:

- `name` (required) - a short label, e.g. "Artur".
- `image_url` - public https:// or avots-hosted `/v1/files/<uuid>` URL of a ready front-facing portrait of ONE person. Provide this OR `portrait_prompt`.
- `portrait_prompt` - text description to generate the face instead (e.g. "a young woman with brown hair, warm smile").

Cost: FREE with `image_url`; ~200-500 ⚡ with `portrait_prompt`.

### `generate_vlog`

Create a short **vertical talking-head vlog** for Shorts / TikTok / Reels - a character speaks a punchy line about a topic with native synced audio + lip-sync (powered by HappyHorse 1.0). Async - returns a `job_id`; poll `check_job` (usually 1-3 min). **Two-step confirmation** like `generate_video`.

Arguments:

- `topic` (required) - what the vlog is about; the server writes a short punchy spoken line from it.
- `character` - text description of the on-camera character (server generates a matching portrait), OR `character_url` - a portrait photo URL to animate. One of the two is required.
- `duration` - 3..15 s (default 5); `resolution` - `720p` (default) | `1080p`; `aspect` - `9:16` (default) | `1:1` | `16:9`.
- `confirmed` - boolean, must be `true` to submit; omit/false for a cost-only preview.

Cost: varies with duration + resolution; see the preview card.

### `lipsync_video`

Re-sync the lips in an existing talking **video** to NEW speech - video dubbing / re-voicing (powered by `fal-ai/sync-lipsync`). Async - returns a `job_id`; poll `check_job` (usually 1-3 min).

Arguments:

- `video_url` (required) - the talking-head video to re-sync (max ~20s, clear front-facing face). External https:// or avots-hosted.
- `text` + `voice` (TTS mode) - the words to speak + a preset / cloned voice; OR `audio_url` (dub mode) - a ready audio track to sync to (when given, `text`/`voice` are ignored).
- `confirmed` - boolean, must be `true` to submit.

Cost: ~500-1500 ⚡.

### `create_montage`

Assemble a **slideshow reel** from 4-25 photos - Ken Burns zoom / pan on each photo + smooth crossfade transitions + an optional music track. Local render (no external model). Async - returns a `job_id`; poll `check_job` until `completed` (usually under a minute).

Arguments:

- `image_urls` (required) - 4..25 image URLs in play order (external https:// or avots-hosted `/v1/files/<uuid>`).
- `music` - `upbeat` | `chill` | `epic` | `none` (default `none`).
- `aspect` - `9:16` (default) | `1:1` | `16:9`.

Cost: ~200 ⚡ flat.

### `create_travel_poster`

Turn a face photo into a vintage **travel poster** - the person sits on a giant map of a chosen country surrounded by its landmarks, a passport, stamps and the country name in big serif caps (the viral "Morocco / Japan" look). A face-only photo gets a full body drawn in. **Synchronous** - returns the hosted image URL directly (no `check_job`).

Arguments:

- `image_url` (required) - a front-facing face photo (external https:// or avots-hosted).
- `country` (required) - e.g. "Japan", "Morocco", "Italy". Any country works; 24 curated ones render with hand-picked landmarks.
- `aspect` - `3:4` (default) | `9:16`.

Cost: ~200-500 ⚡. To animate it into a Stories clip, pass the returned URL to `generate_video` (image-to-video).

### `recreate_trend`

Puts the user **into a trend** from `list_trends`: their face photo replaces the face in the trend's demo, scene and motion preserved. Only face-swap trends (`swappable: true`). **Image trends run synchronously** (~15-30s) and return the finished image URL directly. **Video trends use the two-step confirmation** (preview without `confirmed`, submit with `confirmed: true`) and return a `job_id` for `check_job` (typically 1-4 min).

Arguments:

- `trend_id` (required) - id from `list_trends`.
- `face_image_url` (required) - the user's face photo: external URL, avots `/v1/files/<uuid>` URL, or `avatar:<id|name>` to reuse a saved avatar.
- `confirmed` - video trends only; `true` to submit.

Cost: image trends ~200-500 ⚡; video trends per second of the demo clip (the preview shows the estimate).

### `create_calendar_event`

Turn a natural-language description ("meeting tomorrow at 12 with Igor at the office", "dentist friday 9am") into a calendar event. Publishes to the user's linked backend: **Apple Calendar** (iCloud) or **Google Calendar** if linked in `/settings/calendar`; otherwise returns an `.ics` file the client offers as a download. Cost ~5 ⚡ (LLM extraction).

Arguments:

- `description` (required) - natural-language event incl. the time reference.
- `timezone` - optional IANA tz (e.g. `Europe/Riga`). Falls back to the user's saved tz, ultimately `Europe/London`.

Returns `{ ok, backend: "icloud"|"google"|"none", event: {title, start_iso, end_iso, location}, event_url? (backend != none), ics_b64? (backend = none) }`.

## Common patterns

### "List models for this category"

Use `list_models` with the right `category` filter (`chat`, `image`, `video`, `audio`) rather than guessing model ids - it returns the live catalog with prices, so it's always up to date.

### Variable cost preview before video

The two-step `generate_video` flow is exactly this - call without `confirmed`, show the user the preview card, get their pick, call again with `confirmed: true`. Never call with `confirmed: true` on the first attempt without an explicit user OK.

### Refunds

If a tool call fails AFTER reserving tokens (e.g. provider returns `AccountOverdueError`), the server refunds the reserve back to the user's balance and resets the message cost to 0 so the daily USD cap is unaffected. No manual intervention needed.
