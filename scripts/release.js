/**
 * Release step run by the Changesets action AFTER a "Version Packages" PR is
 * merged (i.e. when no changesets remain). At that point package.json already
 * carries the bumped version. This script:
 *   1. tags `v<version>` (idempotent — skips if the tag already exists)
 *   2. pushes the tag
 *   3. creates a GitHub Release with the built bundle attached, using the
 *      matching CHANGELOG.md section as the release notes.
 *
 * Requires (provided by the workflow): a built `dist/<scriptOutputName>.js`,
 * `git` push credentials, and `gh` auth via GH_TOKEN/GITHUB_TOKEN.
 */
const { execSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const pkg = require("../package.json");

const version = pkg.version;
const tag = `v${version}`;
const asset = path.join(__dirname, "..", "dist", `${pkg.scriptOutputName}.js`);
const changelogPath = path.join(__dirname, "..", "CHANGELOG.md");

function capture(cmd) {
  return execSync(cmd, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
}

function tagAlreadyExists() {
  try {
    capture(`git rev-parse -q --verify "refs/tags/${tag}"`);
    return true;
  } catch {
    // not a local tag; check the remote too
  }
  try {
    return capture(`git ls-remote --tags origin "refs/tags/${tag}"`).length > 0;
  } catch {
    return false;
  }
}

function changelogSection() {
  try {
    const lines = fs.readFileSync(changelogPath, "utf8").split("\n");
    const start = lines.findIndex((line) => line.trim() === `## ${version}`);
    if (start === -1) return null;
    const rest = lines.slice(start + 1);
    const end = rest.findIndex((line) => /^## /.test(line));
    const body = (end === -1 ? rest : rest.slice(0, end)).join("\n").trim();
    return body.length > 0 ? body : null;
  } catch {
    return null;
  }
}

if (tagAlreadyExists()) {
  console.log(`[release] ${tag} already exists — nothing to release.`);
  process.exit(0);
}

if (!fs.existsSync(asset)) {
  console.error(`[release] Build asset not found: ${asset}. Did the build run?`);
  process.exit(1);
}

const notes = changelogSection() ?? `Release ${tag}`;
const notesFile = path.join(os.tmpdir(), `release-notes-${version}.md`);
fs.writeFileSync(notesFile, notes);

console.log(`[release] Tagging ${tag} and creating GitHub Release with ${path.basename(asset)}`);
execSync(`git tag ${tag}`, { stdio: "inherit" });
execSync(`git push origin ${tag}`, { stdio: "inherit" });
execSync(`gh release create ${tag} "${asset}" --title "${tag}" --notes-file "${notesFile}"`, {
  stdio: "inherit",
});
console.log(`[release] Released ${tag}.`);
