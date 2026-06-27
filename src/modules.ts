import { ScriptModules } from "@crowbartools/firebot-custom-scripts-types";
import { Logger } from "@crowbartools/firebot-custom-scripts-types/types/modules/logger";
import { Params } from "./types/params";

/**
 * Module-scoped singletons so deep files can reach Firebot modules and the
 * current parameters without prop-drilling `runRequest` everywhere.
 *
 * `initModules` must be called first thing in `run()`.
 */
let modules: ScriptModules | undefined;
let params: Params | undefined;

export function initModules(scriptModules: ScriptModules, scriptParams: Params): void {
  modules = scriptModules;
  params = scriptParams;
}

export function getModules(): ScriptModules {
  if (!modules) {
    throw new Error("Script modules accessed before initModules() was called");
  }
  return modules;
}

export function getParams(): Params {
  if (!params) {
    throw new Error("Script parameters accessed before initModules() was called");
  }
  return params;
}

/** Replace the cached parameters (called from `parametersUpdated`). */
export function setParams(scriptParams: Params): void {
  params = scriptParams;
}

/** Thin proxy so callers can `import { logger }` and log at any time. */
export const logger: Logger = {
  debug: (msg, ...meta) => getModules().logger.debug(msg, ...meta),
  info: (msg, ...meta) => getModules().logger.info(msg, ...meta),
  warn: (msg, ...meta) => getModules().logger.warn(msg, ...meta),
  error: (msg, ...meta) => getModules().logger.error(msg, ...meta),
};
