import { EventEmitter } from "events";
import { IntegrationDefinition } from "@crowbartools/firebot-custom-scripts-types/types/modules/integration-manager";
import { getModules, logger } from "../modules";
import {
  INTEGRATION_ID,
  SPOTIFY_AUTH_HOST,
  SPOTIFY_AUTHORIZE_PATH,
  SPOTIFY_SCOPES,
  SPOTIFY_TOKEN_PATH,
} from "../shared/constants";
import { ClientCredentials } from "../types/spotify";
import { resetAuthCache, setCapturedAuth } from "./auth";

/**
 * Builds the Firebot integration definition. Firebot drives the OAuth link flow
 * from `authProviderDetails`; the same client credentials are reused by the
 * manual token refresh in `auth.ts`.
 */
export function buildSpotifyDefinition(client: ClientCredentials): IntegrationDefinition {
  return {
    id: INTEGRATION_ID,
    name: "Music to My Ears (Spotify)",
    description: "Link your Spotify account so song-request and playback effects can control it.",
    connectionToggle: false,
    linkType: "auth",
    settingCategories: {},
    authProviderDetails: {
      id: INTEGRATION_ID,
      name: "Spotify",
      redirectUriHost: "127.0.0.1",
      client,
      // `type` and `authorizeHost` are required by Firebot at runtime (it builds
      // the authorize redirect from authorizeHost + authorizePath) but are absent
      // from the published typings, so the literal is cast to the typed shape.
      auth: {
        type: "code",
        authorizeHost: SPOTIFY_AUTH_HOST,
        authorizePath: SPOTIFY_AUTHORIZE_PATH,
        tokenHost: SPOTIFY_AUTH_HOST,
        tokenPath: SPOTIFY_TOKEN_PATH,
      } as unknown as { tokenHost: string; tokenPath: string; authorizePath: string },
      autoRefreshToken: true,
      scopes: SPOTIFY_SCOPES,
    },
  };
}

/**
 * Normalizes a candidate token payload (which may be `{access_token,...}` or
 * nested under `.token`) into our AuthDefinition and captures it for `auth.ts`.
 */
function captureAuthFrom(source: unknown): void {
  const data = source as Record<string, unknown> | undefined;
  if (!data) {
    return;
  }
  const candidate = (data.auth ?? data.oauth ?? data) as Record<string, unknown>;
  const tokenObj = (candidate?.access_token ? candidate : candidate?.token) as
    | Record<string, unknown>
    | undefined;
  if (tokenObj?.access_token) {
    setCapturedAuth({
      access_token: String(tokenObj.access_token),
      refresh_token: tokenObj.refresh_token ? String(tokenObj.refresh_token) : undefined,
      expires_in: typeof tokenObj.expires_in === "number" ? tokenObj.expires_in : 3600,
      token_type: tokenObj.token_type ? String(tokenObj.token_type) : undefined,
    });
    logger.debug("Captured Spotify auth token from integration callback");
  }
}

/**
 * Integration controller. Captures the OAuth token from Firebot's lifecycle
 * callbacks (Firebot does not reliably populate `definition.auth`), and tracks
 * connection state. Token refresh is handled lazily in `auth.ts`.
 */
export class SpotifyIntegrationController extends EventEmitter {
  connected = false;

  init(_linked: boolean, integrationData?: unknown): void {
    captureAuthFrom(integrationData);
    // Effects are registered by the script's run() loop, not here.
  }

  connect(integrationData?: unknown): void {
    this.connected = true;
    captureAuthFrom(integrationData);
    this.emit("connected", INTEGRATION_ID);
  }

  disconnect(): void {
    this.connected = false;
    resetAuthCache();
    this.emit("disconnected", INTEGRATION_ID);
  }

  link(linkData?: unknown): void {
    captureAuthFrom(linkData);
    this.connected = true;
    logger.info("Spotify account linked");
    this.emit("connected", INTEGRATION_ID);
  }

  onUserSettingsUpdate(integrationData?: unknown): void {
    captureAuthFrom(integrationData);
  }

  unlink(): void {
    this.connected = false;
    resetAuthCache();
    setCapturedAuth(undefined);
    logger.info("Spotify account unlinked");
  }
}

let registered = false;

/** Registers the Spotify integration with Firebot. Safe to call once in run(). */
export function registerSpotifyIntegration(client: ClientCredentials): void {
  const { integrationManager } = getModules();
  integrationManager.registerIntegration({
    definition: buildSpotifyDefinition(client),
    integration: new SpotifyIntegrationController() as never,
  });
  registered = true;
  logger.info("Spotify integration registered");
}

/** Clears auth state on stop. (Firebot has no unregisterIntegration API.) */
export function teardownSpotifyIntegration(): void {
  if (!registered) {
    return;
  }
  resetAuthCache();
  registered = false;
}
