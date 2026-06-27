import { SpotifyApiError, toErrorReason } from "./api";
import { NotLinkedError } from "./auth";

describe("toErrorReason", () => {
  it("maps NotLinkedError to not-linked", () => {
    expect(toErrorReason(new NotLinkedError())).toBe("not-linked");
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
