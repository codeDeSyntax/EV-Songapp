# Electron Auto-Update Migration Guide

Migrating an Electron app from `electron-packager` to `electron-builder` with a full
auto-update system, including the React UI, release pipeline, and all the pain points
that come up in practice.

---

## 1. The Core Problem with electron-packager

`electron-packager` just zips your app into a `.exe` — it has no installer, no update
channel, no delta patching. Users have to manually download and replace the app.

`electron-builder` produces a proper NSIS installer (`.exe` with install/uninstall),
generates a `latest.yml` manifest on every release, and pairs with `electron-updater`
so the running app can check GitHub Releases, download deltas, and install silently.

---

## 2. Dependencies

```jsonc
// package.json
{
  "dependencies": {
    "electron-updater": "^6.1.8", // runtime — must be in dependencies, NOT devDependencies
  },
  "devDependencies": {
    "electron-builder": "^24.13.3",
    // remove electron-packager entirely
  },
}
```

> **Why `electron-updater` in `dependencies`?**  
> It is required at runtime inside the packaged app. If it ends up in `devDependencies`
> and you externalize it from the Vite/Rollup bundle, the installed app will throw
> `Cannot find package 'electron-updater'`.

---

## 3. electron-builder Config (`electron-builder.json5`)

```json5
{
  appId: "com.yourcompany.yourapp",
  productName: "YourApp",
  asar: true,
  directories: {
    output: "release/${version}",
  },

  // Only ship the compiled output — not source or node_modules
  files: ["dist-electron", "dist"],

  win: {
    icon: "public/icon.ico",
    target: [{ target: "nsis", arch: ["x64"] }],
    artifactName: "${productName}_${version}.${ext}",
  },

  nsis: {
    oneClick: false,
    perMachine: false,
    allowToChangeInstallationDirectory: true,
    allowElevation: true,
    deleteAppDataOnUninstall: false,
    installerIcon: "public/icon.ico",
    uninstallerIcon: "public/icon.ico",
    // Kill running process so app.asar isn't locked during install
    include: "build/installer.nsh",
  },

  publish: {
    provider: "github",
    owner: "YOUR_GITHUB_USERNAME",
    repo: "YOUR_REPO_NAME",
    releaseType: "release",
  },
}
```

---

## 4. The NSIS Kill-Script (`build/installer.nsh`)

Without this, updating a running app on Windows fails silently because `app.asar` is
file-locked. Create this file:

```nsh
!macro customInit
  ; Kill the running app before installing so app.asar is not locked
  nsExec::ExecToLog 'taskkill /f /im YourApp.exe'
!macroend
```

Replace `YourApp.exe` with your actual `productName` + `.exe`.

---

## 5. Vite Config — Externalizing `electron-updater`

`electron-updater` must **not** be bundled by Vite/Rollup; it must remain as a
`require()` call resolved from `node_modules` inside the packaged app's `resources/`.

```ts
// vite.config.ts  (main process sub-config)
rollupOptions: {
  external: ["electron", "electron-updater", /^node:/],
},
```

And in the main process **always** load it via `createRequire` — never a static import:

```ts
// electron/main/update.ts
import { createRequire } from "node:module";
const { autoUpdater } = createRequire(import.meta.url)("electron-updater");
```

Using a static `import { autoUpdater } from "electron-updater"` causes Vite to try to
bundle it, which either OOMs the build or produces a bundle that fails at runtime.

---

## 6. The Update Module (`electron/main/update.ts`)

Keep all update logic isolated in its own file. Call it once from `main/index.ts` after
the main window is created.

