import { clear, isRecent, record, requesterOf } from "./ledger";

describe("ledger", () => {
  beforeEach(() => clear());

  it("reports a URI as recent within the window", () => {
    record("spotify:track:1", "alice", 1000);
    expect(isRecent("spotify:track:1", 5000, 3000)).toBe(true);
  });

  it("reports a URI as not recent once the window passes", () => {
    record("spotify:track:1", "alice", 1000);
    expect(isRecent("spotify:track:1", 1000, 3000)).toBe(false);
  });

  it("treats a window of 0 as disabled", () => {
    record("spotify:track:1", "alice", 1000);
    expect(isRecent("spotify:track:1", 0, 1000)).toBe(false);
  });

  it("returns the recorded requester", () => {
    record("spotify:track:1", "alice", 1000);
    expect(requesterOf("spotify:track:1")).toBe("alice");
  });

  it("returns undefined for an unknown URI", () => {
    expect(requesterOf("spotify:track:unknown")).toBeUndefined();
  });

  it("clears all entries", () => {
    record("spotify:track:1", "alice", 1000);
    clear();
    expect(requesterOf("spotify:track:1")).toBeUndefined();
  });
});
