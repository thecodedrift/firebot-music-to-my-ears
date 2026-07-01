---
"firebot-music-to-my-ears": patch
---

Harden Spotify token handling and add scope diagnostics.

- **Expired-token protection** — when Spotify rejects a call with a 401 (the
  token was revoked or rotated behind our back and the local expiry timer can't
  see it), the request now forces a token refresh and retries once instead of
  failing.
- **Scope validation logging** — on every token refresh we compare the scopes
  Spotify actually granted against the scopes we request and warn when any are
  missing (typically `user-modify-playback-state`, the cause of "Insufficient
  client scope"), pointing at a re-link. Debug logging confirms the token is
  valid when all scopes are present.
- **Single source of truth for the token** — the access token is now read only
  from the integration definition Firebot persists, removing the parallel
  captured-token fallback that could diverge from the live linked token.