```ts
import { app, ipcMain } from "electron";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import type {
  ProgressInfo,
  UpdateDownloadedEvent,
  UpdateInfo,
} from "electron-updater";

const { autoUpdater } = createRequire(import.meta.url)("electron-updater");

// ── Preferences (manual vs auto download) ────────────────────────────────────

function prefsPath() {
  return path.join(app.getPath("userData"), "update-prefs.json");
}
function readPrefs(): { autoUpdate: boolean } {
  try {
    return JSON.parse(fs.readFileSync(prefsPath(), "utf8"));
  } catch {
    return { autoUpdate: false };
  }
}
function writePrefs(prefs: { autoUpdate: boolean }) {
  fs.writeFileSync(prefsPath(), JSON.stringify(prefs, null, 2), "utf8");
}

// ── Main export ───────────────────────────────────────────────────────────────

export function update(win: Electron.BrowserWindow) {
  const prefs = readPrefs();
  autoUpdater.autoDownload = prefs.autoUpdate;
  autoUpdater.disableWebInstaller = false;
  autoUpdater.allowDowngrade = false;

  const send = (status: string, extra?: object) => {
    if (!win.isDestroyed())
      win.webContents.send("update-status", { status, ...extra });
  };

  autoUpdater.on("checking-for-update", () => send("checking"));
  autoUpdater.on("update-available", (info: UpdateInfo) => {
    if (autoUpdater.autoDownload) {
      send("downloading", { version: info.version, percent: 0 });
    } else {
      send("available", { version: info.version });
    }
  });
  autoUpdater.on("update-not-available", () => send("up-to-date"));
  autoUpdater.on("download-progress", (info: ProgressInfo) =>
    send("downloading", { percent: Math.floor(info.percent) }),
  );
  autoUpdater.on("update-downloaded", (info: UpdateDownloadedEvent) =>
    send("ready", { version: info.version }),
  );
  autoUpdater.on("error", (err: Error) =>
    send("error", { message: err.message }),
  );

  // IPC handlers
  ipcMain.handle("check-update", async () => {
    try {
      send("checking");
      return await autoUpdater.checkForUpdatesAndNotify();
    } catch (err: any) {
      send("error", { message: err.message });
    }
  });
  ipcMain.handle("download-update", async () => {
    try {
      send("downloading", { percent: 0 });
      await autoUpdater.downloadUpdate();
    } catch (err: any) {
      send("error", { message: err.message });
    }
  });
  ipcMain.handle("get-update-preference", () => readPrefs());
  ipcMain.handle("set-update-preference", (_e, p: { autoUpdate: boolean }) => {
    writePrefs(p);
    autoUpdater.autoDownload = p.autoUpdate;
    return p;
  });
  ipcMain.handle("quit-and-install", () =>
    autoUpdater.quitAndInstall(false, true),
  );

  // Auto-check 3 seconds after window loads (gives renderer time to mount)
  win.webContents.once("did-finish-load", () => {
    setTimeout(
      () => autoUpdater.checkForUpdatesAndNotify().catch(() => {}),
      3000,
    );
  });
}
```

Wire it in `index.ts`:

```ts
import { update } from "./update";
// ...after mainWin is created:
update(mainWin);
```

---

## 7. Expose IPC to the Renderer (`electron/preload/index.ts`)

The renderer cannot call `ipcMain` directly — it goes through the preload:

```ts
import { ipcRenderer, contextBridge } from "electron";

contextBridge.exposeInMainWorld("ipcRenderer", {
  on: (channel, listener) =>
    ipcRenderer.on(channel, (event, ...args) => listener(event, ...args)),
  off: (channel, ...args) => ipcRenderer.off(channel, ...args),
  send: (channel, ...args) => ipcRenderer.send(channel, ...args),
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
});
```

---

## 8. The React UpdateManager Component

The component lives in the renderer and communicates via `window.ipcRenderer`.

### Key patterns

**Use a portal** — the title bar has a stacking context (`z-index`, `position: fixed`).
A dropdown rendered inside it will be clipped. Use `ReactDOM.createPortal` to render
the panel into `document.body` at `position: fixed`:

