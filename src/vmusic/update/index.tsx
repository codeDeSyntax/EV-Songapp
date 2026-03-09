import type { ProgressInfo } from "electron-updater";
import { useCallback, useEffect } from "react";

// This component has no visible UI — it runs silently in the background.
// The TitleBar shows a badge when update-downloaded fires.
const Update = () => {
  const onUpdateCanAvailable = useCallback(
    (_event: Electron.IpcRendererEvent, arg1: VersionInfo) => {
      // update is downloading silently — no UI yet
      console.log("[updater] update available:", arg1.newVersion);
    },
    [],
  );

  const onDownloadProgress = useCallback(
    (_event: Electron.IpcRendererEvent, arg1: ProgressInfo) => {
      console.log(
        "[updater] download progress:",
        arg1.percent?.toFixed(1) + "%",
      );
    },
    [],
  );

  useEffect(() => {
    window.ipcRenderer.on("update-can-available", onUpdateCanAvailable);
    window.ipcRenderer.on("download-progress", onDownloadProgress);

    // Trigger the silent check on startup
    window.ipcRenderer.invoke("check-update").catch(() => {});

    return () => {
      window.ipcRenderer.off("update-can-available", onUpdateCanAvailable);
      window.ipcRenderer.off("download-progress", onDownloadProgress);
    };
  }, []);

  return null;
};

export default Update;
