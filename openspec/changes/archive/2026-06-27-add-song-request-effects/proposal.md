## Why

Streamers want viewers to request music (Spotify) from Twitch chat or channel-point
redemptions, with light moderation, without handing over playback control or risking dead air.
Firebot can't perform OAuth from inside its own prompts, and Firebot scripts must ship as a
single self-contained file. This change builds the first usable version: a **toolkit of Firebot
effects** the streamer wires into their own commands/redemptions, backed by a Spotify
integration.

The key design decision is settled: **use the Spotify queue, not a managed playlist.** `!skip`
is sufficient for removing a bad song, so we avoid owning playback continuity (ordering,
exhaustion, dead-air fallback) entirely. Spotify keeps the streamer's music going; we only
inject, skip, and read. Moderation is therefore **pre-enqueue**, which is exactly where the
streamer needs it to refund a failed redemption.

## What Changes

- Ship a single-file, default-export Firebot custom script authored in TypeScript, built to the
  strict Firebot output contract (single CommonJS file, unmangled public function names).
- Register a **Spotify integration** so Firebot manages the OAuth link and auto-refreshes tokens;
  expose client id/secret, a blocked-terms list, and a no-repeat window as configuration, with
  explanatory text on the configuration page about linking the account.
- Add five **effects** (Actions) the streamer composes themselves — we register no system command;
  the trigger (e.g. `!sr`) and all chat messaging are the streamer's to choose:
  - **Request Song** — a single atomic effect: search (tracks only; podcasts excluded), moderate
    (substring blocklist + optional explicit filter + no-repeat window), and queue. Outputs one
    `success` flag plus an `errorReason`, giving the streamer a single branch point (e.g. refund
    the redemption on failure). Search and queue are deliberately combined so a request that passes
    search but fails at queue time (now a repeat, no active device) still surfaces as one failure,
    not two conditionals.
  - **Skip Track**, **Play / Resume**, **Pause** — single-call playback controls.
  - **Get Current Track** — output now-playing metadata plus the requester (from the ledger).
- Add a per-effect **"allow explicit tracks"** checkbox to the Request Song effect (default off;
  checks Spotify's `track.explicit`), so a streamer can run a clean command and a looser one.
- Ship the blocked-terms parameter pre-filled with editable defaults (`karaoke`, `instrumental`,
  `inst.`).
- Maintain an in-memory **requester ledger** (`uri → requester + timestamp`) powering both the
  no-repeat check and requester attribution; cleared on `stop()`. Not persisted across restarts.

Out of scope for this change, by deliberate decision:
- **Replace variables** — not part of this design's surface.
- **Now-playing overlay** — out of scope; a future custom overlay widget could consume these effects.
- **Per-user cooldowns / rate limits** — Firebot already manages these at the command/trigger
  level; not this script's responsibility.
- **Ledger persistence** — no interest; in-memory only.
- System commands and playlist management also remain out. Effects + outputs are the whole v1 surface.

## Capabilities

### New Capabilities
- `script-packaging`: the single-file build/output contract, namespaced IDs, and run/stop lifecycle teardown.
- `spotify-integration`: the Firebot OAuth integration, token refresh, authenticated API client, and configuration parameters.
- `playback-control`: the Skip, Play/Resume, Pause, and Get Current Track effects.
- `song-requests`: the combined Request Song effect (search + moderation + queue), substring moderation with defaults, explicit-track filter, no-repeat window, and requester ledger.

### Modified Capabilities
<!-- None — greenfield project, no existing specs. -->

## Impact

- New build tooling: Webpack 5 + `ts-loader` + `terser-webpack-plugin` (chosen over Vite because
  it is the proven path for Firebot's exact single-file/CommonJS/no-mangle output contract).
- New dependency: `@crowbartools/firebot-custom-scripts-types` (source of truth for Firebot types).
- New source tree under `src/` (`main.ts`, `services/`, `firebot/effects/`, `modules.ts`,
  `shared/`), plus `scripts/copy-build` and webpack/tsconfig/prettier/eslint config.
- External constraints surfaced to users: Spotify **Premium** and an **active playback device**
  are required for queue/skip/play/pause; absence yields a clean `errorReason` for the streamer
  to handle.
