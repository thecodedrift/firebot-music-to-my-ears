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
import { resetAuthCache } from "./auth";

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
 * Integration controller. Tracks connection state and clears the cached token
 * expiry on disconnect/unlink. The OAuth token itself is read straight from
 * `integrationManager...definition.auth` in `auth.ts` (single source of truth);
 * we no longer snapshot it here. Token refresh is handled lazily in `auth.ts`.
 */
export class SpotifyIntegrationController extends EventEmitter {
  connected = false;

  init(): void {
    // Effects are registered by the script's run() loop, not here.
  }

  connect(): void {
    this.connected = true;
    this.emit("connected", INTEGRATION_ID);
  }

  disconnect(): void {
    this.connected = false;
    resetAuthCache();
    this.emit("disconnected", INTEGRATION_ID);
  }

  link(): void {
    this.connected = true;
    logger.info("Spotify account linked");
    this.emit("connected", INTEGRATION_ID);
  }

  unlink(): void {
    this.connected = false;
    resetAuthCache();
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
