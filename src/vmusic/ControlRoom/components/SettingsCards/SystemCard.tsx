import React, { useEffect, useState } from "react";
import { Switch } from "antd";

interface SystemCardProps {
  isDarkMode: boolean;
}

export const SystemCard: React.FC<SystemCardProps> = () => {
  const [version, setVersion] = useState<string>("...");
  const [openAtLogin, setOpenAtLogin] = useState(false);
  const [savingStartup, setSavingStartup] = useState(false);
  const [autoUpdate, setAutoUpdate] = useState(false);
  const [savingAutoUpdate, setSavingAutoUpdate] = useState(false);

  useEffect(() => {
    window.api
      ?.getAppVersion?.()
      .then(setVersion)
      .catch(() => {});
    window.api
      ?.getLoginItemSettings?.()
      .then((s) => setOpenAtLogin(s.openAtLogin))
      .catch(() => {});
    window.ipcRenderer
      .invoke("get-update-preference")
      .then((prefs: { autoUpdate: boolean }) =>
        setAutoUpdate(prefs?.autoUpdate ?? false),
      )
      .catch(() => {});
  }, []);

  const handleAutoUpdateToggle = async (next: boolean) => {
    setSavingAutoUpdate(true);
    try {
      await window.ipcRenderer.invoke("set-update-preference", {
        autoUpdate: next,
      });
      setAutoUpdate(next);
    } catch {
      /* ignore */
    } finally {
      setSavingAutoUpdate(false);
    }
  };

  const handleStartupToggle = async (next: boolean) => {
    setSavingStartup(true);
    try {
      const result = await window.api.setLoginItemSettings(next);
      setOpenAtLogin(result.openAtLogin);
    } catch {
      /* ignore */
    } finally {
      setSavingStartup(false);
    }
  };

  return (
    <div className="flex-shrink-0 flex flex-col rounded-2xl border border-app-border bg-app-surface p-4 gap-5 h-full w-64 no-scrollbar">
      {/* Header */}
      <div>
        <h3 className="text-xs font-medium text-app-text-muted uppercase tracking-wider">
          System
        </h3>
      </div>

      {/* App version */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-app-text-muted">App version</span>
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-app-bg text-app-text">
          v{version}
        </span>
      </div>

      {/* Launch on startup */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-app-text">Launch on startup</p>
          <p className="text-[11px] mt-0.5 text-app-text-muted">
            Open East Voice when Windows starts
          </p>
        </div>
        <Switch
          checked={openAtLogin}
          onChange={handleStartupToggle}
          loading={savingStartup}
          size="small"
        />
      </div>

      {/* Auto-update */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-app-text">Auto-update</p>
          <p className="text-[11px] mt-0.5 text-app-text-muted">
            {autoUpdate
              ? "Downloads updates automatically"
              : "Notify only, manual download"}
          </p>
        </div>
        <Switch
          checked={autoUpdate}
          onChange={handleAutoUpdateToggle}
          loading={savingAutoUpdate}
          size="small"
        />
      </div>

      {/* Keyboard shortcuts reference */}
      <div className="text-[11px] text-app-text-muted space-y-1.5 border-t border-app-border pt-3">
        <p className="text-xs font-semibold text-app-text mb-2">
          Global shortcuts
        </p>
        {[
          ["Ctrl+Shift+→", "Next slide"],
          ["Ctrl+Shift+←", "Prev slide"],
          ["Ctrl+Shift+Space", "Project song"],
          ["Shift+F", "Focus projector"],
        ].map(([key, desc]) => (
          <div key={key} className="flex items-center justify-between gap-2">
            <span className="font-mono px-1.5 py-0.5 rounded text-[10px] bg-app-bg text-app-text">
              {key}
            </span>
            <span className="truncate">{desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
