// Decode build/icon.ico.base64 -> build/icon.ico (the repo stores the binary
// icon as base64 text; electron-builder needs the real .ico).
// Run from the windows/ directory:  node scripts/prepare-icon.mjs
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const b64Path = join(process.cwd(), "build", "icon.ico.base64");
const icoPath = join(process.cwd(), "build", "icon.ico");
if (!existsSync(b64Path)) {
  console.error(`[prepare-icon] ${b64Path} not found. Run from the windows/ directory.`);
  process.exit(2);
}
writeFileSync(icoPath, Buffer.from(readFileSync(b64Path, "utf8"), "base64"));
console.log("[prepare-icon] build/icon.ico written");
