#!/usr/bin/env node
/**
 * ORACLE Build + Release Script (Windows only)
 *
 * Usage:
 *   npm run build:release
 *
 * Prerequisites:
 *   1. Set GITHUB_TOKEN env var with a GitHub personal access token
 *      (needs repo + workflow permissions)
 *   2. Set the publish.owner in electron-builder.yml to your GitHub username
 *   3. Create a GitHub repo named "R6oracel"
 *
 * What it does:
 *   1. Builds the TypeScript packages
 *   2. Builds the Electron app
 *   3. Creates NSIS installer (.exe)
 *   4. Publishes to GitHub Releases (auto-update source)
 *   5. Users download the .exe, install, and auto-update on launch
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const DESKTOP = path.join(ROOT, "apps", "desktop");

function run(cmd: string, cwd: string = ROOT): void {
  console.log(`\n> ${cmd}\n`);
  execSync(cmd, { cwd, stdio: "inherit", env: { ...process.env, FORCE_COLOR: "1" } });
}

function main(): void {
  console.log("╔══════════════════════════════════════╗");
  console.log("║     ORACLE Build + Release           ║");
  console.log("╚══════════════════════════════════════╝");
  console.log("Platform: win");

  // 1. Check prerequisites
  if (!process.env["GITHUB_TOKEN"]) {
    console.error("\n❌ GITHUB_TOKEN not set. Export it first:");
    console.error("   export GITHUB_TOKEN=ghp_your_token_here");
    process.exit(1);
  }

  // 2. Read version from package.json
  const pkg = JSON.parse(fs.readFileSync(path.join(DESKTOP, "package.json"), "utf-8"));
  console.log(`\nVersion: v${pkg.version}`);

  // 3. Install dependencies
  console.log("\n📦 Installing dependencies...");
  run("npm install");

  // 4. Build all packages
  console.log("\n🔨 Building packages...");
  run("npm run build --workspaces --if-present");

  // 5. Build + package Electron app
  console.log("\n🏗️  Building Electron app...");
  run("npm run build:win --workspace=apps/desktop");

  // 6. Publish to GitHub Releases
  console.log("\n🚀 Publishing to GitHub Releases...");
  run("npm run release:win --workspace=apps/desktop");

  console.log("\n✅ Release complete!");
  console.log(`   Version: v${pkg.version}`);
  console.log(`   Installer: apps/desktop/release/ORACLE-${pkg.version}-win-x64.exe`);
  console.log(`   Users will auto-update on next launch.`);
}

main();
