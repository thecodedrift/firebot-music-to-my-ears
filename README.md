# Music to My Ears

A custom script for [Firebot](https://github.com/crowbartools/Firebot) that lets your Twitch
viewers request music and control playback through **Spotify**. It ships a small toolkit of
Firebot **effects** (Actions) that you wire into your own commands, channel-point redemptions, or
buttons — you choose the trigger and the chat messaging; the script handles search, moderation,
queueing, and playback.

> **Spotify Premium is required.** Queue, skip, play, and pause all need a Premium account with an
> active playback device (the Spotify app open and playing somewhere).

## Features

- **Request Song** — searches Spotify (tracks only; podcasts/episodes are never returned),
  moderates, and queues the track in one atomic action. Outputs a single `success` flag plus an
  `errorReason`, so you can branch (e.g. refund a redemption) on one condition.
  - Per-effect **blocked-terms** list (case-insensitive substring match on artist + track name),
    pre-filled with `karaoke`, `instrumental`, `inst.`
  - Per-effect **"allow explicit tracks"** toggle (off by default)
  - **No-repeat window** so the same track can't be re-requested for N minutes
- **Skip Track**, **Play / Resume**, **Pause** — single-action playback controls.
- **Get Current Track** — outputs the now-playing track plus **who requested it**.

No system command is registered — the trigger (`!sr`, a reward, a button) and all chat replies are
yours to design using the effects' outputs.

## Requirements

- Firebot v5 (5.65+)
- A Spotify **Premium** account
- A Spotify application (free to create) for OAuth credentials

## Installation

1. **Create a Spotify app** at the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
   - Add this exact **Redirect URI** (note: `127.0.0.1`, not `localhost`, and no trailing `2`):
     ```
     http://127.0.0.1:7472/api/v1/auth/callback
     ```
   - Copy the **Client ID** and **Client Secret**.
2. **Download** `musicToMyEars.js` from the [latest release](../../releases/latest).
3. In Firebot: **Settings → Scripts → Manage Startup Scripts → Add New Script**, and select the
   downloaded file.
4. Open the script's settings, paste your **Client ID** and **Client Secret**, save, then **fully
   restart Firebot** (the credentials are read when the integration registers at startup).
5. Go to **Settings → Integrations**, find **Music to My Ears (Spotify)**, and **Link** your
   account. Authorize in the browser; you'll be redirected back and the integration will show as
   connected.

## Configuration (script settings page)

| Setting                        | Description                                                                        |
| ------------------------------ | ---------------------------------------------------------------------------------- |
| **Spotify Client ID / Secret** | From your Spotify app. Changing these requires a Firebot restart.                  |
| **No-Repeat Window (minutes)** | A queued track can't be requested again within this many minutes. `0` disables it. |

Blocked terms and the explicit toggle are configured **per Request Song effect** (so a clean `!sr`
and a looser one can differ), not on this page.

## Usage

Wire the effects into your own command. A typical song-request command (`!sr`):

1. **Command trigger** `!sr` (or a channel-point reward).
2. **Request Song (Spotify)** effect:
   - **Search query**: `$arg[all]` (or `$redemptionMessage` for a reward). Also accepts a
     Spotify track link (or `spotify:track:` URI / id), which queues that exact track.
   - Adjust the blocked-terms list / explicit toggle as desired
3. **Branch on the outputs** (effect outputs are read with `$effectOutput[name]`):
   - When `$effectOutput[success]` is `true` → **Chat** effect:
     `🎵 Queued "$effectOutput[trackName]" by $effectOutput[artistName]`
   - Otherwise → handle the failure using `$effectOutput[errorReason]` (refund the redemption,
     whisper the viewer, etc.)

### Request Song outputs

| Output                                  | Meaning                                                                                                           |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `success`                               | `true` if the track passed moderation and was queued                                                              |
| `trackUri` / `trackName` / `artistName` | The matched track (empty on failure)                                                                              |
| `errorReason`                           | `not-found` · `blocked-term` · `explicit` · `recently-played` · `no-active-device` · `not-premium` · `not-linked` |

### Get Current Track outputs

`isPlaying`, `trackName`, `artistName`, `trackUri`, and `requestedBy` (who requested the current
track via Request Song, or empty if it wasn't a request).

Playback effects (**Skip / Play / Resume / Pause**) each output `success` and an `errorReason`
(`no-active-device` / `not-premium` / `not-linked`) so you can react to failures.

## Development

```bash
pnpm install
pnpm build           # production single-file bundle → dist/musicToMyEars.js
pnpm build:dev       # dev build + deploy into Firebot (see below)
pnpm test            # jest
pnpm lint            # eslint
pnpm typecheck       # tsc --noEmit
```

To auto-deploy a dev build into your Firebot profile, point `FIREBOT_SCRIPTS_DIR` at your profile's
`scripts` folder:

```bash
FIREBOT_SCRIPTS_DIR="/path/to/Firebot/v5/profiles/Main Profile/scripts" pnpm build:dev
```

Architecture and conventions are documented in
[.conventions/architecture.md](.conventions/architecture.md). The project uses
[OpenSpec](https://github.com/Fission-AI/OpenSpec) for spec-driven development — run it through the
package script (`pnpm openspec <command>`).

### Releasing

Versioning and changelogs are managed with [Changesets](https://github.com/changesets/changesets):

1. Add a changeset describing your change: `pnpm changeset`
2. On merge to `main`, CI opens a **"Version Packages"** PR that bumps the version and updates the
   changelog.
3. Merging that PR builds the bundle, tags the version, and publishes a **GitHub Release** with
   `musicToMyEars.js` attached.

## License

MIT
