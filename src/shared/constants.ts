/** Author/script namespace used to prefix every registered id. */
export const NAMESPACE = "music-to-my-ears";

/** Firebot integration id for the Spotify link. */
export const INTEGRATION_ID = NAMESPACE;

/** Spotify Web API base url. */
export const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

/** Spotify OAuth host and paths (authorize + token share the same host). */
export const SPOTIFY_AUTH_HOST = "https://accounts.spotify.com";
export const SPOTIFY_AUTHORIZE_PATH = "/authorize";
export const SPOTIFY_TOKEN_PATH = "/api/token";
export const SPOTIFY_TOKEN_URL = `${SPOTIFY_AUTH_HOST}${SPOTIFY_TOKEN_PATH}`;

/** OAuth scopes required for search, playback control, and now-playing. */
export const SPOTIFY_SCOPES = [
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
].join(" ");

/** Build a namespaced id (e.g. `music-to-my-ears:request-song`). */
export function namespaced(name: string): string {
  return `${NAMESPACE}:${name}`;
}
