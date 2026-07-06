# avots-mcp

Official MCP (Model Context Protocol) server for **[avots.ai](https://avots.ai)** - a multi-provider AI platform.

One connection gives you:

- 🖼 **Image generation** - Nano Banana (Gemini 2.5 / 3 Pro / 3.1 Flash), GPT-5 Image, FLUX, Recraft, Ideogram
- 🎬 **Video generation** - Veo 3.1, Seedance 2.0, Kling v3.0 Pro, Sora 2 Pro, Grok Imagine (async, 1-8 min)
- 🔄 **Face swap** & 🗣 **talking avatars** - swap a face into any video, or make a portrait speak your text (lip-synced)
- 🎵 **Music & voice** - ElevenLabs Music, ACE-Step, Stable Audio + text-to-speech (ElevenLabs TTS, preset or cloned voices)
- 📅 **Calendar** - turn "meeting tomorrow at 12" into an event on your linked Apple / Google calendar
- 💬 **300+ chat models** - Claude (Sonnet / Opus), GPT-5, Gemini 3, DeepSeek, Sonar, and more - billed through one balance

The server lives at **`https://mcp.avots.ai/`** and speaks the [MCP `2025-06-18` spec](https://modelcontextprotocol.io/specification/2025-06-18) over Streamable HTTP. Tools are billed per call against your avots balance (same balance you'd see on the web app or the Telegram bot).

## Quick start

1. **Sign up at [avots.ai](https://avots.ai)** and mint an MCP key at [Settings → Integrations](https://app.avots.ai/#/settings/integrations) (it looks like `av_mcp_<48hex>`).
2. **Pick your client** from the table below and follow the linked guide.
3. **Try it** - ask your client *"generate an image of a fox in a snowy forest"* and watch tokens get spent.

| Client | Guide | Auth model |
| --- | --- | --- |
| **Claude.ai web** | [docs/claude-web.md](docs/claude-web.md) | OAuth - paste URL, click Connect, sign in (no token copy-paste) |
| **Claude Desktop** | [docs/claude-desktop.md](docs/claude-desktop.md) | Bearer token via `mcp-remote` |
| **Claude Code (CLI)** | [docs/claude-code.md](docs/claude-code.md) | Bearer token via `claude mcp add` |
| **Cursor** | [docs/cursor.md](docs/cursor.md) | Bearer token via `mcp-remote` |
| **Cline** | [docs/cline.md](docs/cline.md) | Bearer token via `mcp-remote` |
| **openclaw** | [docs/openclaw.md](docs/openclaw.md) | Native remote - Bearer header, no bridge |
| **LibreChat** | [docs/librechat.md](docs/librechat.md) | Native remote - Bearer header, no bridge |
| **Continue.dev** | [docs/continue.md](docs/continue.md) | Native remote - Bearer header, no bridge |
| **Any other MCP client** | [docs/tools.md](docs/tools.md) - endpoint + tool list | Bearer header `Authorization: Bearer av_mcp_…` |

Ready-to-paste `mcp.json` snippets live under [`examples/`](examples/).

## What's in the server

Sixteen tools, all listed in [docs/tools.md](docs/tools.md):

| Tool | Cost | What it does |
| --- | --- | --- |
| `check_balance` | free | Current tokens and subscription tier. |
| `list_models` | free | All active models with per-call cost (filter by `chat`, `image`, `video`, `audio`). |
| `chat` | ~10-1000 ⚡ | Send a prompt to any chat model. Useful for delegating to GPT, DeepSeek, Sonar, etc. |
| `generate_image` | ~200-500 ⚡ | Synchronous image gen - or photo EDITING when `image_urls` is passed (restyle / change background / merge subjects). Returns an inline `image` block (base64) and a hosted URL. |
| `generate_video` | ~200-5000 ⚡ | Async video gen with **two-step confirmation**: first call previews the cost and alternative models; second call (`confirmed: true`) actually submits. Multi-reference: `image_urls` (Kling Elements ≤4 photos, Seedance r2v ≤9) + `video_urls` motion refs. |
| `face_swap_video` | ~500-2000 ⚡ | Async. Swap a face from a photo into a target video, keeping the original motion (pixverse). Two-step confirm. |
| `generate_talking_avatar` | varies ⚡ | Async. Generate a portrait, speak your text (TTS), and lip-sync it into a talking-head video. Two-step confirm. |
| `generate_audio` | ~50-800 ⚡ | Music (ElevenLabs Music, ACE-Step, Stable Audio) **or** spoken voice / TTS (ElevenLabs, preset or cloned voices). Async. |
| `create_avatar` | free / ~200-500 ⚡ | Save a face as a reusable avatar - free with a photo URL, or generate one from a `portrait_prompt`. |
| `list_avatars` | free | List your saved avatars by name/id (for `generate_talking_avatar` / `generate_vlog`). |
| `generate_vlog` | varies ⚡ | Async. Short vertical talking-head vlog for Shorts/TikTok/Reels from a topic. Two-step confirm. |
| `lipsync_video` | ~500-1500 ⚡ | Async. Re-sync a talking video's lips to new speech (dubbing / re-voicing). |
| `edit_video` | ~450 ⚡/sec | Async + confirm. Edit a ready video by text (Gemini Omni Flash): scene changes, the person, motion and ORIGINAL AUDIO stay. |
| `create_montage` | ~200 ⚡ | Async. 4-25 photos into a reel with Ken Burns motion, crossfades and optional music (local render). |
| `create_travel_poster` | ~200-500 ⚡ | Sync. Face photo + a country into a vintage travel poster (you on the country map). |
| `list_trends` | free | Browse the Studio trend catalog; `swappable: true` entries take the user's face. |
| `recreate_trend` | varies ⚡ | Star in a trend: face-swap the user's photo into a catalog template (image sync / video async + confirm). |
| `create_calendar_event` | ~5 ⚡ | Turn natural language into an event on a linked Apple/Google calendar, or return an `.ics`. |
| `check_job` | free | Poll an async job (video / face-swap / avatar / vlog / lipsync / montage / video trend) by `job_id`. |

> **About the two-step video flow.** Video is the most expensive tool. To avoid surprise spend, `generate_video` returns a preview card the first time it's called (no submit, no reserve). The client (e.g. Claude) shows the cost + alternative models with prices and asks the user. The user confirms, the client re-calls with the chosen `model` + `confirmed: true`, and only then does the job get submitted. On submit error the server returns the same alternatives card - it never silently swaps to a pricier model.

## What you can build

A few things this is actually useful for. Each one chains two or more tools through one connection and one balance.

- **Social ad creative in one prompt** — hero image, animated variant, music bed.
- **Product-photo angle pack** — one product shot in, four angles + a rotation clip out.
- **Storyboard to animatic** — four script-driven frames animated into a 12-second rough cut.
- **Vertical Reels / Shorts factory** — 9:16 clip + matching 15-second music bed, repeatable per video.
- **Podcast cover art + show notes** — four cover variations and a written episode description for each.
- **Second-opinion delegation** — forward a tricky problem to a model from a different lineage and compare.
- **Localized brand assets** — translated copy and locale-tuned visuals across markets.

Each of these flows is written out as a runnable script — exact prompt, tool sequence, model picks, cost — in [`docs/recipes.md`](docs/recipes.md).

Cost ranges from ~200⚡ for a single image to ~5000⚡ for a 10-second 1080p Kling Pro clip — run `list_models` (free) at any time for live per-call prices.

## Billing

All tool calls bill against your avots balance, just like the web app and Telegram bot. No separate metering. Daily USD cap (set in Settings) and per-key rate limits apply.

See [pricing.avots.ai](https://avots.ai/pricing) for token packs and subscriptions.

## Troubleshooting

Common cross-client issues (401s, daily caps, two-step video flow, image rendering, `npx` PATH gotchas) are collected in [`docs/troubleshooting.md`](docs/troubleshooting.md). For client-specific setup, see the per-client guide linked in the table above.

## Issues & feedback

Open an issue here, or write to [hello@avots.ai](mailto:hello@avots.ai). For platform questions (billing, models, web app) the Telegram bot [@AvotsAIbot](https://t.me/AvotsAIbot) is the fastest channel.

## License

[MIT](LICENSE) - feel free to fork the docs, the examples, and anything else here.
