/**
 * Deploys the built bundle into a Firebot profile's `scripts` directory so it
 * can be tested without manual copying.
 *
 * Target resolution order:
 *   1. FIREBOT_SCRIPTS_DIR env var (absolute path to a profile's scripts dir)
 *   2. The default Firebot data dir for this platform + "/profiles/Main/scripts"
 *
 * If the target directory does not exist the copy is skipped with a warning so
 * `pnpm build:dev` never hard-fails on a machine without Firebot installed.
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { scriptOutputName } = require("../package.json");

function defaultFirebotDataDir() {
  const home = os.homedir();
  switch (process.platform) {
    case "win32":
      return path.join(process.env.APPDATA || path.join(home, "AppData", "Roaming"), "Firebot", "v5");
    case "darwin":
      return path.join(home, "Library", "Application Support", "Firebot", "v5");
    default:
      return path.join(home, ".config", "Firebot", "v5");
  }
}

function resolveTargetDir() {
  if (process.env.FIREBOT_SCRIPTS_DIR) {
    return process.env.FIREBOT_SCRIPTS_DIR;
  }
  return path.join(defaultFirebotDataDir(), "profiles", "Main", "scripts");
}

const source = path.join(__dirname, "..", "dist", `${scriptOutputName}.js`);
const targetDir = resolveTargetDir();
const target = path.join(targetDir, `${scriptOutputName}.js`);

if (!fs.existsSync(source)) {
  console.error(`[copy-build] Build output not found: ${source}. Run "pnpm build" first.`);
  process.exit(1);
}

if (!fs.existsSync(targetDir)) {
  console.warn(
    `[copy-build] Target scripts dir not found: ${targetDir}\n` +
      `[copy-build] Set FIREBOT_SCRIPTS_DIR to your profile's scripts folder. Skipping copy.`
  );
  process.exit(0);
}

fs.copyFileSync(source, target);
console.log(`[copy-build] Copied ${path.basename(source)} -> ${target}`);
