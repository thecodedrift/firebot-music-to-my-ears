/**
 * Injected at build time by webpack's DefinePlugin from package.json's version.
 * Undefined outside the webpack build (e.g. under Jest), where code falls back.
 */
declare const __SCRIPT_VERSION__: string | undefined;
