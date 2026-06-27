/**
 * User-configurable script parameters, resolved by Firebot from
 * `getDefaultParameters()` and supplied on `runRequest.parameters`.
 */
export interface Params {
  /** Spotify application client id (from the Spotify developer dashboard). */
  spotifyClientId: string;
  /** Spotify application client secret. */
  spotifyClientSecret: string;
  /** Minutes a queued track is ineligible to be requested again. */
  noRepeatMinutes: number;
}

/**
 * Default blocked terms pre-filled on each Request Song effect (editable per
 * effect). Per-effect rather than a script parameter so the list takes effect
 * without a Firebot restart.
 */
export const DEFAULT_BLOCKED_TERMS = ["karaoke", "instrumental", "inst."];