```tsx
import ReactDOM from "react-dom";

const panelPortal = showPanel
  ? ReactDOM.createPortal(<PanelJSX />, document.body)
  : null;
```

**Calculate position from the button's bounding rect** at click time:

```tsx
const btnRef = useRef<HTMLButtonElement>(null);

const handleToggle = () => {
  if (!showPanel && btnRef.current) {
    const rect = btnRef.current.getBoundingClientRect();
    // Right-align: panel right edge aligns with button right edge
    setPanelPos({
      top: rect.bottom + 6,
      right: window.innerWidth - rect.right,
    });
  }
  setShowPanel((v) => !v);
};
```

Use `right` instead of `left` when the button is near the right edge of the window, so
the panel opens inward and never overflows off-screen.

**Declare the build-time version constant** (injected by Vite `define`):

```tsx
declare const __APP_VERSION__: string;
```

**Listen for update events** with `useEffect` cleanup:

```tsx
useEffect(() => {
  const handler = (_e: any, arg: any) => {
    if (arg.status === "available") {
      setUpdateStatus("available");
      setUpdateVersion(arg.version);
    } else if (arg.status === "downloading") {
      setUpdateStatus("downloading");
      setDownloadPercent(arg.percent ?? 0);
    } else if (arg.status === "ready") {
      setUpdateReady(true);
      setUpdateVersion(arg.version);
    } else if (arg.status === "up-to-date") {
      setUpdateStatus("up-to-date");
    } else if (arg.status === "error") {
      setUpdateStatus("error");
      setUpdateError(arg.message);
    }
  };
  window.ipcRenderer.on("update-status", handler);
  return () => window.ipcRenderer.off("update-status", handler);
}, []);
```

**Close the panel when clicking outside** — attach to `document` only while open:

```tsx
useEffect(() => {
  const handler = (e: MouseEvent) => {
    if (
      panelRef.current &&
      !panelRef.current.contains(e.target as Node) &&
      btnRef.current &&
      !btnRef.current.contains(e.target as Node)
    ) {
      setShowPanel(false);
    }
  };
  if (showPanel) document.addEventListener("mousedown", handler);
  return () => document.removeEventListener("mousedown", handler);
}, [showPanel]);
```

**Use concrete Tailwind classes, not CSS variables** — CSS variables from your theme
may be undefined inside a portal that renders in `document.body` outside your theme
provider. Use explicit classes like `bg-white dark:bg-zinc-800`, not `bg-app-surface`.

---

## 9. Vite `define` — Make Version Available to Renderer

```ts
// vite.config.ts
define: {
  __APP_VERSION__: JSON.stringify(pkg.version),
},
```

Then in any renderer file:

```ts
declare const __APP_VERSION__: string;
// use as: `v${__APP_VERSION__}`
```

---

## 10. GitHub Actions Workflow (`.github/workflows/release.yml`)

```yaml
name: Release

on:
  push:
    tags:
      - "v*" # triggered by git tags like v1.0.10

jobs:
  build-windows:
    runs-on: windows-latest
    permissions:
      contents: write # required to create GitHub Releases

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: latest

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - run: pnpm install

      - name: Build and publish
        env:
          GH_TOKEN: ${{ secrets.GH_TOKEN }} # repo secret with Release write permission
        run: pnpm run build && pnpm exec electron-builder --win --publish=always
```

**GitHub secret setup:**

1. GitHub → Settings → Developer settings → Personal access tokens → Fine-grained
2. Grant **Contents: write** on your repo
3. Add as `GH_TOKEN` in repo Secrets

---

## 11. Release Script (`scripts/release.mjs`)

Automate the entire release flow from the terminal:

