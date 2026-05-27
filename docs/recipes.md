# Recipes

End-to-end flows that chain two or more avots-mcp tools through a single connection and a single balance. Each recipe is a short script you can read out to your MCP client (Claude.ai, Claude Desktop, Claude Code, Cursor, Cline) — the model handles the tool calls.

Costs below are typical ranges at the time of writing. Run `list_models` (free) for live prices.

---

## 1. Social ad creative in one prompt

Generate a hero still, turn it into a 5-second motion variant, drop in a music bed. End-to-end under five minutes.

**Tools used:** `generate_image` → `generate_video` (i2v) → `generate_audio`

**Prompt to your client:**

> Make a square Instagram ad for a cold-brew coffee brand called "Northwave". Step 1: generate a hero image — minimalist still life, glass cup with coffee and ice, soft window light, muted teal background, photorealistic. Use Nano Banana 3 Pro for quality. Step 2: animate that image into a 5-second 1:1 clip with gentle steam rising and condensation forming on the glass. Step 3: generate a 10-second instrumental music bed — lo-fi hip hop, calm, jazzy keys, no vocals.

**What happens under the hood:**

1. `generate_image` with `model: google/gemini-3-pro-image-preview`, `aspect_ratio: 1:1` → returns hosted URL.
2. `generate_video` (preview) with `prompt: <motion description>`, `image_url: <the URL from step 1>`, `aspect_ratio: 1:1`, `duration: 5`. Client shows the cost card and alternatives; you confirm a model. Seedance 2.0 auto-swaps to its i2v variant because `image_url` is set.
3. `generate_video` again with `confirmed: true` → returns `job_id`. Client polls with `check_job`.
4. `generate_audio` with `model: fal:fal-ai/elevenlabs/music`, `duration: 10`, `prompt: <music description>`.

**Typical cost:** ~400⚡ image + ~600⚡ video + ~200⚡ audio ≈ **1200⚡** (~€1.20 on starter pack).

**Tips:**

- Ask for `num_images: 4` in step 1 to get four hero variants and pick the best one before animating.
- For 9:16 stories or 16:9 in-feed, change both `aspect_ratio`s in steps 1 and 2.

---

## 2. Product-photo angle pack

Take one product shot, get the same product from different angles or in different lighting, plus a short rotation clip. Cheaper than reshooting.

**Tools used:** `generate_image` (×N) → `generate_video` (i2v)

**Prompt to your client:**

> Here's a product photo of a leather wallet (paste image URL or upload). Generate four additional shots: 3/4 angle on white background, top-down with cards spilling out, hero close-up of stitching detail, lifestyle shot on a desk with a coffee cup. Then animate the original into a 5-second 360° rotation clip.

**What happens:**

1. Four parallel `generate_image` calls — each with the original as `image_url` and a different angle/lighting prompt. Nano Banana keeps the product identity well.
2. `generate_video` with `image_url: <original URL>`, prompt `"slow 360 rotation, studio lighting, plain background"`, `duration: 5`. Confirm with Seedance 2.0 for cheapest i2v.

**Typical cost:** 4 × ~300⚡ images + ~500⚡ video ≈ **1700⚡** (~€1.70).

**Tips:**

- Brand-identity drift across angles is the main failure mode. If the wallet "shape changes", re-prompt with `"keep exact same product, identical stitching, identical color"`.
- For pure stills (no clip), drop the video step — under €1 for the whole pack.

---

## 3. Storyboard to animatic

Generate four sequential storyboard frames, then animate each frame to a 3-second clip. Output: a 12-second rough animatic from one script paragraph.

**Tools used:** `generate_image` (×4) → `generate_video` (×4, i2v) → `check_job` (×4)

**Prompt to your client:**

> Script: A lone hiker reaches a misty mountain ridge at sunrise, sits down, takes off her backpack, and looks at the valley below. Generate four storyboard frames in 16:9 — frame 1: wide shot of ridge in mist; frame 2: hiker arriving at edge; frame 3: hiker sitting, backpack beside her; frame 4: POV down into valley. Same art direction across all four (cinematic, soft morning light, muted palette). Then animate each frame into a 3-second clip.

**What happens:**

1. Four `generate_image` calls with `aspect_ratio: 16:9`. Use the same model across all four (e.g. `google/gemini-3-pro-image-preview`) for consistent art direction.
2. Four `generate_video` calls in i2v mode (`image_url`, `duration: 3`, `aspect_ratio: 16:9`). Submit all four jobs in parallel; poll with `check_job`.
3. Stitch the four MP4s in any editor (CapCut, Premiere, ffmpeg).

**Typical cost:** 4 × ~400⚡ stills + 4 × ~400⚡ clips ≈ **3200⚡** (~€3.20).

**Tips:**

- Add the same trailing instruction to every image prompt — *"cinematic, soft morning light, muted palette, same color grade as the previous frames"* — to keep visual continuity.
- Sora 2 Pro and Veo 3.1 hold character identity better than Seedance for long sequences; pricier, but worth it for a hero deliverable.

---

## 4. Vertical Reels / Shorts factory

A 9:16 vertical clip with a 15-second music bed, ready for TikTok / Reels / YouTube Shorts.

**Tools used:** `generate_video` → `generate_audio`

**Prompt to your client:**

