import { NotPlayableError, parseTrackId, SpotifyApiError, toErrorReason } from "./api";
import { NotLinkedError } from "./auth";

describe("toErrorReason", () => {
  it("maps NotLinkedError to not-linked", () => {
    expect(toErrorReason(new NotLinkedError())).toBe("not-linked");
  });

  it("maps NotPlayableError to not-playable", () => {
    expect(toErrorReason(new NotPlayableError("market"))).toBe("not-playable");
  });

  it("maps the NO_ACTIVE_DEVICE reason to no-active-device", () => {
    expect(toErrorReason(new SpotifyApiError(404, "no device", "NO_ACTIVE_DEVICE"))).toBe(
      "no-active-device"
    );
  });

  it("maps a 404 to no-active-device", () => {
    expect(toErrorReason(new SpotifyApiError(404, "not found"))).toBe("no-active-device");
  });

  it("maps the PREMIUM_REQUIRED reason to not-premium", () => {
    expect(toErrorReason(new SpotifyApiError(403, "premium", "PREMIUM_REQUIRED"))).toBe(
      "not-premium"
    );
  });

  it("maps a 403 to not-premium", () => {
    expect(toErrorReason(new SpotifyApiError(403, "forbidden"))).toBe("not-premium");
  });

  it("maps anything else to unknown", () => {
    expect(toErrorReason(new Error("boom"))).toBe("unknown");
    expect(toErrorReason(new SpotifyApiError(500, "server error"))).toBe("unknown");
  });
});

describe("parseTrackId", () => {
  const id = "1O9XsjLUaxsYCRh9vyF8xS";

  it("extracts the id from a share URL (with query and locale segment)", () => {
    expect(parseTrackId(`https://open.spotify.com/track/${id}?si=abc123`)).toBe(id);
    expect(parseTrackId(`https://open.spotify.com/intl-de/track/${id}`)).toBe(id);
  });

  it("extracts the id from a spotify:track: URI", () => {
    expect(parseTrackId(`spotify:track:${id}`)).toBe(id);
  });

  it("accepts a bare 22-char id", () => {
    expect(parseTrackId(id)).toBe(id);
    expect(parseTrackId(`  ${id}  `)).toBe(id);
  });

  it("returns undefined for an ordinary search query", () => {
    expect(parseTrackId("Walk The Dinosaur by Ninja Sex Party")).toBeUndefined();
    expect(parseTrackId("daft punk")).toBeUndefined();
  });
});
