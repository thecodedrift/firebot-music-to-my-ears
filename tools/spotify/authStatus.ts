/**
 * Tiny cross-process channel for the live-test auth probe.
 *
 * Jest's globalSetup runs in a separate context from the test workers and can't
 * pass values directly, so it writes a one-word status here and the test reads
 * it synchronously at collection time to decide whether to run or skip.
 */
import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

export type AuthStatus = "ok" | "expired" | "no-creds" | "unknown";

/** Shared flag-file path (rewritten by globalSetup on every test run). */
export const AUTH_STATUS_PATH = resolve(tmpdir(), "mtme-spotify-auth-status");

/** Reads the probe result; "unknown" if globalSetup hasn't written it. */
export function readAuthStatus(): AuthStatus {
  try {
    const value = readFileSync(AUTH_STATUS_PATH, "utf8").trim();
    if (value === "ok" || value === "expired" || value === "no-creds") {
      return value;
    }
  } catch {
    // No flag file yet.
  }
  return "unknown";
}
