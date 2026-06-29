/**
 * Live Spotify search integration tests.
 *
 * These drive the project's REAL `searchTrack()` / `spotifyFetch()` against the
 * actual Spotify Web API, so search bugs reproduce exactly as they would inside
 * Firebot (token refresh, query construction, response mapping — all real).
 *
 * Auth is a run-once setup: run `pnpm spotify:auth` to write SPOTIFY_REFRESH_TOKEN
 * into `.env`. When credentials are absent (e.g. CI), the whole suite is skipped.
 */
import "dotenv/config";

import { searchTrack, spotifyFetch } from "../../src/services/api";
import type { SpotifySearchResponse } from "../../src/types/spotify";
import { readAuthStatus } from "./authStatus";
import { initHarnessModules, readEnv } from "./firebotStub";

// globalSetup probed the refresh token; skip unless it came back valid.
const authStatus = readAuthStatus();
const live = authStatus === "ok" ? describe : describe.skip;

if (authStatus !== "ok") {
  let reason: string;
  if (authStatus === "expired") {
    reason = "refresh token expired/revoked — re-run `pnpm spotify:auth`";
  } else if (authStatus === "unknown") {
    reason = "auth probe failed unexpectedly (see globalSetup output above)";
  } else {
    reason = "set SPOTIFY_CLIENT_ID/SECRET and run `pnpm spotify:auth` to enable";
  }
  // eslint-disable-next-line no-console
  console.warn(`[spotify search] skipping live tests — ${reason}.`);
}

live("spotify search (live)", () => {
  // Network + token refresh: give Spotify room to respond.
  jest.setTimeout(20_000);

  beforeAll(() => {
    initHarnessModules(readEnv());
  });

  it("searchTrack returns a populated Track for a well-known query", async () => {
    const track = await searchTrack("Rick Astley Never Gonna Give You Up");

    expect(track).not.toBeNull();
    expect(track!.uri).toMatch(/^spotify:track:/);
    expect(track!.name.length).toBeGreaterThan(0);
    expect(track!.artists.length).toBeGreaterThan(0);
    expect(track!.artist).toBe(track!.artists.join(", "));
    expect(track!.durationMs).toBeGreaterThan(0);
    expect(typeof track!.explicit).toBe("boolean");
  });

  it("raw /search respects limit and only returns tracks", async () => {
    const params = new URLSearchParams({ q: "daft punk", type: "track", limit: "5" });
    const { status, data } = await spotifyFetch<SpotifySearchResponse>(
      `/search?${params.toString()}`
    );

    expect(status).toBe(200);
    const items = data?.tracks?.items ?? [];
    expect(items.length).toBeGreaterThan(0);
    expect(items.length).toBeLessThanOrEqual(5);
    for (const item of items) {
      expect(item.type).toBe("track");
      expect(item.uri).toMatch(/^spotify:track:/);
    }
  });
});

// Regression cases for reported search bugs. These FAIL against the current
// limit=1 / text-only implementation and should pass once the fix lands.
live("spotify search (reported bugs)", () => {
  jest.setTimeout(20_000);

  beforeAll(() => {
    initHarnessModules(readEnv());
  });

  // Bug 1: limit=1 returns "The Mystic Crystal" instead of the obvious match.
  it("finds the right track despite Spotify's limit=1 ranking quirk", async () => {
    const track = await searchTrack("Walk The Dinosaur by Ninja Sex Party");
    expect(track).not.toBeNull();
    expect(track!.name).toMatch(/walk the dinosaur/i);
    expect(track!.artist).toMatch(/ninja sex party/i);
  });

  // Bug 1 (related): a leaked command trigger shouldn't derail the match.
  it("tolerates a leaked '!sr' command prefix in the query", async () => {
    const track = await searchTrack("!sr Walk The Dinosaur by Ninja Sex Party");
    expect(track).not.toBeNull();
    expect(track!.name).toMatch(/walk the dinosaur/i);
    expect(track!.artist).toMatch(/ninja sex party/i);
  });

  // Bug 2: a pasted Spotify URL must resolve to that exact track, not a search.
  it("resolves a Spotify track URL to the exact track", async () => {
    const track = await searchTrack(
      "https://open.spotify.com/track/1O9XsjLUaxsYCRh9vyF8xS?si=b61f24493ba049cf"
    );
    expect(track).not.toBeNull();
    expect(track!.uri).toBe("spotify:track:1O9XsjLUaxsYCRh9vyF8xS");
    expect(track!.artist).toMatch(/tom cardy/i);
  });

  // Bug 2 (related): bare spotify: URI and raw 22-char id forms too.
  it("resolves a spotify:track: URI and a bare track id", async () => {
    const fromUri = await searchTrack("spotify:track:1O9XsjLUaxsYCRh9vyF8xS");
    expect(fromUri!.uri).toBe("spotify:track:1O9XsjLUaxsYCRh9vyF8xS");

    const fromId = await searchTrack("1O9XsjLUaxsYCRh9vyF8xS");
    expect(fromId!.uri).toBe("spotify:track:1O9XsjLUaxsYCRh9vyF8xS");
  });

  // A well-formed but nonexistent id is "not found" (undefined), not an error
  // that maps to no-active-device.
  it("returns undefined for a nonexistent track id", async () => {
    const track = await searchTrack("0000000000000000000000");
    expect(track).toBeUndefined();
  });
});
