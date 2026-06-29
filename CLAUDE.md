# firebot-music-to-my-ears

A custom script for [Firebot](https://github.com/crowbartools/Firebot), the open-source Twitch
streaming bot. This script adds music-related functionality (now-playing, song requests, etc.).

## Architecture & conventions

**Read [.conventions/architecture.md](.conventions/architecture.md) before writing or changing
code.** It defines the project structure, the Firebot script/module API, the registration
patterns, the music/OAuth/polling patterns, and the build tooling — all derived from the official
Firebot tooling and representative OSS scripts.

Non-negotiable constraints (full detail in the architecture doc):

- Build produces a **single self-contained CommonJS `.js` file**; Firebot loads exactly one file.
- The script object is the **default export** of `src/main.ts`
  (`libraryTarget: "commonjs2"`, `libraryExport: "default"`).
- Terser must **not mangle** `run` / `getScriptManifest` / `getDefaultParameters`.
- **Namespace all registered IDs** as `music-to-my-ears:<name>`.
- Everything registered in `run()` must be **torn down in `stop()`**.
- Use `runRequest.modules.logger` for logging, never `console`.

## Git commits

- **ALWAYS** run `git commit` with the `-S` flag to ensure commits are GPG-signed. If signing
  fails (e.g. gpg can't open `/dev/tty` to prompt for the passphrase), ask the user to run
  `echo "test" | gpg --sign > /dev/null` to load their GPG signing key, then retry the commit.

## OpenSpec

This project uses [OpenSpec](https://github.com/Fission-AI/OpenSpec) for spec-driven development.

Always run it through the package script so the pinned local version is used:

```
pnpm openspec <command>
```

Examples: `pnpm openspec init`, `pnpm openspec list`, `pnpm openspec validate`.

Do not call a globally-installed `openspec` directly — use `pnpm openspec` so everyone runs the same version (`@fission-ai/openspec`, pinned in devDependencies).
