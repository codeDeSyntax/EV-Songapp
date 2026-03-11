import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import {
  RefreshCcw,
  AlertCircle,
  CheckCircle2,
  ArrowDownToLine,
  CloudDownload,
} from "lucide-react";

declare const __APP_VERSION__: string;

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
  const [panelPos, setPanelPos] = useState({ top: 30, left: 8 });

  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onStatus = (
      _e: Electron.IpcRendererEvent,
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
      } else if (arg.status === "ready") {
        setUpdateReady(true);
        setUpdateStatus("idle");
        if (arg.version) setUpdateVersion(arg.version);
      } else if (arg.status === "up-to-date") {
        setUpdateStatus("up-to-date");
        setTimeout(() => setUpdateStatus("idle"), 5000);
      } else if (arg.status === "error") {
        setUpdateStatus("error");
        setUpdateError(arg.message ?? "Unknown error");
        setTimeout(() => setUpdateStatus("idle"), 8000);
      }
    };

    window.ipcRenderer.on("update-status", onStatus);
    return () => {
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

  const handleToggle = () => {
    if (!showPanel && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPanelPos({
        top: rect.bottom + 6,
        left: rect.left,
      });
    }
    setShowPanel((v) => !v);
  };

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
          : "text-white/70";

  /* ─── Status icon + text for each state ─── */
  const renderStatusRow = () => {
    if (updateReady)
      return (
        <>
          <div className="w-8 h-8 rounded-full bg-yellow-400/20 flex items-center justify-center flex-shrink-0">
            <CloudDownload
              className="w-4 h-4 text-yellow-400"
              strokeWidth={2}
            />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
              Ready to install
            </p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              v{updateVersion} downloaded &amp; ready
            </p>
          </div>
        </>
      );
    if (updateStatus === "available")
      return (
        <>
          <div className="w-8 h-8 rounded-full bg-green-400/20 flex items-center justify-center flex-shrink-0">
            <CloudDownload className="w-4 h-4 text-green-400" strokeWidth={2} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
              Update available
            </p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              v{updateVersion} — click below to download
            </p>
          </div>
        </>
      );
    if (updateStatus === "downloading")
      return (
        <>
          <div className="w-8 h-8 rounded-full bg-blue-400/20 flex items-center justify-center flex-shrink-0">
            <ArrowDownToLine
              className="w-4 h-4 text-blue-400 animate-bounce"
              strokeWidth={2}
            />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
              Downloading{updateVersion ? ` v${updateVersion}` : ""}
            </p>
            {downloadPercent > 0 && (
              <div className="mt-1.5 w-full h-1 rounded-full overflow-hidden bg-gray-200 dark:bg-zinc-600">
                <div
                  className="h-full rounded-full bg-blue-400 transition-all duration-300"
                  style={{ width: `${downloadPercent}%` }}
                />
              </div>
            )}
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
              {downloadPercent > 0
                ? `${downloadPercent}%`
                : "Starting download..."}
            </p>
          </div>
        </>
      );
    if (updateStatus === "checking")
      return (
        <>
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-zinc-600 flex items-center justify-center flex-shrink-0">
            <RefreshCcw
              className="w-4 h-4 text-gray-700 dark:text-gray-200 animate-spin"
              strokeWidth={2}
            />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
              Checking for updates…
            </p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              Connecting to server
            </p>
          </div>
        </>
      );
    if (updateStatus === "error")
      return (
        <>
          <div className="w-8 h-8 rounded-full bg-red-400/20 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-4 h-4 text-red-400" strokeWidth={2} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
              Update check failed
            </p>
            <p className="text-[10px] text-red-400/80 mt-0.5 line-clamp-2">
              {updateError}
            </p>
          </div>
        </>
      );
    if (updateStatus === "up-to-date")
      return (
        <>
          <div className="w-8 h-8 rounded-full bg-green-400/20 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-4 h-4 text-green-400" strokeWidth={2} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
              You're up to date
            </p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              v{__APP_VERSION__} is the latest version
            </p>
          </div>
        </>
      );
    // idle
    return (
      <>
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-zinc-600 flex items-center justify-center flex-shrink-0">
          <RefreshCcw
            className="w-4 h-4 text-gray-500 dark:text-gray-300 opacity-60"
            strokeWidth={2}
          />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
            songCast
          </p>
          <p className="text-[10px] text-gray-500 dark:text-gray-400">
            Click below to check for updates
          </p>
        </div>
      </>
    );
  };

  /* ─── Action button for each state ─── */
  const renderActionButton = () => {
    if (updateReady)
      return (
        <button
          onClick={() => {
            setShowPanel(false);
            window.ipcRenderer.invoke("quit-and-install");
          }}
          className="w-full flex items-center justify-center gap-1.5 h-8 text-xs font-semibold rounded-lg transition-all active:scale-95 bg-yellow-500 hover:bg-yellow-600 text-white"
        >
          <RefreshCcw className="w-3 h-3" strokeWidth={2.5} />
          Restart &amp; Install v{updateVersion}
        </button>
      );
    if (updateStatus === "available")
      return (
        <button
          onClick={handleDownload}
          className="w-full flex items-center justify-center gap-1.5 h-8 text-xs font-semibold rounded-lg transition-all active:scale-95 bg-green-500 hover:bg-green-600 text-white"
        >
          <ArrowDownToLine className="w-3 h-3" strokeWidth={2.5} />
          Download v{updateVersion}
        </button>
      );
    return (
      <button
        onClick={handleManualCheck}
        disabled={updateStatus === "checking" || updateStatus === "downloading"}
        className="w-full flex items-center justify-center gap-1.5 h-8 text-xs font-medium rounded-lg transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed bg-gray-200 dark:bg-zinc-600 hover:bg-gray-300 dark:hover:bg-zinc-500 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-zinc-500"
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
    );
  };

  // Portal renders into document.body so it escapes the title bar stacking context.
  const panelPortal = showPanel
    ? ReactDOM.createPortal(
        <div
          ref={panelRef}
          className="fixed z-[99999] w-72 rounded-xl overflow-hidden shadow-2xl border bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600"
          style={{ top: panelPos.top, left: panelPos.left }}
        >
          {/* Header */}
          <div className="px-4 py-3 flex items-center justify-between border-b border-gray-200 dark:border-zinc-600">
            <div className="flex items-center gap-2">
              <RefreshCcw
                className="w-4 h-4 text-gray-500 dark:text-gray-400"
                strokeWidth={2}
              />
              <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                Software Update
              </span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-gray-300">
              v{__APP_VERSION__}
            </span>
          </div>

          {/* Body */}
          <div className="px-4 py-4 space-y-3">
            <div className="flex items-center gap-3">{renderStatusRow()}</div>
            <div className="pt-1">{renderActionButton()}</div>
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      {/* Trigger button */}
      <button
        ref={btnRef}
        onClick={handleToggle}
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        className={`relative w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
          showPanel ? "bg-white/10" : "hover:bg-white/10"
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

      {panelPortal}
    </>
  );
};

export default UpdateManager;
