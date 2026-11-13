// RestroControl Windows shell (Electron).
// Loads the live SaaS app; enforces a strict external-link allowlist.
const { app, BrowserWindow, shell, dialog } = require("electron");

const APP_URL = "https://restrocontrol.new.tg";
const APP_HOST = "restrocontrol.new.tg";

// Google sign-in start route on our own origin. The OAuth flow sets a state
// cookie here that the callback needs, so handing the flow to the system
// browser strands the cookie and always fails. Intercept and explain instead.
const GOOGLE_START_PATH = "/api/auth/google/start";

// Only these hosts may open an external browser. Everything else is denied.
const EXTERNAL_ALLOWLIST = ["razorpay.com"];

function hostIsAllowed(hostname) {
  return EXTERNAL_ALLOWLIST.some(
    (domain) => hostname === domain || hostname.endsWith("." + domain)
  );
}

function openExternalIfAllowed(url) {
  try {
    const { hostname } = new URL(url);
    if (hostIsAllowed(hostname)) {
      shell.openExternal(url);
    }
  } catch {
    // Unparseable URL: deny.
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 480,
    minHeight: 720,
    title: "RestroControl",
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      // persist:restrocontrol keeps cookies/sessions across restarts.
      partition: "persist:restrocontrol"
    }
  });

  win.setMenuBarVisibility(false);

  win.once("ready-to-show", () => win.show());

  // Popups / target=_blank: open allowed external hosts in the system browser,
  // deny everything else (including any in-app popup).
  win.webContents.setWindowOpenHandler(({ url }) => {
    openExternalIfAllowed(url);
    return { action: "deny" };
  });

  // Top-level navigation away from the app origin: deny, unless the target
  // host is in the external allowlist (then open it in the system browser).
  win.webContents.on("will-navigate", (event, url) => {
    try {
      const parsed = new URL(url);
      if (parsed.hostname === APP_HOST && parsed.pathname.startsWith(GOOGLE_START_PATH)) {
        event.preventDefault();
        dialog.showMessageBox(win, {
          type: "info",
          title: "Google sign-in",
          message: "Google sign-in is not available in the desktop app yet.",
          detail: "Please sign in with your email and password."
        });
        return;
      }
      if (parsed.hostname !== APP_HOST) {
        event.preventDefault();
        openExternalIfAllowed(url);
      }
    } catch {
      event.preventDefault();
    }
  });

  win.loadURL(APP_URL);
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
