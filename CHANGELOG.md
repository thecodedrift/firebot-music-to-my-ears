# firebot-music-to-my-ears

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
