# avots-mcp

Official MCP (Model Context Protocol) server for **[avots.ai](https://avots.ai)** - a multi-provider AI platform.

One connection gives you:

- 🖼 **Image generation & editing** - Nano Banana (Gemini 3 Pro / 3.1 Flash), GPT-5 Image, FLUX, Recraft (incl. native vector SVG), Ideogram
- 🎬 **Video generation & editing** - Veo 3.1, Seedance 2.0, Kling v3.0 Pro, Sora 2 Pro, Grok Imagine, Gemini Omni Flash (async, 1-8 min); plus scene edit, face swap and lip-sync re-voicing of existing clips
- 🧑‍🎤 **Talking heads & avatars** - saved reusable face identities, talking-avatar videos, vertical AI-vlogs for Shorts / TikTok
- 🎵 **Music & audio** - ElevenLabs Music, ACE-Step, Stable Audio, TTS narration (incl. cloned voices)
- 🎨 **Studio templates** - photo-montage reels, vintage travel posters, viral trend recreation with your face
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
| **Any other MCP client** | [docs/tools.md](docs/tools.md) - endpoint + tool list | Bearer header `Authorization: Bearer av_mcp_…` |

Ready-to-paste `mcp.json` snippets live under [`examples/`](examples/).

## What's in the server

Nineteen tools, all documented in [docs/tools.md](docs/tools.md):

| Tool | Cost | What it does |
| --- | --- | --- |
| `check_balance` | free | Current tokens, subscription tier and the full pricing catalog. |
| `list_models` | free | All active models with per-call cost (filter by `chat`, `image`, `video`, `audio`). |
| `list_avatars` | free | The user's saved reusable face identities. |
| `list_trends` | free | The avots Studio catalog of viral templates (face-swap videos, ads, animations). |
| `check_job` | free | Poll any async job by `job_id`. |
| `chat` | ~10-1000 ⚡ | Send a prompt to any chat model. Useful for delegating to GPT, DeepSeek, Sonar, etc. |
| `generate_image` | ~200-500 ⚡ | Sync image gen AND photo editing (`image_urls`). Recraft can return native vector SVG (`format: "svg"`, 2x). |
| `generate_video` | ~200-5000 ⚡ | Async video gen with **two-step confirmation**; supports i2v, multi-photo character refs and motion-reference clips. |
| `face_swap_video` | ~500-2000 ⚡ | Swap the face in an existing video with a photo (or saved avatar). Two-step. |
| `edit_video` | ~450 ⚡/sec | Scene edit of an existing clip by text prompt; person, motion and original audio preserved. Two-step. |
| `lipsync_video` | ~300-600 ⚡ | Re-voice an existing talking video: new text (TTS) or a ready audio track. Two-step. |
| `create_avatar` | free / ~200-500 ⚡ | Save a reusable face identity from a photo (free) or generate one from a description. |
| `generate_talking_avatar` | ~600-2500 ⚡ | A portrait speaks your exact text: TTS + lip-sync, quality/fast tiers. Two-step. |
| `generate_vlog` | preview shows price | Vertical AI-influencer clip for Shorts / TikTok: the server writes the line from your topic. Two-step. |
| `generate_audio` | ~50-800 ⚡ | Music (ElevenLabs Music, ACE-Step, Stable Audio) or TTS narration incl. cloned voices. Async. |
| `create_montage` | ~200 ⚡ | Slideshow reel from 4-25 photos: Ken Burns + crossfades + music. |
| `create_travel_poster` | ~200-500 ⚡ | Face photo → vintage travel poster of any country. Synchronous. |
| `recreate_trend` | per trend | Put the user's face into a viral template from `list_trends`. |
| `create_calendar_event` | ~5 ⚡ | Natural language → event in the linked Apple/Google calendar (or an .ics download). |

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
