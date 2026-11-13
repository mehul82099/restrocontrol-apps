# RestroControl Apps v1

Thin client shells around the live RestroControl SaaS app (Next.js) at
https://restrocontrol.new.tg. Upstream repo: https://github.com/mehul82099/restrocontrol-saas
(pinned commit 446235b5).

These shells do NOT copy server logic. Auth, sessions, orders, inventory and
payments all run in the hosted app; the clients are a WebView (Android) and a
BrowserWindow (Windows) pointed at the live server.

## Status labels
- Version: v0.1.0-review — internal/QA review build only. Not for store publishing.
- Payments: PENDING — Razorpay domain approval required before any live payment
  flow can function. Payment is NOT claimed to work. Until approval, payment
  flows in the app are non-functional.

## Packages
| Path      | Stack                                    | Purpose                          |
|-----------|------------------------------------------|----------------------------------|
| android/  | Capacitor 7 (Android)                    | WebView shell, appId com.restrocontrol.app |
| windows/  | Electron + electron-builder (NSIS)       | Desktop shell, Windows installer |

## Known integration limits (v0.1.0-review)
- Google sign-in does NOT work inside either shell: the OAuth state cookie is
  set in the app session but the callback would land in the external browser
  without it. The shells intercept the button and show a notice instead of
  failing silently. Email/password login works fully. A proper fix needs a
  server-side deep-link handoff (production change, not done here).
- Razorpay checkout runs in its in-page iframe and is expected to work; UPI
  app handoff on Android only works for main-frame links. Payments are
  PENDING Razorpay domain approval regardless.

## Build

Android (Linux/macOS; JDK 21 + Android SDK platform 35 + ImageMagick):
```
cd android
npm install                     # npm ci once a package-lock.json is committed
npx cap add android             # first time only: generates the native android/ platform
node scripts/patch-android-webview.mjs   # custom MainActivity
node scripts/apply-brand-assets.mjs      # brand icons + splash
npx cap sync android
node scripts/force-debug-signing.mjs   # release buildType -> debug keystore (review rule)
cd android && ./gradlew assembleRelease
```
Artifact: android/android/app/build/outputs/apk/release/app-release.apk
(debug-signed; install via `adb install`; NEVER publish to stores).

Windows (Windows 10/11; CI builds it automatically):
```
cd windows
npm install                     # npm ci once a package-lock.json is committed
npm run build:nsis
```
Artifact: windows/dist/RestroControl-Setup-0.1.0.exe.

CI/CD: pushing a `v*` tag triggers .github/workflows/build-apps.yml:
ubuntu-latest builds the APK, windows-latest builds the EXE, and a
softprops/action-gh-release step attaches both to a GitHub PRE-RELEASE
labeled "(review)". No secrets are used anywhere in the pipeline.

## Branding / icons
All artwork is sourced from the upstream repo's public assets, pinned to commit
446235b5 (public/icon-512.png, public/icon-192.png, src/app/favicon.ico,
apple-icon.png; palette #0f172a / #10b981 from public/manifest.json).
- Android adaptive icon + splash: see android/README.md
- Windows app icon: see windows/README.md

## Guardrails
- Zero spend: no paid services, certificates, or store accounts.
- No secrets in any file. External links are restricted to an allowlist
  (razorpay.com, accounts.google.com) — everything else is denied.
- Debug signing ONLY for the review APK; no production keystore; no store publishing.
- Remote-only content: clients load the live server; no API keys are bundled.

## QA verification gaps
Items that cannot be verified without physical devices / a real environment are
listed in the QA section of the delivery report and repeated in each app's
README.
