/**
 * In-memory record of queued tracks, used for the no-repeat check and requester
 * attribution. Not persisted across restarts; cleared on stop().
 */
interface LedgerEntry {
  requestedBy: string;
  ts: number;
}

const entries = new Map<string, LedgerEntry>();

/** Records that a track URI was queued by a requester at the given time. */
export function record(uri: string, requestedBy: string, now: number = Date.now()): void {
  entries.set(uri, { requestedBy, ts: now });
}

/**
 * True when the URI was queued within the last `windowMs`. A window of 0 (or
 * less) disables the no-repeat check.
 */
export function isRecent(uri: string, windowMs: number, now: number = Date.now()): boolean {
  if (windowMs <= 0) {
    return false;
  }
  const entry = entries.get(uri);
  return entry !== undefined && now - entry.ts < windowMs;
}

/** The requester recorded for a URI, or undefined if it was not a request. */
export function requesterOf(uri: string): string | undefined {
  return entries.get(uri)?.requestedBy;
}

/** Clears all ledger entries (called on stop). */
export function clear(): void {
  entries.clear();
}
