import { Effects } from "@crowbartools/firebot-custom-scripts-types/types/effects";
import { getCurrentTrackEffect } from "./getCurrentTrackEffect";
import { pauseEffect } from "./pauseEffect";
import { playResumeEffect } from "./playResumeEffect";
import { requestSongEffect } from "./requestSongEffect";
import { skipTrackEffect } from "./skipTrackEffect";

/**
 * Every effect this script registers. main.ts loops this in run() to register
 * and in stop() to unregister, so adding an effect = add a file + add it here.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const AllEffects: Effects.EffectType<any, any, any>[] = [
  requestSongEffect,
  getCurrentTrackEffect,
  skipTrackEffect,
  playResumeEffect,
  pauseEffect,
];
