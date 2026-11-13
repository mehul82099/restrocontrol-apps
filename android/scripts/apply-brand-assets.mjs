// Generate branded launcher icons + splash screens from the upstream SaaS
// repo's public mark (pinned commit) using ImageMagick (`convert`).
// Run from the android/ project root after `npx cap add android`:
//   node scripts/apply-brand-assets.mjs
import { execSync } from "node:child_process";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const ICON_URL =
  "https://raw.githubusercontent.com/mehul82099/restrocontrol-saas/446235b5/public/icon-512.png";
const BG = "#0f172a";
const RES = join(process.cwd(), "android", "app", "src", "main", "res");

if (!existsSync(RES)) {
  console.error(`[brand-assets] res/ not found at ${RES}`);
  console.error("Run this from the android/ directory after `npx cap add android`.");
  process.exit(2);
}

try {
  execSync("convert -version", { stdio: "pipe" });
} catch {
  console.error("[brand-assets] ImageMagick `convert` not found. Install ImageMagick first.");
  process.exit(2);
}

const tmp = join(process.cwd(), ".brand-icon-512.png");
execSync(`curl -sfL "${ICON_URL}" -o "${tmp}"`);

// Adaptive-icon foreground densities (108dp box).
const FG = { "mipmap-mdpi": 108, "mipmap-hdpi": 162, "mipmap-xhdpi": 216, "mipmap-xxhdpi": 324, "mipmap-xxxhdpi": 432 };
// Legacy launcher densities (48dp box).
const LEGACY = { "mipmap-mdpi": 48, "mipmap-hdpi": 72, "mipmap-xhdpi": 96, "mipmap-xxhdpi": 144, "mipmap-xxxhdpi": 192 };

for (const [dir, px] of Object.entries(FG)) {
  mkdirSync(join(RES, dir), { recursive: true });
  execSync(`convert "${tmp}" -resize ${px}x${px} "${join(RES, dir, "ic_launcher_foreground.png")}"`);
}
for (const [dir, px] of Object.entries(LEGACY)) {
  mkdirSync(join(RES, dir), { recursive: true });
  execSync(`convert "${tmp}" -background '${BG}' -flatten -resize ${px}x${px} "${join(RES, dir, "ic_launcher.png")}"`);
  execSync(`convert "${tmp}" -background '${BG}' -flatten -resize ${px}x${px} "${join(RES, dir, "ic_launcher_round.png")}"`);
}

// Splash: mark centered on brand background; CENTER_CROP handles aspect.
for (const dir of ["drawable", ...["land-mdpi","land-hdpi","land-xhdpi","land-xxhdpi","land-xxxhdpi","port-mdpi","port-hdpi","port-xhdpi","port-xxhdpi","port-xxxhdpi"].map(d => "drawable-" + d)]) {
  const full = join(RES, dir);
  mkdirSync(full, { recursive: true });
  execSync(`convert "${tmp}" -background '${BG}' -gravity center -extent 1280x1280 "${join(full, "splash.png")}"`);
}

// Adaptive-icon background color.
writeFileSync(
  join(RES, "values", "ic_launcher_background.xml"),
  `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${BG}</color>\n</resources>\n`
);

execSync(`rm -f "${tmp}"`);
console.log("[brand-assets] launcher icons, splash screens and background color applied");
