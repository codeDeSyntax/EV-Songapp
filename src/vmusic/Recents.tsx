import React, { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Clock,
  Calendar,
  Music2,
  Play,
  Search,
  Trash2,
  X,
  AlertCircle,
} from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/store";
import { setCurrentScreen } from "@/store/slices/appSlice";
import TitleBar from "../shared/TitleBar";
import { useSongOperations } from "@/features/songs/hooks/useSongOperations";
import { Song } from "@/types";

interface RecentSong extends Song {
  presentedAt: string;
}

// Function to get relative time string (like "2h ago", "3d ago")
const getRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  // Convert to seconds
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;

  // Convert to minutes
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  // Convert to hours
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;

  // Convert to days
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}d ago`;

  // Convert to weeks
  const diffWeek = Math.floor(diffDay / 7);
  if (diffWeek < 4) return `${diffWeek}w ago`;

  // Convert to months
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth}mo ago`;

  // Convert to years
  const diffYear = Math.floor(diffDay / 365);
  return `${diffYear}y ago`;
};

const Recents: React.FC<{}> = () => {
  const dispatch = useAppDispatch();
  const { presentSong, removeRecentSong } = useSongOperations();
  const allRecentSongs = useAppSelector((state) => state.songs.recentSongs);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmDate, setDeleteConfirmDate] = useState<string | null>(
    null
  );

  // Always use creamy theme
  const creamy = true;

  // Listen for localStorage changes for consistent state
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "recentSongs" && e.newValue !== null) {
        console.log("Recent songs changed in localStorage");
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Calculate date ranges for the three tables
  const now = new Date();
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(now.getDate() - 7);
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(now.getDate() - 14);
  const threeWeeksAgo = new Date();
  threeWeeksAgo.setDate(now.getDate() - 21);

  // Format dates as YYYY-MM-DD for comparison
  const oneWeekAgoStr = oneWeekAgo.toISOString().split("T")[0];
  const twoWeeksAgoStr = twoWeeksAgo.toISOString().split("T")[0];
  const threeWeeksAgoStr = threeWeeksAgo.toISOString().split("T")[0];

  // Songs sung in the current week
  const currentWeekSongs = useMemo(() => {
    let songs: RecentSong[] = [];
    allRecentSongs.forEach((group) => {
      if (group.date >= oneWeekAgoStr) {
        songs = songs.concat(group.songs);
      }
    });

    // Sort by time (newest first)
    return songs
      .filter(
        (song) =>
          !searchQuery.trim() ||
          song.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort(
        (a, b) =>
          new Date(b.presentedAt).getTime() - new Date(a.presentedAt).getTime()
      );
  }, [allRecentSongs, oneWeekAgoStr, searchQuery]);

  // Songs sung in the second week
  const secondWeekSongs = useMemo(() => {
    let songs: RecentSong[] = [];
    allRecentSongs.forEach((group) => {
      if (group.date < oneWeekAgoStr && group.date >= twoWeeksAgoStr) {
        songs = songs.concat(group.songs);
      }
    });

    return songs
      .filter(
        (song) =>
          !searchQuery.trim() ||
          song.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort(
        (a, b) =>
          new Date(b.presentedAt).getTime() - new Date(a.presentedAt).getTime()
      );
  }, [allRecentSongs, oneWeekAgoStr, twoWeeksAgoStr, searchQuery]);

  // Songs sung in the third week
  const thirdWeekSongs = useMemo(() => {
    let songs: RecentSong[] = [];
    allRecentSongs.forEach((group) => {
      if (group.date < twoWeeksAgoStr && group.date >= threeWeeksAgoStr) {
        songs = songs.concat(group.songs);
      }
    });

    return songs
      .filter(
        (song) =>
          !searchQuery.trim() ||
          song.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort(
        (a, b) =>
          new Date(b.presentedAt).getTime() - new Date(a.presentedAt).getTime()
      );
  }, [allRecentSongs, twoWeeksAgoStr, threeWeeksAgoStr, searchQuery]);

  // Function to handle song deletion
  const handleDelete = (songId: string, presentedAt: string) => {
    // Extract the date part from presentedAt ISO string
    const date = new Date(presentedAt).toISOString().split("T")[0];

    // Show confirmation
    setDeleteConfirmId(songId);
    setDeleteConfirmDate(date);
  };

  // Function to confirm song deletion
  const confirmDelete = () => {
    if (deleteConfirmId && deleteConfirmDate) {
      removeRecentSong(deleteConfirmId, deleteConfirmDate);
      setDeleteConfirmId(null);
      setDeleteConfirmDate(null);
    }
  };

  // Function to cancel song deletion
  const cancelDelete = () => {
    setDeleteConfirmId(null);
    setDeleteConfirmDate(null);
  };

  // Function to render a song table
  const renderSongTable = (
    songs: RecentSong[],
    title: string,
    period: string,
    emoji: string
  ) => {
    return (
      <div className="flex-1 min-w-0 px-2">
        <div className="bg-[#f5efdf]/70 backdrop-blur-sm rounded-xl border border-[#e6d7b8] h-full overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-gradient-to-r from-[#f3e4be] to-[#f9f2e1] border-b border-[#e6d7b8] flex items-center justify-between">
            <h3 className="font-semibold text-[#4d3403] flex items-center">
              <span className="mr-2">{emoji}</span>
              <span>{title}</span>
              <span className="ml-2 px-2 py-0.5 bg-[#e6d7b8] text-[#6d5423] text-xs rounded-full">
                {songs.length}
              </span>
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar">
            {songs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                <Clock className="w-10 h-10 text-[#cbb995] mb-2 opacity-70" />
                <p className="text-sm text-[#8d7443]">No songs {period}</p>
              </div>
            ) : (
              <div className="p-2">
                {songs.map((song) => (
                  <motion.div
                    key={`${song.id}-${song.presentedAt}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    whileHover={{ scale: 1.01 }}
                    className={`mb-2 rounded-lg overflow-hidden border ${
                      deleteConfirmId === song.id
                        ? "border-amber-400 bg-amber-50"
                        : "border-[#e6d7b8] bg-[#faf6eb]"
                    }`}
                  >
                    {deleteConfirmId === song.id ? (
                      <div className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <AlertCircle className="w-4 h-4 text-amber-600 mr-2" />
                            <span className="text-xs font-medium text-amber-800">
                              Remove from recents?
                            </span>
                          </div>
                          <div className="flex space-x-1">
                            <button
                              onClick={confirmDelete}
                              className="p-1.5 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={cancelDelete}
                              className="p-1.5 rounded-md bg-[#d1bc91] text-white hover:bg-[#c0ab80] transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <div className="text-xs text-amber-700 font-medium truncate">
                          {song.title}
                        </div>
                      </div>
                    ) : (
                      <div
                        className="p-3 cursor-pointer"
                        onClick={() => presentSong(song)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-medium text-sm text-[#4d3403] truncate mr-2">
                            {song.title.charAt(0).toUpperCase() +
                              song.title.slice(1).toLowerCase()}
                          </div>
                          <div className="flex items-center space-x-1 flex-shrink-0">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="p-1.5 rounded-full bg-[#4d3403] text-white hover:bg-[#6d5423] transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                presentSong(song);
                              }}
                            >
                              <Play className="w-2.5 h-2.5" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="p-1.5 rounded-full bg-[#cbb995] text-white hover:bg-[#b9a683] transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(song.id, song.presentedAt);
                              }}
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </motion.button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <div className="text-[#8d7443] truncate">
                            {song.categories?.length
                              ? song.categories.slice(0, 2).join(", ") +
                                (song.categories.length > 2 ? "..." : "")
                              : "Uncategorized"}
                          </div>
                          <div className="text-[#ae9a75] ml-2 whitespace-nowrap">
                            {getRelativeTime(song.presentedAt)}
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{
        background: "linear-gradient(to bottom, #faeed1 0%, #f5efdf 100%)",
        color: "#4d3403",
      }}
    >
      <TitleBar />

      <div className="flex flex-col h-full pt-6">
        {/* Header with modern search input */}
        <div className="px-6 pb-4 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => dispatch(setCurrentScreen("Songs"))}
                className="p-2 rounded-lg flex items-center justify-center bg-[#4d3403] text-white hover:bg-[#6d5423] shadow-sm"
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>

              <div>
                <h1 className="text-xl font-bold flex items-center gap-1.5 text-[#4d3403]">
                  <Clock className="w-5 h-5" />
                  Recent Songs
                </h1>
                <p className="text-xs text-[#8d7443] mt-0.5">
                  Songs presented in the last three weeks
                </p>
              </div>
            </div>

            {/* Modern search input */}
            {/* <div className="relative max-w-xs w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-[#ae9a75]" />
              </div>
              <input
                type="text"
                placeholder="Search recent songs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-2 pl-10 pr-4 rounded-lg border-0 ring-1 ring-inset ring-[#e6d7b8] bg-white/50 backdrop-blur-sm placeholder:text-[#ae9a75] focus:ring-2 focus:ring-[#8d7443] text-sm shadow-sm"
              />
              {searchQuery && (
                <button
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="w-4 h-4 text-[#ae9a75] hover:text-[#8d7443]" />
                </button>
              )}
            </div> */}
          </div>
        </div>

        {/* Tables in horizontal row */}
        <div className="flex-1 overflow-hidden overflow-y-scroll no-scrollbar px-4 pb-4">
          {currentWeekSongs.length === 0 &&
          secondWeekSongs.length === 0 &&
          thirdWeekSongs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="bg-[#f5efdf] rounded-xl p-8 text-center border border-[#e6d7b8] max-w-md shadow-md">
                <Clock className="w-16 h-16 text-[#cbb995] mx-auto mb-4" />
                <h3 className="text-xl font-bold text-[#4d3403] mb-2">
                  No recent songs found
                </h3>
                <p className="text-[#8d7443] text-sm">
                  Songs will appear here when you present them during church
                  services
                </p>
              </div>
            </div>
          ) : (
            <div className="flex  flex-row gap-4 h-full overflow-y-scroll no-scrollbar">
              {/* Current week table */}
              {renderSongTable(
                currentWeekSongs,
                "This Week",
                "this week",
                "🎵"
              )}

              {/* Second week table */}
              {renderSongTable(secondWeekSongs, "Last Week", "last week", "🗓️")}

              {/* Third week table */}
              {renderSongTable(
                thirdWeekSongs,
                "Two Weeks Ago",
                "two weeks ago",
                "📅"
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Recents;
