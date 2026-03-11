#!/usr/bin/env node
/**
 * Release script — usage:
 *   pnpm release "your commit message"               → patch
 *   pnpm release "your commit message" minor         → minor
 *   pnpm release "your commit message" major         → major
 */

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const args = process.argv.slice(2);
const bumpType =
  args.find((a) => ["patch", "minor", "major"].includes(a)) ?? "patch";
const commitMsg = args.find((a) => !["patch", "minor", "major"].includes(a));

if (!commitMsg) {
  console.error(`\x1b[31m✖ Please provide a commit message.\x1b[0m`);
  console.error(`  Usage: pnpm release "your message"`);
  console.error(`         pnpm release "your message" minor`);
  process.exit(1);
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const green = (s) => `\x1b[32m${s}\x1b[0m`;
const yellow = (s) => `\x1b[33m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const bold = (s) => `\x1b[1m${s}\x1b[0m`;

function run(cmd, label) {
  console.log(`\n${bold("▶")} ${label ?? cmd}`);
  try {
    execSync(cmd, { cwd: root, stdio: "inherit" });
  } catch (err) {
    console.error(red(`\n✖ Failed: ${label ?? cmd}`));
    console.error(red(`  Exit code: ${err.status}`));
    process.exit(1);
  }
}

function runCapture(cmd) {
  try {
    return execSync(cmd, { cwd: root, encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

// ── Pre-flight checks ────────────────────────────────────────────────────────

const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
console.log(bold(`\n🚀 songCast release script`));
console.log(`   Current version : ${yellow(pkg.version)}`);
console.log(`   Bump type        : ${yellow(bumpType)}`);
console.log(`   Commit message   : ${yellow(commitMsg)}`);

// Check for uncommitted changes
const dirty = runCapture("git status --porcelain");
if (dirty) {
  console.log(yellow("\n⚠  You have uncommitted changes:"));
  console.log(
    dirty
      .split("\n")
      .map((l) => `   ${l}`)
      .join("\n"),
  );
  console.log(
    yellow(
      "\n   These will be included in the release commit. Continue? (Ctrl+C to abort)",
    ),
  );
  // Give 3 seconds to abort
  execSync("ping -n 4 127.0.0.1 > nul 2>&1 || sleep 3", { stdio: "ignore" });
}

// Check we're on main/master
const branch = runCapture("git rev-parse --abbrev-ref HEAD");
if (branch !== "main" && branch !== "master") {
  console.log(
    yellow(
      `\n⚠  You are on branch "${branch}", not main. Continue? (Ctrl+C to abort)`,
    ),
  );
  execSync("ping -n 4 127.0.0.1 > nul 2>&1 || sleep 3", { stdio: "ignore" });
}

// ── Steps ────────────────────────────────────────────────────────────────────

// 1. Stage and commit any pending changes
if (dirty) {
  run("git add .", "Stage all changes");
  run(`git commit -m "${commitMsg}"`, `Commit: "${commitMsg}"`);
}

// 2. Bump version + create git tag
run(`npm version ${bumpType}`, `Bump ${bumpType} version`);

// 3. Read new version
const newPkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
const newVersion = newPkg.version;

// 4. Push commits + tag → triggers GitHub Actions CI
run("git push --follow-tags", "Push commits and tags to GitHub");

// ── Done ─────────────────────────────────────────────────────────────────────

console.log(
  `\n${green("✔ Release v" + newVersion + " triggered successfully!")}`,
);
console.log(
  `  ${bold("GitHub Actions:")} https://github.com/codeDeSyntax/EV-Songapp/actions`,
);
console.log(
  `  ${bold("Releases:")}       https://github.com/codeDeSyntax/EV-Songapp/releases`,
);
console.log(`\n  CI will build and publish the installer in ~3 minutes.\n`);
