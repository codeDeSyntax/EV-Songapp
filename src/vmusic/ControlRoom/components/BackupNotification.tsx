import React, { useEffect, useRef, useState } from "react";
import {
  CheckCheck,
  ChevronDown,
  FolderDown,
  Loader2,
  Music2,
  X,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store";
import { markSongsSeen, setLastBackupTime } from "@/store/slices/songSlice";

/* ── Google Drive SVG icon ──────────────────────────────────────────────── */
const GoogleDriveIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 87.3 78"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z"
      fill="#0066da"
    />
    <path
      d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z"
      fill="#00ac47"
    />
    <path
      d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z"
      fill="#ea4335"
    />
    <path
      d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z"
      fill="#00832d"
    />
    <path
      d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z"
      fill="#2684fc"
    />
    <path
      d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 27h27.45c0-1.55-.4-3.1-1.2-4.5z"
      fill="#ffba00"
    />
  </svg>
);

/* ── Google "G" icon for sign-in button ──────────────────────────────────── */
const GoogleGIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

type DriveStatus = { connected: boolean; email?: string } | null;
type BackupState = "idle" | "connecting" | "backing-up" | "done" | "error";

export default function BackupNotification() {
  const dispatch = useAppDispatch();
  const newSongs = useAppSelector((s) => s.songs.newSongs);
  const allSongs = useAppSelector((s) => s.songs.songs);
  const lastBackupTime = useAppSelector((s) => s.songs.lastBackupTime);

  const [open, setOpen] = useState(false);
  const [driveStatus, setDriveStatus] = useState<DriveStatus>(null);
  const [backupState, setBackupState] = useState<BackupState>("idle");
  const [backupError, setBackupError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{
    stage: "zipping" | "uploading";
  } | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const badgeCount = newSongs.length;

  // ── close on outside click ──────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        !btnRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // ── fetch Drive status on mount and whenever panel opens ───────────────
  const refreshDriveStatus = () =>
    window.api.googleDriveStatus().then(setDriveStatus);

  useEffect(() => {
    refreshDriveStatus(); // check immediately on mount
  }, []);

  useEffect(() => {
    if (!open) return;
    refreshDriveStatus(); // re-check every time the panel opens
  }, [open]);

  // ── listen for backup progress events ──────────────────────────────────
  useEffect(() => {
    const unsub = window.api.onBackupProgress((p) => setProgress(p));
    return unsub;
  }, []);

  // ── load last backup time from main process on mount ───────────────────
  useEffect(() => {
    window.api.getLastBackupTime().then((t) => {
      if (t) dispatch(setLastBackupTime(t));
    });
  }, []);

  // ── helpers ─────────────────────────────────────────────────────────────
  const formatDate = (iso: string | null) => {
    if (!iso) return "Never";
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleConnectDrive = async () => {
    setBackupState("connecting");
    setBackupError(null);
    try {
      await window.api.googleAuthStart();
      const status = await window.api.googleDriveStatus();
      setDriveStatus(status);
      setBackupState("idle");
    } catch (err: any) {
      setBackupError(err?.message ?? "Connection failed.");
      setBackupState("error");
    }
  };

  const handleDisconnectDrive = async () => {
    await window.api.googleDriveDisconnect();
    setDriveStatus({ connected: false });
  };

  const handleDriveBackup = async () => {
    setBackupState("backing-up");
    setBackupError(null);
    setProgress(null);
    try {
      const result = await window.api.googleDriveBackup();
      dispatch(setLastBackupTime(result.timestamp));
      dispatch(markSongsSeen());
      setBackupState("done");
      setTimeout(() => setBackupState("idle"), 3000);
    } catch (err: any) {
      setBackupError(err?.message ?? "Backup failed.");
      setBackupState("error");
    } finally {
      setProgress(null);
    }
  };

  const handleLocalBackup = async () => {
    setBackupState("backing-up");
    setBackupError(null);
    try {
      const result = await window.api.backupSongsLocal();
      if (result.cancelled) {
        setBackupState("idle");
        return;
      }
      if (result.timestamp) dispatch(setLastBackupTime(result.timestamp));
      dispatch(markSongsSeen());
      setBackupState("done");
      setTimeout(() => setBackupState("idle"), 3000);
    } catch (err: any) {
      setBackupError(err?.message ?? "Local backup failed.");
      setBackupState("error");
    }
  };

  const isBusy = backupState === "connecting" || backupState === "backing-up";

  return (
    <div className="relative">
      {/* ── Trigger button ─────────────────────────────────────────────── */}
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        title="Drive Backup"
        className="relative h-7 w-7 flex items-center justify-center rounded-full hover:bg-app-surface-hover transition-colors"
      >
        <GoogleDriveIcon size={15} />
        {badgeCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-0.5 bg-[#ea4335] text-white text-[8px] font-bold rounded-full flex items-center justify-center leading-none">
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        )}
      </button>

      {/* ── Dropdown panel ─────────────────────────────────────────────── */}
      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-9 w-80 rounded-2xl z-50 overflow-hidden
            shadow-[0_8px_32px_rgba(0,0,0,0.18)] border
            bg-white border-[#e0e0e0]
            dark:bg-[#1e1e1e] dark:border-[#333]"
        >
          {/* ── Header ─────────────────────────────────────────────────── */}
          <div
            className="flex items-center justify-between px-4 py-3
            border-b border-[#e0e0e0] dark:border-[#2a2a2a]"
          >
            <div className="flex items-center gap-2.5">
              <GoogleDriveIcon size={20} />
              <div>
                <p className="text-[13px] font-semibold leading-none text-[#202124] dark:text-[#e8eaed]">
                  Drive Backup
                </p>
                <p className="text-[10px] text-[#5f6368] dark:text-[#9aa0a6] mt-0.5 leading-none">
                  East Voice · Song Library
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-6 h-6 flex bg-app-surface items-center justify-center rounded-full
                text-[#5f6368] hover:bg-[#f1f3f4] hover:text-[#202124]
                dark:text-[#9aa0a6] dark:hover:bg-[#2d2d2d] dark:hover:text-[#e8eaed]
                transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* ── Account / Connection row ────────────────────────────────── */}
          <div className="px-4 py-3 border-b border-[#e0e0e0] dark:border-[#2a2a2a]">
            {driveStatus?.connected ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {/* Avatar circle */}
                  <div className="w-8 h-8 rounded-full bg-[#1a73e8] flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-[12px] font-semibold uppercase">
                      {(driveStatus.email ?? "G").charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-[#202124] dark:text-[#e8eaed] leading-none">
                      Connected
                    </p>
                    <p className="text-[10px] text-[#5f6368] dark:text-[#9aa0a6] mt-0.5 truncate max-w-[140px] leading-none">
                      {driveStatus.email ?? "Google Account"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDisconnectDrive}
                  disabled={isBusy}
                  className="text-[10px] font-medium text-[#1a73e8] dark:text-[#8ab4f8]
                    hover:text-[#1557b0] dark:hover:text-[#aecbfa]
                    disabled:opacity-40 transition-colors"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnectDrive}
                disabled={backupState === "connecting"}
                className="w-full flex items-center justify-center gap-2.5 h-9 rounded-lg
                  border border-[#dadce0] dark:border-[#444]
                  bg-white dark:bg-[#2d2d2d]
                  hover:bg-[#f8f9fa] dark:hover:bg-[#363636]
                  disabled:opacity-50 disabled:cursor-not-allowed
                  text-[#3c4043] dark:text-[#e8eaed]
                  text-[12px] font-medium transition-colors shadow-sm"
              >
                {backupState === "connecting" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#1a73e8] dark:text-[#8ab4f8]" />
                    <span>Opening browser…</span>
                  </>
                ) : (
                  <>
                    <GoogleGIcon />
                    <span>Sign in with Google</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* ── New songs notification ──────────────────────────────────── */}
          {badgeCount > 0 && (
            <div
              className="px-4 py-3 border-b border-[#e0e0e0] dark:border-[#2a2a2a]
              bg-[#fef7e0] dark:bg-[#2a2200]"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#fbbc04] flex-shrink-0" />
                  <p className="text-[11px] font-semibold text-[#7a5c00] dark:text-[#fbbc04]">
                    {badgeCount} new {badgeCount === 1 ? "song" : "songs"} not
                    backed up
                  </p>
                </div>
                <button
                  onClick={() => dispatch(markSongsSeen())}
                  className="text-[10px] text-[#5f6368] dark:text-[#9aa0a6]
                    hover:text-[#202124] dark:hover:text-[#e8eaed] transition-colors"
                >
                  Dismiss
                </button>
              </div>
              <ul className="space-y-1 max-h-20 overflow-y-auto no-scrollbar">
                {newSongs.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center gap-1.5 text-[10px] text-[#7a5c00] dark:text-[#c8a300]"
                  >
                    <Music2 className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{s.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── Backup actions ──────────────────────────────────────────── */}
          <div className="px-4 py-3 space-y-2.5">
            {/* Progress bar */}
            {backupState === "backing-up" && progress && (
              <div className="rounded-lg bg-[#e8f0fe] dark:bg-[#1a2a4a] px-3 py-2.5">
                <div
                  className="flex items-center justify-between text-[10px] font-medium mb-1.5
                  text-[#1a73e8] dark:text-[#8ab4f8]"
                >
                  <span>
                    {progress.stage === "zipping"
                      ? "📦 Zipping files…"
                      : "☁️ Uploading to Drive…"}
                  </span>
                  <span className="text-[#5f6368] dark:text-[#9aa0a6]">
                    {progress.stage === "zipping" ? "Step 1/2" : "Step 2/2"}
                  </span>
                </div>
                <div className="h-1 rounded-full bg-[#c5d9f7] dark:bg-[#1e3a6e] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#1a73e8] transition-all duration-500"
                    style={{
                      width: progress.stage === "zipping" ? "45%" : "100%",
                    }}
                  />
                </div>
              </div>
            )}

            {/* Done / Error feedback */}
            {backupState === "done" && (
              <div
                className="flex items-center gap-2 rounded-lg px-3 py-2
                bg-[#e6f4ea] dark:bg-[#0d2818] text-[#188038] dark:text-[#34a853]"
              >
                <CheckCheck className="w-3.5 h-3.5 flex-shrink-0" />
                <p className="text-[11px] font-medium">Backup complete!</p>
              </div>
            )}
            {backupState === "error" && backupError && (
              <div className="rounded-lg px-3 py-2 bg-[#fce8e6] dark:bg-[#2d0e0e] text-[#c5221f] dark:text-[#f28b82]">
                <p className="text-[10px] leading-snug">{backupError}</p>
              </div>
            )}

            {/* Drive backup button */}
            {driveStatus?.connected && (
              <button
                onClick={handleDriveBackup}
                disabled={isBusy || allSongs.length === 0}
                className="w-full flex items-center justify-center gap-2 h-9 rounded-lg
                  bg-[#1a73e8] hover:bg-[#1557b0]
                  dark:bg-[#1a73e8] dark:hover:bg-[#1967d2]
                  disabled:opacity-40 disabled:cursor-not-allowed
                  text-white text-[12px] font-medium transition-colors shadow-sm"
              >
                {backupState === "backing-up" ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {progress?.stage === "zipping" ? "Zipping…" : "Uploading…"}
                  </>
                ) : (
                  <>
                    <GoogleDriveIcon size={14} />
                    Back up to Drive
                    <span className="ml-0.5 text-[10px] text-white/70 font-normal">
                      ({allSongs.length} songs)
                    </span>
                  </>
                )}
              </button>
            )}

            {/* Local backup button */}
            <button
              onClick={handleLocalBackup}
              disabled={isBusy || allSongs.length === 0}
              className="w-full flex items-center justify-center gap-2 h-8 rounded-lg
                border border-[#dadce0] dark:border-[#444]
                text-[#3c4043] dark:text-[#e8eaed] text-[11px] font-medium
                hover:bg-[#f1f3f4] dark:hover:bg-[#2d2d2d]
                disabled:opacity-40 disabled:cursor-not-allowed
                transition-colors"
            >
              <FolderDown className="w-3.5 h-3.5 text-[#5f6368] dark:text-[#9aa0a6]" />
              Save local backup (.zip)
            </button>
          </div>

          {/* ── Footer ─────────────────────────────────────────────────── */}
          <div
            className="px-4 py-2 border-t border-[#e0e0e0] dark:border-[#2a2a2a]
            bg-[#f8f9fa] dark:bg-[#161616]"
          >
            {badgeCount === 0 && (
              <div className="flex items-center gap-1.5 mb-1.5">
                <CheckCheck className="w-3 h-3 text-[#34a853]" />
                <p className="text-[10px] text-[#5f6368] dark:text-[#9aa0a6]">
                  All songs backed up
                </p>
              </div>
            )}
            <p className="text-[10px] text-[#9aa0a6] dark:text-[#5f6368]">
              Last backup:{" "}
              <span className="text-[#5f6368] dark:text-[#9aa0a6] font-medium">
                {formatDate(lastBackupTime)}
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
