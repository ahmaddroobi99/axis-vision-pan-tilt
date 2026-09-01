#!/usr/bin/env node
/**
 * Production build. Uses the sandbox env wrapper when present so local Grok
 * builds keep VITE_AUTH_ENABLED in sync; otherwise runs `vite build` so GitHub
 * / Vercel clones work without the private helper scripts.
 */
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.status) process.exit(result.status);
}

if (existsSync("scripts/with-app-env.mjs")) {
  run("node", ["scripts/with-app-env.mjs", "vite", "build"]);
} else {
  run("npx", ["vite", "build"]);
}

if (existsSync("scripts/migrate.mjs")) {
  run("npm", ["run", "db:migrate"]);
}
