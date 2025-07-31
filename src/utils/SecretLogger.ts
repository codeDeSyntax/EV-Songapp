// Secret logging system for BlessedMusic app
import fs from "fs";
import path from "path";
import os from "os";

export interface LogEntry {
  id: string;
  timestamp: number;
  date: string;
  application: "SONGS" | "SYSTEM";
  category:
    | "INFO"
    | "WARNING"
    | "ERROR"
    | "ACTION"
    | "PROJECTION"
    | "FILE_OPERATION";
  message: string;
  details?: any;
  age?: string; // Human readable age like "2 minutes ago", "1 hour ago"
}

export interface LogCleanupSettings {
  autoCleanup: boolean;
  interval: number; // in milliseconds
  unit: "minutes" | "hours" | "days" | "weeks";
  customInterval: number; // user-defined number of units
}

class SecretLogger {
  private static instance: SecretLogger;
  private logsFilePath: string;
  private settingsFilePath: string;
  private maxLogAge = 21 * 24 * 60 * 60 * 1000; // Default: 3 weeks in milliseconds
  private cleanupTimer: NodeJS.Timeout | null = null;
  private defaultSettings: LogCleanupSettings = {
    autoCleanup: true,
    interval: 10 * 60 * 1000, // 10 minutes in milliseconds
    unit: "minutes",
    customInterval: 10,
  };

  constructor() {
    // Store logs in app data directory for persistence
    const appDataPath = path.join(os.homedir(), ".blessedmusic");
    if (!fs.existsSync(appDataPath)) {
      fs.mkdirSync(appDataPath, { recursive: true });
    }
    this.logsFilePath = path.join(appDataPath, ".system_logs.json");
    this.settingsFilePath = path.join(appDataPath, ".log_settings.json");

    this.loadSettings();
    this.cleanOldLogs();
    this.startAutoCleanup();
  }

  static getInstance(): SecretLogger {
    if (!SecretLogger.instance) {
      SecretLogger.instance = new SecretLogger();
    }
    return SecretLogger.instance;
  }

  private loadSettings(): void {
    try {
      if (fs.existsSync(this.settingsFilePath)) {
        const data = fs.readFileSync(this.settingsFilePath, "utf8");
        const settings = JSON.parse(data) as LogCleanupSettings;
        this.updateMaxLogAge(settings);
      } else {
        // Create default settings file
        this.saveSettings(this.defaultSettings);
        this.updateMaxLogAge(this.defaultSettings);
      }
    } catch (error) {
      console.error("Failed to load log settings:", error);
      this.updateMaxLogAge(this.defaultSettings);
    }
  }

  private saveSettings(settings: LogCleanupSettings): void {
    try {
      fs.writeFileSync(
        this.settingsFilePath,
        JSON.stringify(settings, null, 2)
      );
    } catch (error) {
      console.error("Failed to save log settings:", error);
    }
  }

  private updateMaxLogAge(settings: LogCleanupSettings): void {
    const unitMultipliers = {
      minutes: 60 * 1000,
      hours: 60 * 60 * 1000,
      days: 24 * 60 * 60 * 1000,
      weeks: 7 * 24 * 60 * 60 * 1000,
    };

    this.maxLogAge = settings.customInterval * unitMultipliers[settings.unit];
    this.restartAutoCleanup(settings);
  }

  private startAutoCleanup(): void {
    const settings = this.getSettings();
    if (settings.autoCleanup) {
      this.cleanupTimer = setInterval(() => {
        this.cleanOldLogs();
      }, settings.interval);
    }
  }

  private restartAutoCleanup(settings: LogCleanupSettings): void {
    // Clear existing timer
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    // Start new timer if auto cleanup is enabled
    if (settings.autoCleanup) {
      this.cleanupTimer = setInterval(() => {
        this.cleanOldLogs();
      }, settings.interval);
    }
  }

  getSettings(): LogCleanupSettings {
    try {
      if (fs.existsSync(this.settingsFilePath)) {
        const data = fs.readFileSync(this.settingsFilePath, "utf8");
        return JSON.parse(data) as LogCleanupSettings;
      }
    } catch (error) {
      console.error("Failed to get log settings:", error);
    }
    return this.defaultSettings;
  }

  updateSettings(newSettings: LogCleanupSettings): void {
    this.saveSettings(newSettings);
    this.updateMaxLogAge(newSettings);
    this.log("SYSTEM", "INFO", "Log cleanup settings updated", {
      autoCleanup: newSettings.autoCleanup,
      interval: `${newSettings.customInterval} ${newSettings.unit}`,
      nextCleanup: new Date(Date.now() + newSettings.interval).toISOString(),
    });
  }