```js
#!/usr/bin/env node
// Usage: pnpm release "commit message"         → patch (1.0.9 → 1.0.10)
//        pnpm release "commit message" minor   → minor (1.0.9 → 1.1.0)
//        pnpm release "commit message" major   → major (1.0.9 → 2.0.0)

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const bumpType =
  args.find((a) => ["patch", "minor", "major"].includes(a)) ?? "patch";
const commitMsg = args.find((a) => !["patch", "minor", "major"].includes(a));

if (!commitMsg) {
  console.error("Provide a commit message");
  process.exit(1);
}

const run = (cmd) => execSync(cmd, { cwd: root, stdio: "inherit" });

const dirty = execSync("git status --porcelain", {
  cwd: root,
  encoding: "utf8",
}).trim();
if (dirty) {
  run("git add .");
  run(`git commit -m "${commitMsg}"`);
}
run(`npm version ${bumpType}`); // bumps package.json + creates git tag
run("git push --follow-tags"); // push commits + tag → triggers CI
```

Add to `package.json`:

```json
"scripts": {
  "release": "node scripts/release.mjs"
}
```

---

## 12. `.npmrc` — Prevent OOM on Large Dependency Trees

```ini
node-linker=hoisted
node-options=--max-old-space-size=8192
```

`node-linker=hoisted` makes pnpm behave like npm for native module resolution
(important for `electron-updater` and `electron-builder`). The heap flag prevents
out-of-memory crashes during production builds.

---

## 13. Common Pitfalls & Fixes

| Symptom                                                   | Root Cause                                                | Fix                                                                     |
| --------------------------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------- |
| `Cannot find package 'electron-updater'` in installed app | Placed in `devDependencies` or bundled+externalized wrong | Keep in `dependencies`; externalize in Rollup                           |
| `app.asar` locked, update silently fails                  | App still running during NSIS install                     | Add `build/installer.nsh` with `taskkill`                               |
| Update dropdown invisible / clipped                       | Rendered inside title bar stacking context                | Use `ReactDOM.createPortal` to `document.body`                          |
| Panel styles wrong (invisible/wrong color)                | CSS variables undefined outside theme provider            | Use concrete Tailwind classes, not CSS vars                             |
| Panel opens off-screen to the right                       | Using `left: rect.left` for a right-side button           | Use `right: window.innerWidth - rect.right`                             |
| Build OOMs on heavy dependencies during `dev` watch       | Vite bundling large packages on every hot reload          | Externalize them in dev only: `isServe ? [...] : []`                    |
| `electron` binary missing after fresh install             | `pnpm` didn't run the postinstall download                | Run `node node_modules/electron/install.js` manually                    |
| Renderer doesn't receive `update-status` on startup       | Event fired before React component mounts                 | Delay `checkForUpdatesAndNotify()` by 3 seconds after `did-finish-load` |
| `electron-updater` static import bundled by Vite          | Vite sees the import and tries to inline it               | Always load via `createRequire(import.meta.url)("electron-updater")`    |

---

## 14. Migration Checklist

- [ ] Add `electron-builder` to `devDependencies`
- [ ] Move `electron-updater` to `dependencies`
- [ ] Create `electron-builder.json5` with `publish` block pointing to your GitHub repo
- [ ] Create `build/installer.nsh` with `taskkill` macro
- [ ] Add `"electron-updater"` to Rollup `external` in `vite.config.ts`
- [ ] Create `electron/main/update.ts` and call `update(mainWin)` in `main/index.ts`
- [ ] Expose `ipcRenderer` in preload via `contextBridge`
- [ ] Add `__APP_VERSION__` to Vite `define`
- [ ] Add `UpdateManager` React component to title bar using portal pattern
- [ ] Create `.github/workflows/release.yml`
- [ ] Add `GH_TOKEN` secret to GitHub repo settings
- [ ] Set `node-linker=hoisted` in `.npmrc`
- [ ] Remove `electron-packager` script from `package.json` (or update it)
- [ ] Run a test release with `npm version patch && git push --follow-tags`
- [ ] Verify GitHub Actions creates the release and uploads the installer
- [ ] Install the built `.exe` and confirm the update check fires on startup
