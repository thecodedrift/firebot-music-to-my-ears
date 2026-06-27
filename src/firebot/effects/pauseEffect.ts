import { pause } from "../../services/api";
import { makePlaybackEffect } from "./playbackEffect";

export const pauseEffect = makePlaybackEffect({
  id: "pause",
  name: "Pause (Spotify)",
  description: "Pauses Spotify playback on the active device.",
  icon: "fad fa-pause",
  action: pause,
});
