import { play } from "../../services/api";
import { makePlaybackEffect } from "./playbackEffect";

export const playResumeEffect = makePlaybackEffect({
  id: "play-resume",
  name: "Play / Resume (Spotify)",
  description: "Resumes Spotify playback on the active device.",
  icon: "fad fa-play",
  action: play,
});
