import React, { useState, useEffect, useRef } from "react";
import {
  RefreshCcw,
  AlertCircle,
  CheckCircle2,
  ArrowDownToLine,
  CloudDownload,
} from "lucide-react";

type UpdateStatus =
  | "idle"
  | "checking"
  | "available"
  | "downloading"
  | "up-to-date"
  | "error";

const UpdateManager: React.FC = () => {
  const [updateReady, setUpdateReady] = useState(false);
  const [updateVersion, setUpdateVersion] = useState<string | null>(null);
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>("idle");
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [downloadPercent, setDownloadPercent] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const [isManualChecking, setIsManualChecking] = useState(false);
  const [autoUpdate, setAutoUpdate] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  // Load auto-update preference on mount
  useEffect(() => {
    window.ipcRenderer
      .invoke("get-update-preference")
      .then((prefs: { autoUpdate: boolean }) => {
        setAutoUpdate(prefs?.autoUpdate ?? false);
      })
      .catch(() => setAutoUpdate(false));
  }, []);
  useEffect(() => {
    const onDownloaded = (_e: any, info?: { version?: string }) => {
      setUpdateReady(true);
      setUpdateVersion(info?.version ?? null);
      setUpdateStatus("idle");
    };
    const onAvailable = (_e: any, arg: { newVersion?: string }) => {
      if (arg?.newVersion) setUpdateVersion(arg.newVersion);
    };
    const onStatus = (
      _e: any,
      arg: {
        status: string;
        version?: string;
        percent?: number;
        message?: string;
      },
    ) => {
      if (arg.status === "checking") {
        setUpdateStatus("checking");
      } else if (arg.status === "available") {
        setUpdateStatus("available");
        if (arg.version) setUpdateVersion(arg.version);
      } else if (arg.status === "downloading") {
        setUpdateStatus("downloading");
        if (arg.percent !== undefined)
          setDownloadPercent(Math.round(arg.percent));
        if (arg.version) setUpdateVersion(arg.version);
      } else if (arg.status === "up-to-date") {
        setUpdateStatus("up-to-date");
        setTimeout(() => setUpdateStatus("idle"), 5000);
      } else if (arg.status === "error") {
        setUpdateStatus("error");
        setUpdateError(arg.message ?? "Unknown error");
        setTimeout(() => setUpdateStatus("idle"), 8000);
      } else if (arg.status === "ready") {
        setUpdateStatus("idle");
      }
    };

    window.ipcRenderer.on("update-downloaded", onDownloaded);
    window.ipcRenderer.on("update-can-available", onAvailable);
    window.ipcRenderer.on("update-status", onStatus);
    return () => {
      window.ipcRenderer.off("update-downloaded", onDownloaded);
      window.ipcRenderer.off("update-can-available", onAvailable);
      window.ipcRenderer.off("update-status", onStatus);
    };
  }, []);

  // Close panel on outside click
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

  const handleManualCheck = async () => {
    setIsManualChecking(true);
    setUpdateStatus("checking");
    try {
      await window.ipcRenderer.invoke("check-update");
    } catch {
      setUpdateStatus("error");
      setUpdateError("Check failed");
    } finally {
      setIsManualChecking(false);
    }
  };

  const handleDownload = async () => {
    setUpdateStatus("downloading");
    try {
      await window.ipcRenderer.invoke("download-update");
    } catch {
      setUpdateStatus("error");
      setUpdateError("Download failed");
    }
  };

  const iconColor = updateReady
    ? "text-yellow-400"
    : updateStatus === "downloading"
      ? "text-blue-400"
      : updateStatus === "available"
        ? "text-green-400"
        : updateStatus === "error"
          ? "text-red-400"
          : "text-text-primary";

  return (
    <div className="relative">
      {/* Trigger button */}
      <button
        ref={btnRef}
        onClick={() => setShowPanel((v) => !v)}
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        className={`relative w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
          showPanel ? "bg-select-hover" : "hover:bg-select-hover"
        }`}
        title="Software updates"
      >
        <RefreshCcw
          className={`w-3.5 h-3.5 transition-colors ${iconColor} ${
            updateStatus === "checking" ? "animate-spin" : ""
          }`}
          strokeWidth={2}
        />
        {(updateReady ||
          updateStatus === "downloading" ||
          updateStatus === "available") && (
          <span className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full bg-yellow-400" />
        )}
      </button>

      {/* Floating panel */}
      {showPanel && (
        <div
          ref={panelRef}
          className="absolute right-0 top-[calc(100%+6px)] z-[99999] w-72 rounded-xl overflow-hidden shadow-2xl"
          style={{
            background: "var(--card-bg)",
            border: "1px solid var(--select-border)",
          }}
        >
          {/* Header */}
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{ borderBottom: "1px solid var(--select-border)" }}
          >
            <div className="flex items-center gap-2">
              <RefreshCcw
                className="w-4 h-4 text-text-primary opacity-60"
                strokeWidth={2}
              />
              <span className="text-xs font-semibold text-text-primary">
                Software Update
              </span>
            </div>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-mono"
              style={{
                background: "var(--select-hover)",
                color: "var(--text-primary)",
                opacity: 0.7,
              }}
            >
              v{__APP_VERSION__}
            </span>
          </div>

          {/* Body */}
          <div className="px-4 py-4 space-y-3">
            {/* Status row */}
            <div className="flex items-center gap-3">
              {updateReady ? (
                <>
                  <div className="w-8 h-8 rounded-full bg-yellow-400/15 flex items-center justify-center flex-shrink-0">
                    <CloudDownload
                      className="w-4 h-4 text-yellow-400"
                      strokeWidth={2}
                    />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-text-primary">
                      Ready to install
                    </p>
                    <p className="text-[10px] opacity-60 text-text-primary">
                      v{updateVersion} downloaded &amp; ready
                    </p>
                  </div>
                </>
              ) : updateStatus === "available" ? (
                <>
                  <div className="w-8 h-8 rounded-full bg-green-400/15 flex items-center justify-center flex-shrink-0">
                    <CloudDownload
                      className="w-4 h-4 text-green-400"
                      strokeWidth={2}
                    />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-text-primary">
                      Update available
                    </p>
                    <p className="text-[10px] opacity-60 text-text-primary">
                      v{updateVersion} — click below to download
                    </p>
                  </div>
                </>
              ) : updateStatus === "downloading" ? (
                <>
                  <div className="w-8 h-8 rounded-full bg-blue-400/15 flex items-center justify-center flex-shrink-0">
                    <ArrowDownToLine
                      className="w-4 h-4 text-blue-400 animate-bounce"
                      strokeWidth={2}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-text-primary">
                      Downloading{updateVersion ? ` v${updateVersion}` : ""}
                    </p>
                    {downloadPercent > 0 && (
                      <div
                        className="mt-1.5 w-full h-1 rounded-full overflow-hidden"
                        style={{ background: "var(--select-hover)" }}
                      >
                        <div
                          className="h-full rounded-full bg-blue-400 transition-all duration-300"
                          style={{ width: `${downloadPercent}%` }}
                        />
                      </div>
                    )}
                    <p className="text-[10px] opacity-60 text-text-primary mt-0.5">
                      {downloadPercent > 0
                        ? `${downloadPercent}%`
                        : "Starting download..."}
                    </p>
                  </div>
                </>
              ) : updateStatus === "checking" ? (
                <>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "var(--select-hover)" }}
                  >
                    <RefreshCcw
                      className="w-4 h-4 text-text-primary animate-spin"
                      strokeWidth={2}
                    />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-text-primary">
                      Checking for updates…
                    </p>
                    <p className="text-[10px] opacity-50 text-text-primary">
                      Connecting to server
                    </p>
                  </div>
                </>
              ) : updateStatus === "error" ? (
                <>
                  <div className="w-8 h-8 rounded-full bg-red-400/15 flex items-center justify-center flex-shrink-0">
                    <AlertCircle
                      className="w-4 h-4 text-red-400"
                      strokeWidth={2}
                    />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-text-primary">
                      Update check failed
                    </p>
                    <p className="text-[10px] text-red-400/80 mt-0.5 line-clamp-2">
                      {updateError}
                    </p>
                  </div>
                </>
              ) : updateStatus === "up-to-date" ? (
                <>
                  <div className="w-8 h-8 rounded-full bg-green-400/15 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2
                      className="w-4 h-4 text-green-400"
                      strokeWidth={2}
                    />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-text-primary">
                      You're up to date
                    </p>
                    <p className="text-[10px] opacity-50 text-text-primary">
                      v{__APP_VERSION__} is the latest version
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "var(--select-hover)" }}
                  >
                    <RefreshCcw
                      className="w-4 h-4 text-text-primary opacity-40"
                      strokeWidth={2}
                    />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-text-primary">
                      Bible Book-Of-Redemption
                    </p>
                    <p className="text-[10px] opacity-50 text-text-primary">
                      {autoUpdate
                        ? "Auto-updates enabled"
                        : "Manual — click below to check"}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Action button */}
            <div className="pt-1">
              {updateReady ? (
                <button
                  onClick={() => {
                    setShowPanel(false);
                    window.ipcRenderer.invoke("quit-and-install");
                  }}
                  className="w-full flex items-center justify-center gap-1.5 h-7 text-xs font-semibold rounded-lg transition-all active:scale-95"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--btn-active-from), var(--btn-active-to))",
                    border: "1px solid var(--select-border)",
                    color: "var(--text-primary)",
                  }}
                >
                  <RefreshCcw className="w-3 h-3" strokeWidth={2.5} />
                  Restart &amp; Install v{updateVersion}
                </button>
              ) : updateStatus === "available" ? (
                <button
                  onClick={handleDownload}
                  className="w-full flex items-center justify-center gap-1.5 h-7 text-xs font-semibold rounded-lg transition-all active:scale-95"
                  style={{
                    background:
                      "linear-gradient(135deg, color-mix(in srgb, var(--btn-active-from) 80%, transparent), color-mix(in srgb, var(--btn-active-to) 80%, transparent))",
                    border: "1px solid var(--select-border)",
                    color: "var(--text-primary)",
                  }}
                >
                  <ArrowDownToLine className="w-3 h-3" strokeWidth={2.5} />
                  Download v{updateVersion}
                </button>
              ) : (
                <button
                  onClick={handleManualCheck}
                  disabled={
                    updateStatus === "checking" ||
                    updateStatus === "downloading"
                  }
                  className="w-full flex items-center justify-center gap-1.5 h-7 text-xs font-medium rounded-lg transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: "var(--select-hover)",
                    border: "1px solid var(--select-border)",
                    color: "var(--text-primary)",
                  }}
                >
                  <RefreshCcw
                    className={`w-3 h-3 ${isManualChecking ? "animate-spin" : ""}`}
                    strokeWidth={2}
                  />
                  {updateStatus === "checking"
                    ? "Checking…"
                    : updateStatus === "downloading"
                      ? "Downloading…"
                      : "Check for Updates"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpdateManager;
