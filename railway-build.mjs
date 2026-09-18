#!/usr/bin/env node
/**
 * Railway production build. Unpacks src.zip / public.zip when the GitHub
 * web upload could not send every file, then runs Vite.
 */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { inflateRawSync } from "node:zlib";

const root = dirname(fileURLToPath(import.meta.url));
process.chdir(root);
process.env.NITRO_PRESET ||= "node-server";
process.env.VITE_AUTH_ENABLED ||= "false";

if (!existsSync("package.json") && existsSync("swift-hand/package.json")) {
  console.error(
    "[railway-build] package.json is inside a swift-hand folder.\n" +
      "In Railway → Service → Settings → Root Directory, set: swift-hand",
  );
  process.exit(1);
}

function extractZip(zipPath, destDir) {
  const data = readFileSync(zipPath);
  let offset = 0;
  let files = 0;
  while (offset + 30 <= data.length) {
    if (data.readUInt32LE(offset) !== 0x04034b50) break;
    const flags = data.readUInt16LE(offset + 6);
    const method = data.readUInt16LE(offset + 8);
    let compSize = data.readUInt32LE(offset + 18);
    const nameLen = data.readUInt16LE(offset + 26);
    const extraLen = data.readUInt16LE(offset + 28);
    const name = data.subarray(offset + 30, offset + 30 + nameLen).toString("utf8");
    let start = offset + 30 + nameLen + extraLen;
    if (flags & 0x8) {
      throw new Error(`zip data descriptors are not supported (${name})`);
    }
    const compressed = data.subarray(start, start + compSize);
    offset = start + compSize;
    if (!name || name.endsWith("/")) continue;
    let out;
    if (method === 0) out = compressed;
    else if (method === 8) out = inflateRawSync(compressed);
    else throw new Error(`unsupported zip method ${method} for ${name}`);
    const dest = join(destDir, name);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, out);
    files += 1;
  }
  if (!files) throw new Error(`no files extracted from ${zipPath}`);
  console.log(`[railway-build] extracted ${files} files from ${zipPath} → ${destDir}`);
}

function unpackBundles() {
  const srcZip = join(root, "src.zip");
  const publicZip = join(root, "public.zip");
  const scriptsZip = join(root, "scripts.zip");
  const serverZip = join(root, "server.zip");
  if (existsSync(srcZip) && !existsSync(join(root, "src/router.tsx"))) {
    extractZip(srcZip, join(root, "src"));
  }
  if (existsSync(publicZip) && !existsSync(join(root, "public/cards/ace_of_spades.png"))) {
    extractZip(publicZip, join(root, "public"));
  }
  if (existsSync(scriptsZip) && !existsSync(join(root, "scripts/grok-pwa-plugin.mjs"))) {
    extractZip(scriptsZip, join(root, "scripts"));
  }
  if (existsSync(serverZip) && !existsSync(join(root, "server/middleware/grok-pwa.ts"))) {
    extractZip(serverZip, join(root, "server"));
  }
}

unpackBundles();

if (!existsSync(join(root, "src/router.tsx"))) {
  console.error(
    "[railway-build] src/router.tsx is missing.\n" +
      "Upload src.zip from the GitHub package to the repo root, then redeploy.",
  );
  process.exit(1);
}

function run(file, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [file, ...args], {
      stdio: "inherit",
      env: process.env,
      cwd: root,
    });
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`${file} ${signal || `exit ${code}`}`));
    });
  });
}

const viteBin = join(root, "node_modules/vite/bin/vite.js");
if (!existsSync(viteBin)) {
  console.error("[railway-build] vite is not installed. Use npm install --include=dev first.");
  process.exit(1);
}

await run(viteBin, ["build"]);

const migrate = join(root, "scripts/migrate.mjs");
if (existsSync(migrate)) {
  await run(migrate);
}