> Make a 10-second 9:16 vertical clip: a paper plane flying through a sunlit office in slow motion, soft bokeh, golden hour. Then a 15-second instrumental track — uplifting indie pop, no vocals, 90 BPM.

**What happens:**

1. `generate_video` (preview) with `aspect_ratio: 9:16`, `duration: 10`, `resolution: 1080p`. Client shows alternatives; pick Veo 3.1 Fast for fast turnaround or Kling Pro for highest quality.
2. Confirm with `confirmed: true`. Poll with `check_job`.
3. `generate_audio` with `model: fal:fal-ai/elevenlabs/music`, `duration: 15`.

**Typical cost:** ~1500⚡ video (Veo Fast 1080p 10s) + ~250⚡ music ≈ **1750⚡** (~€1.75).

**Tips:**

- For a *factory* (10+ clips/day) keep the same `model`, `aspect_ratio`, `resolution` and only vary the prompt — costs become predictable.
- Add `audio: true` for models that respect the flag; or rely on Kling Pro / Veo 3.1 / Sora 2 Pro which produce audio natively.

---

## 5. Podcast cover art + show notes

Four cover-art variations and a written episode description for each. One connection, one billable account.

**Tools used:** `generate_image` (×4) → `chat`

**Prompt to your client:**

> Episode: "The Long Now — interview with a futures researcher about long-term planning". Generate 4 cover-art variations, 1:1, photographic style, moody, abstract — think "deep time" visually. Then for each cover, draft a 120-word episode description that matches the visual mood.

**What happens:**

1. `generate_image` with `num_images: 4`, `aspect_ratio: 1:1`. The tool returns all four in one call.
2. `chat` with `model: anthropic/claude-opus-4.7` (or `openai/gpt-5.5-pro`), prompt = the episode brief + a short description of each generated image.

**Typical cost:** ~1000⚡ image batch + ~50⚡ chat ≈ **1050⚡** (~€1.05).

**Tips:**

- For Spotify / Apple Podcasts upload, square is mandatory — keep `aspect_ratio: 1:1`.
- Switch the chat model per episode to "shop" voice: Claude Sonnet for warm, Opus for thoughtful, GPT for snappy, DeepSeek for clinical.

---

## 6. Second-opinion delegation

Inside Claude.ai or Claude Code, ask `chat` to forward a tricky problem to a model from a different lineage. Useful for code reviews, marketing copy reads, fact-checking.

**Tools used:** `chat`

**Prompt to your client:**

> Here's a SQL query I'm worried about (paste). Use the avots chat tool to forward it to `openai/gpt-5.5-pro` and `deepseek/deepseek-r1` and ask each one separately to spot bugs or perf issues. Then compare their answers and tell me which catches what the other missed.

**What happens:**

1. Two `chat` calls in sequence — one per model — with the same prompt.
2. The host model (Claude) reads both responses and synthesizes a comparison for you.

**Typical cost:** ~50-300⚡ per `chat` call depending on prompt + response length. Two-model second opinion typically **~200-600⚡**.

**Tips:**

- The point of this recipe is *cross-lineage* — pick models that don't share training data. Claude + GPT + Gemini + DeepSeek + Sonar each catch different things.
- For fact-checking, route through Sonar Pro (Perplexity) — it cites sources.

---

## 7. Localized brand assets

Translate ad copy into target languages, generate matching visuals tuned to each market's aesthetic. Same workflow per locale.

**Tools used:** `chat` → `generate_image`

**Prompt to your client:**

> Source ad copy (English): "Refuel your morning. Northwave cold brew, made in small batches." Translate it into Japanese, German, Brazilian Portuguese, and Spanish — keep brand voice tight, idiomatic. Then for each locale, generate one hero image matching the local market's aesthetic (e.g. Japan: minimalist, soft pastel; Germany: clean geometric; Brazil: warm, vibrant; Spain: sunlit, terracotta).

**What happens:**

1. One `chat` call with `model: anthropic/claude-opus-4.7` (or any chat model strong at translation). Returns all four translations in one response.
2. Four `generate_image` calls in parallel, each with a locale-tuned prompt.

**Typical cost:** ~100⚡ translation + 4 × ~400⚡ images ≈ **1700⚡** (~€1.70) for a four-locale launch.

**Tips:**

- Keep brand assets (logo, product photo) in the prompt as a reference image — Nano Banana respects `image_url` for style/identity carry-over.
- For pure copy (no images), drop the second step — translation across 10 locales costs ~250⚡ total.

---

## General patterns

A few small habits that make the above flows cheaper and more predictable.

- **Always preview `generate_video` first.** It's the most expensive tool. The preview is free and shows you alternatives at the same params; pick a cheaper model when quality is interchangeable. See [tools.md § generate_video](tools.md#generate_video).
- **Use `list_models` (free) before a batch job.** Prices change as providers update; `list_models` is the live source of truth.
- **Parallelize where you can.** Most MCP clients will fan out tool calls within a single turn — four image variations or four video jobs run in parallel rather than serial, cutting wall-clock time roughly 4×.
- **One balance, all clients.** A clip generated from Claude Desktop and one from Cursor draw from the same wallet — you don't need separate accounts per tool.
- **Daily USD cap is the safety net.** Set one in [Settings → Billing](https://app.avots.ai/#/settings/billing). The MCP server enforces it on every call; you'll get a clear error before any spend if you're over.