  private generateId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getHumanReadableAge(timestamp: number): string {
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);

    if (diffSeconds < 60)
      return `${diffSeconds} second${diffSeconds !== 1 ? "s" : ""} ago`;
    if (diffMinutes < 60)
      return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
    if (diffWeeks < 4)
      return `${diffWeeks} week${diffWeeks !== 1 ? "s" : ""} ago`;
    return "Over a month ago";
  }

  log(
    application: LogEntry["application"],
    category: LogEntry["category"],
    message: string,
    details?: any
  ): void {
    const timestamp = Date.now();
    const entry: LogEntry = {
      id: this.generateId(),
      timestamp,
      date: new Date(timestamp).toISOString(),
      application,
      category,
      message,
      details: details ? JSON.stringify(details, null, 2) : undefined,
      age: this.getHumanReadableAge(timestamp),
    };

    try {
      let logs: LogEntry[] = [];
      if (fs.existsSync(this.logsFilePath)) {
        const data = fs.readFileSync(this.logsFilePath, "utf8");
        logs = JSON.parse(data);
      }

      logs.push(entry);

      // Keep only recent logs (within 3 weeks)
      const cutoffTime = Date.now() - this.maxLogAge;
      logs = logs.filter((log) => log.timestamp > cutoffTime);

      fs.writeFileSync(this.logsFilePath, JSON.stringify(logs, null, 2));

      // Also log to console with special prefix for easy identification
      console.log(
        `🔒 SECRET_LOG [${application}/${category}]: ${message}`,
        details ? details : ""
      );
    } catch (error) {
      console.error("Failed to write to secret log:", error);
    }
  }

  getLogs(): LogEntry[] {
    try {
      if (fs.existsSync(this.logsFilePath)) {
        const data = fs.readFileSync(this.logsFilePath, "utf8");
        const logs: LogEntry[] = JSON.parse(data);

        // Update ages for display
        return logs.map((log) => ({
          ...log,
          age: this.getHumanReadableAge(log.timestamp),
        }));
      }
      return [];
    } catch (error) {
      console.error("Failed to read secret logs:", error);
      return [];
    }
  }

  private cleanOldLogs(): void {
    try {
      if (fs.existsSync(this.logsFilePath)) {
        const data = fs.readFileSync(this.logsFilePath, "utf8");
        const logs: LogEntry[] = JSON.parse(data);

        const cutoffTime = Date.now() - this.maxLogAge;
        const filteredLogs = logs.filter((log) => log.timestamp > cutoffTime);

        if (filteredLogs.length !== logs.length) {
          fs.writeFileSync(
            this.logsFilePath,
            JSON.stringify(filteredLogs, null, 2)
          );
          console.log(
            `🔒 SECRET_LOG [SYSTEM/INFO]: Auto-cleaned ${
              logs.length - filteredLogs.length
            } old log entries (older than ${this.getMaxLogAgeDescription()})`
          );
        }
      }
    } catch (error) {
      console.error("Failed to clean old logs:", error);
    }
  }

  private getMaxLogAgeDescription(): string {
    const settings = this.getSettings();
    return `${settings.customInterval} ${settings.unit}`;
  }

  clearAllLogs(): void {
    try {
      if (fs.existsSync(this.logsFilePath)) {
        fs.unlinkSync(this.logsFilePath);
        this.log("SYSTEM", "ACTION", "All logs cleared by admin");
      }
    } catch (error) {
      console.error("Failed to clear logs:", error);
    }
  }
}

// Export singleton instance
export const secretLogger = SecretLogger.getInstance();

// Convenience methods for different log types
export const logSongAction = (message: string, details?: any) =>
  secretLogger.log("SONGS", "ACTION", message, details);

export const logSongProjection = (message: string, details?: any) =>
  secretLogger.log("SONGS", "PROJECTION", message, details);

export const logSongFileOp = (message: string, details?: any) =>
  secretLogger.log("SONGS", "FILE_OPERATION", message, details);

export const logSongError = (message: string, details?: any) =>
  secretLogger.log("SONGS", "ERROR", message, details);

export const logSystemInfo = (message: string, details?: any) =>
  secretLogger.log("SYSTEM", "INFO", message, details);

export const logSystemError = (message: string, details?: any) =>
  secretLogger.log("SYSTEM", "ERROR", message, details);
