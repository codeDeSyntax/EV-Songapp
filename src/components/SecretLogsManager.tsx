import React, { useState, useEffect } from "react";
import { SecretLogsWindow } from "@/components/SecretLogsWindow";

// SECRET CONFIGURATION
const SECRET_PASSWORD = "evapp56";

interface SecretLogsManagerProps {
  children: React.ReactNode;
}

export const SecretLogsManager: React.FC<SecretLogsManagerProps> = ({
  children,
}) => {
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [showLogsWindow, setShowLogsWindow] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      console.log(
        "Key pressed:",
        event.key,
        "Ctrl:",
        event.ctrlKey,
        "Shift:",
        event.shiftKey,
        "Alt:",
        event.altKey
      ); // Debug

      // Use Ctrl+` (backtick) - similar to VS Code terminal toggle
      // OR Ctrl+Shift+L as backup
      const isSecretKey =
        (event.key === "`" &&
          event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey) ||
        (event.key === "L" &&
          event.ctrlKey &&
          event.shiftKey &&
          !event.altKey) ||
        (event.key === "l" && event.ctrlKey && event.shiftKey && !event.altKey);

      if (isSecretKey) {
        event.preventDefault();
        event.stopPropagation();
        console.log("Secret logs triggered!"); // Debug log
        setShowPasswordPrompt(true);
      }
    };

    console.log("SecretLogsManager: Event listener attached"); // Debug log
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => {
      console.log("SecretLogsManager: Event listener removed"); // Debug log
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, []);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (password === SECRET_PASSWORD) {
      setShowPasswordPrompt(false);
      setShowLogsWindow(true);
      setPassword("");
      setError("");
    } else {
      setError("Invalid password. Access denied.");
      setPassword("");
      // Auto-close after wrong password
      setTimeout(() => {
        setShowPasswordPrompt(false);
        setError("");
      }, 2000);
    }
  };

  const handleCloseLogs = () => {
    setShowLogsWindow(false);
  };

  const handleClosePasswordPrompt = () => {
    setShowPasswordPrompt(false);
    setPassword("");
    setError("");
  };

  return (
    <>
      {children}

      {/* Password Prompt Modal */}
      {showPasswordPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20  backdrop-blur-sm ">
          <div className="bg-[#faeed1] dark:bg-ltgray border border-red-500 rounded-lg p-6 shadow-2xl max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <div className="text-red-400 text-2xl mb-2">🔒</div>
              <h2 className="text-red-400 font-bold text-lg font-mono">
                RESTRICTED ACCESS
              </h2>
              <p className="text-gray-400 text-sm mt-2">
                Enter administrator password to continue
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-[90%] bg-[#e8d5a7] dark:bg-black  text-green-400 border border-gray-600 rounded px-3 py-2 font-mono focus:border-red-500 focus:outline-none"
                autoFocus
              />

              {error && (
                <div className="mt-3 text-red-400 text-sm font-mono text-center">
                  ❌ {error}
                </div>
              )}

              <div className="mt-4 flex space-x-2">
                <button
                  type="submit"
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 font-mono text-sm"
                >
                  AUTHENTICATE
                </button>
                <button
                  type="button"
                  onClick={handleClosePasswordPrompt}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 font-mono text-sm"
                >
                  CANCEL
                </button>
              </div>
            </form>

            <div className="mt-4 text-xs text-gray-500 font-mono text-center">
              Unauthorized access is prohibited
            </div>
          </div>
        </div>
      )}

      {/* Secret Logs Window */}
      <SecretLogsWindow isOpen={showLogsWindow} onClose={handleCloseLogs} />
    </>
  );
};

// Export the secret credentials for reference
export const SECRET_CREDENTIALS = {
  password: SECRET_PASSWORD,
  keySequence: "Ctrl+` or Ctrl+Shift+L",
  description: "Press Ctrl+` (backtick) or Ctrl+Shift+L to open secret logs",
};
