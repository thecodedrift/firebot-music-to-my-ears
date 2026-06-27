## Context

Greenfield Firebot custom script for Spotify song requests. The architecture and hard constraints
are already documented in `.conventions/architecture.md` (single-file CommonJS bundle, default
export, no-mangle of public function names, namespaced IDs, teardown in `stop()`, Integration-based
OAuth, adaptive polling). This change scopes the **first committable version** and records the
product decisions reached during exploration.

## Goals / Non-Goals

**Goals:**
- A working, single-file TypeScript Firebot script that builds to the strict output contract.
- A Spotify integration that links via Firebot's OAuth UI and auto-refreshes tokens.
- Five effects (Request Song [combined search+moderate+queue], Skip, Play/Resume, Pause, Get
  Current Track) usable as composable Actions, with outputs the streamer branches on.
- Pre-enqueue moderation: substring blocked terms (with defaults) + optional explicit filter +
  a no-repeat window.
- Requester attribution via an in-memory ledger.
- Phasing where **every phase ends on committable, working code** with an obvious stopping point.

**Non-Goals (out of scope, by decision):**
- **Replace variables** — not part of this design's surface.
- **Now-playing overlay** — deferred; a future custom overlay widget could consume these effects.
- **Per-user cooldowns / rate limits** — Firebot manages these at the command/trigger level; not
  this script's responsibility.
- **Ledger persistence** — no interest; the ledger is in-memory only and lost on restart.
- System commands (the streamer picks their own trigger), event sources, playlist management,
  mid-queue removal, playback continuity/fallback, and max-duration limits.

## Decisions

### Queue, not playlist
`!skip` is sufficient to remove a bad song, so we use the Spotify queue
(`POST /me/player/queue`) and let Spotify own ordering and continuity. This eliminates the
playlist approach's burdens entirely: no playback cursor, no consume-on-play deletion, no
"runs out → dead air" fallback orchestration. The cost — can't remove a specific *already-queued*
song — is acceptable because moderation runs pre-enqueue and `!skip` handles the current track.

### Request Song is a single combined effect (search + moderate + queue)
We initially split search and queue into two effects to give the streamer a branch point. That was
wrong: failure is **two-stage**. A track can pass search and then fail at queue time — it became a
repeat in the gap, or there's no active device. Split effects force the streamer to catch failures
after *both* effects (two conditional branches), a poor experience for the non-technical streamers
who are the majority. Combining them yields a single `success`/`errorReason` output, so the refund
branch is one conditional. It also makes the whole request **atomic**, which eliminates the
check-then-write race entirely (see Risks). Request Song therefore searches, runs all moderation,
checks no-repeat, queues, and records the ledger — all in one effect invocation.

### Ledger timing: check and write within the one effect
Because Request Song is atomic, the no-repeat **check** and the ledger **write** happen in the same
invocation with no gap. The requester is captured from the effect trigger; the ledger is written
only after a successful queue, so it never records a found-but-not-queued track. Get Current Track
gets free requester attribution by looking up the now-playing URI.

### Moderation: substring blocklist (with defaults) + optional explicit filter
Blocked terms match case-insensitively as substrings against the matched track's artist and track
name. The blocked-terms parameter ships pre-filled with editable defaults — `karaoke`,
`instrumental`, `inst.` — which the streamer can extend or remove (not a hidden hardcoded baseline).
A per-effect **"allow explicit tracks"** checkbox (default off) additionally rejects tracks whose
Spotify `track.explicit` field is true; it is per-effect so a streamer can run a clean command and
a looser one. Podcasts/episodes are excluded structurally by limiting search to `type=track`.

### Effects-as-toolkit; the script never messages chat
We register no system command and send no chat messages. The streamer composes effects and writes
their own Chat effect using our outputs (`trackName`, `artistName`, `errorReason`, etc.). Zero
opinion on wording, maximum flexibility.

### Build with Webpack 5
Webpack 5 + `ts-loader` + `terser-webpack-plugin` (`mangle: false`, `keep_fnames: /main/`,
`extractComments: false`), `libraryTarget: "commonjs2"`, `libraryExport: "default"`. Chosen over
Vite because it is the proven configuration for Firebot's exact output contract.

## Risks / Trade-offs

- **Premium + active device required.** Queue/skip/play/pause 404 without an active device or
  Premium. Mitigation: surface a clean `errorReason` (`no-active-device` / `not-premium`) the
  streamer can branch on, and explain the requirement on the config page.
- **No mid-queue removal.** A bad song already in the queue can only be reached via `!skip`
  (skips everything in front of it). Accepted per the queue decision.
- **Ledger is in-memory only, by decision.** A Firebot restart loses no-repeat history and
  requester attribution. This is intentional — no persistence is planned.
- **Search-then-queue race: resolved.** Combining search and queue into one atomic effect closes
  the gap between the no-repeat check and the ledger write, so the same track can no longer pass
  the check twice before being recorded.
