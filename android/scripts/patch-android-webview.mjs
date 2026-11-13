// Install the custom MainActivity (navigation policy + UPI/intent handling)
// into the generated Capacitor Android platform.
// Rule: only overwrite the stock generated MainActivity; refuse anything else.
// Run from the android/ project root after `npx cap add android`:
//   node scripts/patch-android-webview.mjs
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const target = join(
  process.cwd(),
  "android", "app", "src", "main", "java", "com", "restrocontrol", "app", "MainActivity.java"
);
const template = join(here, "MainActivity.java.tmpl");

if (!existsSync(target)) {
  console.error(`[patch-android-webview] MainActivity.java not found at ${target}`);
  console.error("Run this from the android/ directory after `npx cap add android`.");
  process.exit(2);
}

const current = readFileSync(target, "utf8");
const STOCK = `package com.restrocontrol.app;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {}`;

if (current.trim() === STOCK.trim()) {
  writeFileSync(target, readFileSync(template, "utf8"));
  console.log("[patch-android-webview] installed custom MainActivity.java");
} else if (current.includes("shouldOverrideUrlLoading")) {
  console.log("[patch-android-webview] custom MainActivity already installed; nothing to do");
} else {
  console.error("[patch-android-webview] MainActivity.java is neither the stock template nor our custom version.");
  console.error("Refusing to overwrite an unknown file. Review it manually.");
  process.exit(2);
}
