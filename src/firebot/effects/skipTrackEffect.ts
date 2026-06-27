import { skip } from "../../services/api";
import { makePlaybackEffect } from "./playbackEffect";

export const skipTrackEffect = makePlaybackEffect({
  id: "skip-track",
  name: "Skip Track (Spotify)",
  description: "Skips to the next track in the Spotify queue.",
  icon: "fad fa-forward",
  action: skip,
});
