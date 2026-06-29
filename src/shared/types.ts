/**
 * Reason a Request Song (or playback) effect failed. Surfaced as the
 * `errorReason` effect output so the streamer can branch (e.g. refund a
 * redemption) on a single condition.
 */
export type ErrorReason =
  | "not-found"
  | "not-playable"
  | "blocked-term"
  | "explicit"
  | "recently-played"
  | "no-active-device"
  | "not-premium"
  | "not-linked"
  | "unknown";

/** Normalized track shape used across services and effects. */
export interface Track {
  uri: string;
  name: string;
  /** Joined artist names, e.g. "Daft Punk, Pharrell Williams". */
  artist: string;
  artists: string[];
  explicit: boolean;
  durationMs: number;
}
