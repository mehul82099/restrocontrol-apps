# RestroControl Android shell (Capacitor 7)

Thin WebView shell around the live RestroControl SaaS app. It loads
https://restrocontrol.new.tg in a Capacitor WebView; all auth, sessions, orders,
inventory and payment logic run in the hosted app. Nothing is bundled locally.

Status: v0.1.0-review | Payments: PENDING (Razorpay domain approval required).

## Prerequisites
- Node.js 20+
- JDK 21 (Capacitor 7 requires it; JDK 17 fails with "invalid source release: 21")
- Android SDK (platform 35) with ANDROID_HOME set
- ImageMagick (`convert`) for the brand-assets script

## Build
```
cd android
npm install                 # npm ci once a package-lock.json is committed
npx cap add android         # first time only: generates the native android/ platform
node scripts/patch-android-webview.mjs   # custom MainActivity: navigation policy + UPI/intent handling
node scripts/apply-brand-assets.mjs      # launcher icons + splash from the upstream brand mark
npx cap sync android        # copies config/plugins into the platform
node scripts/force-debug-signing.mjs   # release buildType -> debug keystore (review rule)
cd android && ./gradlew assembleRelease   # gradlew lives in the generated platform dir
```
Artifact: android/android/app/build/outputs/apk/release/app-release.apk
(debug-signed; install with `adb install`; NEVER for store publishing).

The `npx cap add android` step is also performed by CI when the generated
android/ platform folder is not committed. Re-running `npx cap sync android`
does not overwrite custom res/ assets.

## Branding: adaptive icon + splash

`node scripts/apply-brand-assets.mjs` generates all of it from the live repo's
public mark, pinned to commit 446235b5:
- Mark: https://raw.githubusercontent.com/mehul82099/restrocontrol-saas/446235b5/public/icon-512.png (512x512, maskable)
- Palette (from public/manifest.json): background #0f172a, accent #10b981
- Adaptive foreground at all 5 densities, legacy + round icons (minSdk 23 < 26),
  1280x1280 splash in every drawable-* bucket, ic_launcher_background #0f172a.
- Capacitor splash colors are already set in capacitor.config.json.

## In-app behavior (custom MainActivity)
- Navigation stays inside the WebView only on restrocontrol.new.tg; other hosts
  go to the external browser (Capacitor default).
- Google sign-in is INTERCEPTED with an explanatory toast: the OAuth state
  cookie is set in the WebView but the callback would land in the external
  browser without it, so the flow always fails. Email/password login works
  fully in-app. Supporting Google sign-in properly needs a server-side
  deep-link handoff (production change, not done here).
- upi:// and intent:// links (Razorpay UPI) are handed to Android. This only
  works for main-frame navigations; UPI launches from inside the checkout
  iframe are a WebView platform limitation and remain a device-test gap.

## Signing
The review APK is signed with the Android debug keystore (see
scripts/force-debug-signing.mjs). No production keystore exists. Store publishing
is out of scope, and this artifact must never be uploaded to any store.

## QA gaps (cannot be verified without physical devices)
- Real rendering, safe-area insets, and adaptive-icon masking on physical Android devices.
- In-app WebView session persistence across cold starts.
- Razorpay checkout inside the WebView (card/netbanking expected to work in the
  iframe; UPI app handoff only works for main-frame links, see above).
- Push notifications on-device.
- Verified WITHOUT devices: full bootstrap (npm install, cap add/sync), custom
  MainActivity compiles, brand assets generate, release APK builds and is
  debug-signed (apksigner-verified).
