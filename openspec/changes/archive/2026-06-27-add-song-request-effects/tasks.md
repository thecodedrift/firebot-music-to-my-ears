## 1. Build skeleton — a valid empty Firebot script

**Stopping point (commit):** `pnpm build` emits one self-contained `.js`; Firebot loads it and
`run`/`stop` log via `logger`. Nothing else registered yet.

- [x] 1.1 Init TypeScript project: `tsconfig.json` (CommonJS, node resolution, ES2022, strict, sourceMap, `include: ./src/**/*`).
- [x] 1.2 Add `@crowbartools/firebot-custom-scripts-types` and webpack toolchain devDependencies.
- [x] 1.3 Webpack 5 config: `ts-loader`, `terser-webpack-plugin` (`mangle: false`, `keep_fnames: /main/`, `extractComments: false`), `libraryTarget: "commonjs2"`, `libraryExport: "default"`, single-file output driven by `scriptOutputName`.
- [x] 1.4 `src/main.ts`: minimal `Firebot.CustomScript` — `getScriptManifest` (`startupOnly: true`), empty `getDefaultParameters`, `run`/`stop` logging via `runRequest.modules.logger`; default-export the script object.
- [x] 1.5 `src/modules.ts` `initModules(modules)` singleton stash; call it first in `run()`.
- [x] 1.6 `scripts/copy-build` deploy script + `package.json` scripts (`build`, `build:dev`, `copy`); add Prettier + ESLint config.
- [x] 1.7 Verify the bundle is a single file, default-exports the script object, and preserves `run`/`getScriptManifest`/`getDefaultParameters` names.

## 2. Spotify integration & auth — account links and a live API call works

**Stopping point (commit):** the streamer links their Spotify account in Firebot; a debug call
(e.g. currently-playing) returns 200 and the token auto-refreshes on expiry.

- [x] 2.1 Define `Params` and `getDefaultParameters`: Spotify client id/secret, blocked-terms list, no-repeat window (minutes), with config-page descriptions including the "link your account here / where to get credentials" explainer.
- [x] 2.2 `services/auth.ts`: register a Firebot Integration with `authProviderDetails` and `autoRefreshToken: true`; expose lazy access-token retrieval.
- [x] 2.3 `services/api.ts`: single `fetch<T>(endpoint, method, options)` helper injecting Spotify base URL + `Authorization: Bearer`, throwing a typed error (carrying HTTP status) on non-OK.
- [x] 2.4 Register the integration in `run()`; tear it down in `stop()`.

## 3. Get Current Track effect — live now-playing in outputs

**Stopping point (commit):** drop Get Current Track on a command and see live track name/artist/uri
and `isPlaying` in the effect outputs. (`requestedBy` wired later in phase 6.)

- [x] 3.1 `firebot/effects/index.ts` aggregator (`AllEffects`); registration loop in `run()` namespacing each id as `music-to-my-ears:<name>`; unregister loop in `stop()`.
- [x] 3.2 `services/api.ts`: `currentTrack()`.
- [x] 3.3 `getCurrentTrackEffect.ts`: outputs `trackName`, `artistName`, `trackUri`, `isPlaying`; empty/`isPlaying:false` when nothing is playing.

## 4. Playback control effects — skip / play / pause work

**Stopping point (commit):** the streamer controls Spotify playback from Firebot; missing
device/Premium yields a clean `errorReason`.

- [x] 4.1 `services/api.ts`: `skip()`, `play()`, `pause()`.
- [x] 4.2 `skipTrackEffect.ts`, `playResumeEffect.ts`, `pauseEffect.ts`; each outputs `success` and `errorReason` (`no-active-device` | `not-premium`) on failure.
- [x] 4.3 Add the three effects to `AllEffects`.

## 5. Request Song effect (search + moderate + queue) — a working request command

**Stopping point (commit):** a single Request Song effect searches, moderates, and queues; it
outputs one `success` flag plus an `errorReason`, so the streamer can refund on failure with a
single branch. No-repeat/ledger not wired yet.

- [x] 5.1 `services/api.ts`: `searchTrack(query)` limited to `type=track` (podcasts/episodes never returned), and `queueTrack(uri)`.
- [x] 5.2 `services/moderation.ts`: case-insensitive substring match of blocked terms against artist + track name; explicit-track check against Spotify `track.explicit`.
- [x] 5.3 `getDefaultParameters`: pre-fill the blocked-terms parameter with editable defaults `karaoke`, `instrumental`, `inst.`.
- [x] 5.4 `requestSongEffect.ts`: input `query` + per-effect `allowExplicit` checkbox (default off); atomically search → substring moderation → explicit filter → queue; outputs `success`, `trackUri`, `trackName`, `artistName`, `errorReason` (`not-found` | `blocked-term` | `explicit` | `no-active-device` | `not-premium`).
- [x] 5.5 Add to `AllEffects`.

## 6. Ledger — no-repeat + requester attribution — full v1 loop

**Stopping point (commit):** end-to-end request → queue → no-repeat rejection → requester
attribution all work, atomically within Request Song. v1 complete.

- [x] 6.1 `services/ledger.ts`: in-memory `Map<uri, { requestedBy, ts }>`; `record`, `isRecent(uri, windowMs)`, `requesterOf(uri)`, `clear()` (in-memory only, no persistence); clear in `stop()`.
- [x] 6.2 Wire the no-repeat **check** into Request Song before queueing → `errorReason: recently-played` when `isRecent`; on successful queue, `record({ uri, requestedBy (from trigger), ts })`. Check and write are in the same atomic invocation (no race).
- [x] 6.3 Wire `requestedBy` into Get Current Track via `requesterOf(currentUri)` (empty when not a request).
- [x] 6.4 Full manual run-through in Firebot against the five effects; confirm everything registered in `run()` is torn down in `stop()`. (Verified via a simulated run()/stop() harness with mocked Firebot modules + stubbed fetch — real-Firebot UI test still recommended before release.)
