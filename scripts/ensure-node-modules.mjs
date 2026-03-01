import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const rootDir = process.cwd();
const nodeModulesDir = path.join(rootDir, "node_modules");
const stampFile = path.join(rootDir, ".node_modules-platform");
const currentPlatformTag = `${process.platform}-${process.arch}`;

const rollupPackageByPlatform = {
  "linux-x64": "@rollup/rollup-linux-x64-gnu",
  "linux-arm64": "@rollup/rollup-linux-arm64-gnu",
  "win32-x64": "@rollup/rollup-win32-x64-msvc",
  "win32-arm64": "@rollup/rollup-win32-arm64-msvc",
  "darwin-x64": "@rollup/rollup-darwin-x64",
  "darwin-arm64": "@rollup/rollup-darwin-arm64",
};

const expectedRollupPackage = rollupPackageByPlatform[currentPlatformTag] || null;

function readStamp() {
  try {
    return fs.readFileSync(stampFile, "utf8").trim() || null;
  } catch {
    return null;
  }
}

function hasExpectedRollupPackage() {
  if (!expectedRollupPackage) return true;
  const pkgPath = path.join(nodeModulesDir, ...expectedRollupPackage.split("/"));
  return fs.existsSync(pkgPath);
}

function runInstall() {
  const npmExecPath = process.env.npm_execpath;
  const result = npmExecPath
    ? spawnSync(process.execPath, [npmExecPath, "install"], { stdio: "inherit" })
    : spawnSync("npm", ["install"], {
      stdio: "inherit",
      shell: process.platform === "win32",
    });

  if (result.error) {
    console.error(`Failed to run npm install: ${result.error.message}`);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const hasNodeModules = fs.existsSync(nodeModulesDir);
const stampedPlatform = readStamp();

const platformChanged = Boolean(stampedPlatform && stampedPlatform !== currentPlatformTag);
const missingRollupNative = hasNodeModules && !hasExpectedRollupPackage();

if (!hasNodeModules || platformChanged || missingRollupNative) {
  if (platformChanged) {
    console.log(`node_modules were built for ${stampedPlatform}; rebuilding for ${currentPlatformTag}...`);
  } else if (missingRollupNative) {
    console.log(`Missing ${expectedRollupPackage}; reinstalling dependencies for ${currentPlatformTag}...`);
  } else {
    console.log("Installing dependencies...");
  }

  if (hasNodeModules) {
    fs.rmSync(nodeModulesDir, { recursive: true, force: true });
  }

  runInstall();
}

try {
  fs.writeFileSync(stampFile, `${currentPlatformTag}\n`, "utf8");
} catch {
  // Non-fatal; startup can proceed without stamp
}
