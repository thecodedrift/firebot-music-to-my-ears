import { Track } from "../shared/types";
import { findBlockedTerm, isExplicitBlocked } from "./moderation";

const track = (over: Partial<Track> = {}): Track => ({
  uri: "spotify:track:1",
  name: "Song",
  artist: "Artist",
  artists: ["Artist"],
  explicit: false,
  durationMs: 1000,
  ...over,
});

describe("findBlockedTerm", () => {
  it("matches a term case-insensitively in the track name", () => {
    expect(findBlockedTerm(track({ name: "Song (Karaoke Version)" }), ["karaoke"])).toBe("karaoke");
  });

  it("matches a term in the artist name", () => {
    expect(findBlockedTerm(track({ artist: "Karaoke Kings" }), ["KARAOKE"])).toBe("karaoke");
  });

  it("returns the first matching term", () => {
    expect(findBlockedTerm(track({ name: "Live Instrumental" }), ["nope", "instrumental"])).toBe(
      "instrumental"
    );
  });

  it("ignores blank/whitespace terms", () => {
    expect(findBlockedTerm(track(), ["", "   "])).toBeUndefined();
  });

  it("returns undefined when nothing matches", () => {
    expect(findBlockedTerm(track(), ["nope"])).toBeUndefined();
  });
});

describe("isExplicitBlocked", () => {
  it("blocks an explicit track when explicit is not allowed", () => {
    expect(isExplicitBlocked(track({ explicit: true }), false)).toBe(true);
  });

  it("allows an explicit track when explicit is allowed", () => {
    expect(isExplicitBlocked(track({ explicit: true }), true)).toBe(false);
  });

  it("never blocks a clean track", () => {
    expect(isExplicitBlocked(track({ explicit: false }), false)).toBe(false);
  });
});
