// Client-side secret logger for renderer process
// This version uses IPC to communicate with the main process logger

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
  age?: string;
}

class ClientSecretLogger {
  private static instance: ClientSecretLogger;

  private constructor() {}

  static getInstance(): ClientSecretLogger {
    if (!ClientSecretLogger.instance) {
      ClientSecretLogger.instance = new ClientSecretLogger();
    }
    return ClientSecretLogger.instance;
  }

  async log(
    application: "SONGS" | "SYSTEM",
    category:
      | "INFO"
      | "WARNING"
      | "ERROR"
      | "ACTION"
      | "PROJECTION"
      | "FILE_OPERATION",
    message: string,
    details?: any
  ): Promise<void> {
    try {
      // Send log entry to main process via IPC
      if (window.api?.logToSecretLogger) {
        await window.api.logToSecretLogger({
          application,
          category,
          message,
          details,
        });
      } else {
        // Fallback to console if IPC is not available
        console.log(
          `🔒 CLIENT_LOG [${application}/${category}]: ${message}`,
          details || ""
        );
      }
    } catch (error) {
      console.error("Failed to send log to main process:", error);
    }
  }

  async getLogs(): Promise<LogEntry[]> {
    try {
      if (window.api?.getSecretLogs) {
        const result = await window.api.getSecretLogs();
        if (result.success && result.logs) {
          // Filter logs to only include SONGS and SYSTEM applications
          return result.logs.filter(
            (log: any) =>
              log.application === "SONGS" || log.application === "SYSTEM"
          ) as LogEntry[];
        }
        return [];
      }
      return [];
    } catch (error) {
      console.error("Failed to get logs from main process:", error);
      return [];
    }
  }

  async clearAllLogs(): Promise<boolean> {
    try {
      if (window.api?.clearSecretLogs) {
        const result = await window.api.clearSecretLogs();
        return result.success;
      }
      return false;
    } catch (error) {
      console.error("Failed to clear logs:", error);
      return false;
    }
  }
}

// Export singleton instance
export const clientSecretLogger = ClientSecretLogger.getInstance();

// Convenience methods for different log types
export const logSongAction = (message: string, details?: any) =>
  clientSecretLogger.log("SONGS", "ACTION", message, details);

export const logSongProjection = (message: string, details?: any) =>
  clientSecretLogger.log("SONGS", "PROJECTION", message, details);

export const logSongFileOp = (message: string, details?: any) =>
  clientSecretLogger.log("SONGS", "FILE_OPERATION", message, details);

export const logSongError = (message: string, details?: any) =>
  clientSecretLogger.log("SONGS", "ERROR", message, details);

export const logSystemInfo = (message: string, details?: any) =>
  clientSecretLogger.log("SYSTEM", "INFO", message, details);

export const logSystemError = (message: string, details?: any) =>
  clientSecretLogger.log("SYSTEM", "ERROR", message, details);
