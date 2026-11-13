# RestroControl Windows shell (Electron + electron-builder)

Desktop shell that loads the live SaaS app at https://restrocontrol.new.tg in a
BrowserWindow. Security posture baked into main.js:
- contextIsolation: true, nodeIntegration: false, sandbox: true
- session partition `persist:restrocontrol` (login/session survive restarts)
- autoHideMenuBar + menu bar hidden
- setWindowOpenHandler: only razorpay.com (plus its subdomains) may open in the
  system browser; every other popup/new-window is denied.
- will-navigate: navigation away from restrocontrol.new.tg is denied unless the
  target is in the external allowlist (then opened externally).
- Google sign-in is INTERCEPTED with an in-app notice: the OAuth state cookie is
  set in the app session but the callback would land in the system browser
  without it, so the flow always fails. Email/password login works fully in-app.
  Supporting Google sign-in properly needs a server-side deep-link handoff
  (production change, not done here).

Status: v0.1.0-review | Payments: PENDING (Razorpay domain approval required).

## Build (Windows 10/11 or CI)
```
cd windows
npm install                 # npm ci once a package-lock.json is committed
npm run build:nsis          # electron-builder --win nsis
```
Artifact: windows/dist/RestroControl-Setup-0.1.0.exe (NSIS installer, x64).

## App icon
The repo stores the icon as TEXT: windows/build/icon.ico.base64 (a
multi-resolution ICO 256..16 generated from the brand mark,
public/icon-512.png @ 446235b5, base64-encoded so the repo carries no binary).
`npm run prepare:icon` (also run by build:nsis and CI) decodes it to
windows/build/icon.ico before electron-builder runs.

## QA gaps (cannot be verified without physical devices / a real environment)
- Install/uninstall of the NSIS package on clean Windows 10/11.
- Signed installer (currently unsigned; zero-spend rule - no code-signing cert).
- Razorpay checkout in the Electron session (checkout.js iframe should work;
  needs a real run).
- Session persistence across restarts on a real machine.
- HiDPI/DPI scaling and window behavior on various screen configs.
- Verified WITHOUT devices: dependency install, packaging (asar contents),
  main.js syntax, and the navigation/allowlist logic by code inspection. The
  NSIS build itself requires Windows (CI windows-latest); it cannot build on
  Linux without wine.
