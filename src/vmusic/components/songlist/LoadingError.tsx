import React from "react";
import { RefreshCcw } from "lucide-react";

interface LoadingErrorProps {
  fetching: boolean;
  fetchError: string | null;
  songsLength: number;
}

const LoadingError = React.memo(
  ({ fetching, fetchError, songsLength }: LoadingErrorProps) => {
    if (fetching) {
      return (
        <div className="flex flex-col justify-start items-center h-96 w-full">
          <RefreshCcw className="w-10 h-10 text-[#9a674a] text-center animate-spin" />
          <p className="mt-2 text-[14px] text-stone-500 font-medium">
            fetching..
          </p>
        </div>
      );
    }

    if (songsLength === 0 && fetchError) {
      // Convert technical errors to user-friendly messages
      let userFriendlyMessage =
        "Unable to load songs. Please check your song folder and try again.";

      if (fetchError.includes("Failed to fetch songs")) {
        userFriendlyMessage =
          "Unable to access your song folder. Please verify the folder path is correct and try again.";
      } else if (
        fetchError.includes("permission") ||
        fetchError.includes("EACCES")
      ) {
        userFriendlyMessage =
          "Permission denied accessing the song folder. Please check folder permissions.";
      } else if (
        fetchError.includes("ENOENT") ||
        fetchError.includes("not found")
      ) {
        userFriendlyMessage =
          "Song folder not found. Please check if the folder exists and the path is correct.";
      } else if (
        fetchError.includes("network") ||
        fetchError.includes("connection")
      ) {
        userFriendlyMessage =
          "Connection error. Please check your internet connection and try again.";
      }

      return (
        <div className="font-thin w-full flex flex-col justify-start items-center text-[#9a674a] text-center  top-[30%]  transform">
          <div className="mb-4 text-center">
            <h3 className="text-lg font-medium mb-2">Error Loading Songs</h3>
            <p className="text-sm">{userFriendlyMessage}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 px-4 py-2 bg-[#9a674a] text-white rounded hover:bg-[#7d5437] transition-colors text-sm"
            >
              Try Again
            </button>
          </div>
          <img
            src="./look.svg"
            alt="lookerror"
            className="size-20 saturate-0"
          />
        </div>
      );
    }

    return null;
  }
);

LoadingError.displayName = "LoadingError";

export default LoadingError;
