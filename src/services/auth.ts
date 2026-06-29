import { getModules, getParams, logger } from "../modules";
import { INTEGRATION_ID, SPOTIFY_TOKEN_URL } from "../shared/constants";
import { AuthDefinition, SpotifyRefreshTokenResponse } from "../types/spotify";

/**
 * Thrown when an API call is attempted before the Spotify account is linked.
 * Mapped to the `not-linked` error reason by callers.
 */
export class NotLinkedError extends Error {
  constructor() {
    super("Spotify account is not linked");
    this.name = "NotLinkedError";
  }
}

/** Cached absolute expiry (ms epoch); the token itself is never cached. */
let expiresAt: number | undefined;

/**
 * Token captured from the integration controller callbacks (init/link/connect),
 * used as a fallback when Firebot does not populate `definition.auth`.
 */
let capturedAuth: AuthDefinition | undefined;

/** Store/clear the token captured from controller callbacks. */
export function setCapturedAuth(auth: AuthDefinition | undefined): void {
  capturedAuth = auth;
}

/** Reset cached expiry (e.g. on stop). */
export function resetAuthCache(): void {
  expiresAt = undefined;
}

/**
 * Reads the live OAuth token Firebot stores on the integration definition.
 * These fields are runtime-only and not present in the published typings.
 */
function readStoredAuth(): AuthDefinition | undefined {
  const integration = getModules().integrationManager.getIntegrationById(INTEGRATION_ID) as
    | { definition?: { auth?: AuthDefinition } }
    | undefined;
  return integration?.definition?.auth ?? capturedAuth;
}

/** True when an account is linked (an access token is stored). */
export function isLinked(): boolean {
  return Boolean(readStoredAuth()?.access_token);
}

/** Whether the cached token is known-fresh (>5s from expiry). */
function tokenIsFresh(): boolean {
  return expiresAt !== undefined && expiresAt - Date.now() > 5000;
}

/**
 * Returns a valid access token, refreshing via the Spotify token endpoint when
 * the cached expiry is unknown or near. Throws {@link NotLinkedError} when no
 * account is linked.
 */
export async function getAccessToken(): Promise<string> {
  const auth = readStoredAuth();
  if (!auth?.access_token) {
    throw new NotLinkedError();
  }
  if (tokenIsFresh()) {
    return auth.access_token;
  }
  const refreshed = await refreshAccessToken();
  return refreshed.access_token;
}

/**
 * Manually refreshes the access token (Basic-auth client creds + the stored
 * refresh token), persists it back onto the integration so Firebot keeps it,
 * and updates the cached expiry.
 */
export async function refreshAccessToken(): Promise<AuthDefinition> {
  const { integrationManager } = getModules();
  const integration = integrationManager.getIntegrationById(INTEGRATION_ID) as
    | { definition?: { auth?: AuthDefinition } }
    | undefined;
  const auth = integration?.definition?.auth;
  if (!auth?.refresh_token) {
    throw new NotLinkedError();
  }

  const { spotifyClientId, spotifyClientSecret } = getParams();
  const basic = Buffer.from(`${spotifyClientId}:${spotifyClientSecret}`).toString("base64");

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: auth.refresh_token,
    }),
  });

  if (!response.ok) {
    throw new Error(`Spotify token refresh failed with status ${response.status}`);
  }

  const data = (await response.json()) as SpotifyRefreshTokenResponse;
  const updated: AuthDefinition = {
    access_token: data.access_token,
    // Spotify omits refresh_token on refresh; carry the existing one forward.
    refresh_token: data.refresh_token ?? auth.refresh_token,
    expires_in: data.expires_in,
    token_type: data.token_type,
  };

  expiresAt = Date.now() + data.expires_in * 1000;

  // saveIntegrationAuth is a runtime method not present in the published typings.
  (integrationManager as unknown as {
    saveIntegrationAuth: (integration: unknown, data: unknown) => void;
  }).saveIntegrationAuth(integration, updated);

  logger.debug("Spotify access token refreshed");
  return updated;
}
