import { SPOTIFY_API_BASE } from "../shared/constants";
import { ErrorReason, Track } from "../shared/types";
import {
  SpotifyCurrentlyPlayingResponse,
  SpotifyErrorResponse,
  SpotifySearchResponse,
  SpotifyTrack,
} from "../types/spotify";
import { getAccessToken, NotLinkedError } from "./auth";

/** Error thrown for a non-OK Spotify API response, carrying the HTTP status. */
export class SpotifyApiError extends Error {
  status: number;
  /** Spotify player `reason` code, e.g. NO_ACTIVE_DEVICE / PREMIUM_REQUIRED. */
  reason?: string;

  constructor(status: number, message: string, reason?: string) {
    super(message);
    this.name = "SpotifyApiError";
    this.status = status;
    this.reason = reason;
  }
}

interface FetchResult<T> {
  status: number;
  ok: boolean;
  data: T | null;
}

/**
 * Single Spotify API helper: injects the base URL + bearer token and throws a
 * typed {@link SpotifyApiError} on non-OK responses. Non-GET and 204 responses
 * resolve with `data: null`.
 */
export async function spotifyFetch<T>(
  endpoint: string,
  method = "GET",
  options: RequestInit = {}
): Promise<FetchResult<T>> {
  const token = await getAccessToken();
  const response = await fetch(`${SPOTIFY_API_BASE}${endpoint}`, {
    ...options,
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    let reason: string | undefined;
    let message = `Spotify API returned status ${response.status}`;
    try {
      const body = (await response.json()) as SpotifyErrorResponse;
      reason = body.error?.reason;
      if (body.error?.message) {
        message = body.error.message;
      }
    } catch {
      // non-JSON error body; keep default message
    }
    throw new SpotifyApiError(response.status, message, reason);
  }

  if (response.status === 204 || method !== "GET") {
    return { status: response.status, ok: true, data: null };
  }
  return { status: response.status, ok: true, data: (await response.json()) as T };
}

/** Maps a thrown error to the effect-facing {@link ErrorReason}. */
export function toErrorReason(error: unknown): ErrorReason {
  if (error instanceof NotLinkedError) {
    return "not-linked";
  }
  if (error instanceof SpotifyApiError) {
    if (error.reason === "NO_ACTIVE_DEVICE" || error.status === 404) {
      return "no-active-device";
    }
    if (error.reason === "PREMIUM_REQUIRED" || error.status === 403) {
      return "not-premium";
    }
  }
  return "unknown";
}

/** Normalizes a Spotify track object into our domain {@link Track}. */
function toTrack(item: SpotifyTrack): Track {
  const artists = item.artists.map((a) => a.name);
  return {
    uri: item.uri,
    name: item.name,
    artist: artists.join(", "),
    artists,
    explicit: item.explicit,
    durationMs: item.duration_ms,
  };
}

/** Searches Spotify for tracks only (podcasts/episodes never returned). */
export async function searchTrack(query: string): Promise<Track | null> {
  const params = new URLSearchParams({ q: query, type: "track", limit: "1" });
  const { data } = await spotifyFetch<SpotifySearchResponse>(`/search?${params.toString()}`);
  const item = data?.tracks?.items?.[0];
  return item ? toTrack(item) : null;
}

/** Adds a track URI to the active device's playback queue. */
export async function queueTrack(uri: string): Promise<void> {
  const params = new URLSearchParams({ uri });
  await spotifyFetch(`/me/player/queue?${params.toString()}`, "POST");
}

/** Advances to the next track. */
export async function skip(): Promise<void> {
  await spotifyFetch("/me/player/next", "POST");
}

/** Resumes playback on the active device. */
export async function play(): Promise<void> {
  await spotifyFetch("/me/player/play", "PUT");
}

/** Pauses playback on the active device. */
export async function pause(): Promise<void> {
  await spotifyFetch("/me/player/pause", "PUT");
}

export interface CurrentTrack {
  track: Track | null;
  isPlaying: boolean;
}

/** Returns the currently playing track (if any) and playback state. */
export async function currentTrack(): Promise<CurrentTrack> {
  const { status, data } = await spotifyFetch<SpotifyCurrentlyPlayingResponse>(
    "/me/player/currently-playing"
  );
  // 204 = nothing playing.
  if (status === 204 || !data) {
    return { track: null, isPlaying: false };
  }
  return {
    track: data.item ? toTrack(data.item) : null,
    isPlaying: data.is_playing,
  };
}
