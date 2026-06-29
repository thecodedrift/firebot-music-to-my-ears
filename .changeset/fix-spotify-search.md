---
"firebot-music-to-my-ears": patch
---

Fix Spotify song-request matching and add per-account playability checks.

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
