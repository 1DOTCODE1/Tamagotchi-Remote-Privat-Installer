import { cp, mkdir, rm } from "node:fs/promises";
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

console.log("Built self-hosted site in ./dist");
