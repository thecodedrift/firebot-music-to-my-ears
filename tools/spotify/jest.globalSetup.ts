/**
 * Jest globalSetup: probe Spotify auth once per test run.
 *
 * When credentials are configured, this exercises the REAL token-refresh path
 * (`getAccessToken()` -> `refreshAccessToken()`) to learn whether the stored
 * refresh token still works, and records the result for the live search suite:
 *   - "ok"        credentials present and the refresh token is valid
 *   - "expired"   credentials present but the refresh token is rejected/revoked
 *   - "no-creds"  credentials absent (no network call made)
 *
 * The live suite skips on anything other than "ok", so an expired token soft-
 * skips instead of failing the run.
 */
import "dotenv/config";

import { writeFileSync } from "node:fs";

import { getAccessToken } from "../../src/services/auth";
import { AUTH_STATUS_PATH, type AuthStatus } from "./authStatus";
import { hasSpotifyCreds, initHarnessModules, readEnv } from "./firebotStub";

export default async function globalSetup(): Promise<void> {
  let status: AuthStatus = "no-creds";

  if (hasSpotifyCreds()) {
    try {
      initHarnessModules(readEnv());
      await getAccessToken(); // real refresh against Spotify
      status = "ok";
    } catch {
      status = "expired";
    }
  }

  writeFileSync(AUTH_STATUS_PATH, status, "utf8");
}
