// Force the Android "release" build type to sign with the DEBUG keystore.
// Rule: the review APK is debug-signed only. This keeps `./gradlew assembleRelease`
// producing an installable, debug-signed artifact while never touching a production key.
// Run from the android/ project root:  node scripts/force-debug-signing.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const gradlePath = join(process.cwd(), "android", "app", "build.gradle");

let source;
try {
  source = readFileSync(gradlePath, "utf8");
} catch {
  console.error(`[force-debug-signing] build.gradle not found at ${gradlePath}`);
  console.error("Run this from the android/ directory after `npx cap add android`.");
  process.exit(2);
}

if (source.includes("signingConfig signingConfigs.debug")) {
  console.log("[force-debug-signing] release already uses debug signing; nothing to do");
  process.exit(0);
}

const marker = "minifyEnabled false";
if (!source.includes(marker)) {
  console.error(`[force-debug-signing] marker "${marker}" not found in ${gradlePath}`);
  console.error("Refusing to guess; please add `signingConfig signingConfigs.debug` to the release buildType manually.");
  process.exit(2);
}

const updated = source.replace(
  marker,
  `signingConfig signingConfigs.debug\n            ${marker}`
);
writeFileSync(gradlePath, updated);
console.log("[force-debug-signing] patched android/app/build.gradle: release -> debug signing");
