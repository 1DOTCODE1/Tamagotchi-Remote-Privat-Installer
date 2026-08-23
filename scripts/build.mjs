import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const source = path.join(root, "site");
const dist = path.join(root, "dist");
const vendorSource = path.join(root, "node_modules", "esp-web-tools", "dist", "web");
const vendorTarget = path.join(dist, "vendor", "esp-web-tools");

if (!existsSync(vendorSource)) {
  throw new Error("esp-web-tools is not installed. Run npm install first.");
}

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(source, dist, { recursive: true });
await mkdir(path.dirname(vendorTarget), { recursive: true });
await cp(vendorSource, vendorTarget, { recursive: true });

const manifestPath = path.join(dist, "manifest.json");
const otaPath = path.join(dist, "firmware", "tamagotchi-remote.ota.bin");

if (!existsSync(otaPath)) {
  throw new Error("Missing firmware/tamagotchi-remote.ota.bin required for managed updates.");
}

const otaBinary = await readFile(otaPath);
const otaMd5 = createHash("md5").update(otaBinary).digest("hex");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

for (const build of manifest.builds ?? []) {
  if (build.chipFamily !== "ESP32-S3") continue;
  build.ota = {
    path: "firmware/tamagotchi-remote.ota.bin",
    md5: otaMd5,
  };
}

await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`OTA MD5: ${otaMd5}`);
console.log("Built self-hosted site in ./dist");
