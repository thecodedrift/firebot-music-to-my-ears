# firebot-music-to-my-ears

## 1.0.1

### Patch Changes

- a349f0f: Fix Spotify song-request matching and add per-account playability checks.

  - **Better search matches** — Spotify's relevance ranking is unreliable at
    `limit=1` (it could return a worse match than the obvious one, e.g. "The Mystic
    Crystal" for "Walk The Dinosaur by Ninja Sex Party"). Requests now fetch
    several results and pick the first playable one, which also tolerates noisy
    queries (a stray `by`, or a leaked `!sr` command prefix).
  - **Direct track links** — a Spotify track URL, `spotify:track:` URI, or bare
    track id is now resolved directly to that exact track instead of being run as
    a text search.
  - **Region/playability gating** — search and track lookups use `market=from_token`
    so results are filtered to what the linked account can play; a specifically
    requested but unplayable track now fails with the new `not-playable` error
    reason instead of being queued or mis-reported.

## 1.0.0

### Major Changes

- ef07824: Initial release: a Firebot custom script that adds Spotify song-request and
  playback effects, built as a single self-contained CommonJS bundle.

  - **Spotify integration** — links a Spotify account via Firebot's OAuth flow with
    automatic token refresh; client id/secret and the no-repeat window are
    configured on the script settings page.
  - **Request Song effect** — searches Spotify (tracks only; podcasts excluded),
    moderates, and queues in one atomic action, outputting `success` plus an
    `errorReason` (`not-found` / `blocked-term` / `explicit` / `recently-played` /
    `no-active-device` / `not-premium` / `not-linked`) so streamers can branch
    (e.g. refund a redemption) on a single condition. Moderation is a per-effect
    substring blocked-terms list (pre-filled with `karaoke`, `instrumental`,
    `inst.`), an optional "allow explicit tracks" toggle, and a no-repeat window.
  - **Playback effects** — Skip Track, Play / Resume, and Pause.
  - **Get Current Track effect** — outputs the now-playing track plus the requester,
    attributed via an in-memory ledger that also backs the no-repeat check.

### Minor Changes

- ef07824: Add project automation: CI (lint, typecheck, build, test) on PRs and main, Jest
  tests covering moderation, the no-repeat/requester ledger, API error mapping, and
  the run()/stop() lifecycle, Changesets-based versioning, a release workflow that
  attaches the built bundle to a GitHub Release, and a stack-aware OpenSpec archive
  check.
