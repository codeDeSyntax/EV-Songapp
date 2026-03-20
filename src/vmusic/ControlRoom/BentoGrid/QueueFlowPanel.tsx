import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  setSlides,
  setSongTitle,
  setCurrentSongId,
} from "@/store/slices/songSlidesSlice";
import { Song } from "@/types";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronsLeft,
  ChevronsRight,
  ListOrdered,
  RotateCcw,
} from "lucide-react";
import { DepthButton, DepthSurface } from "@/shared/DepthButton";

interface QueueFlowPanelProps {
  isDarkMode: boolean;
}

const QUEUE_ORDER_KEY = "ev-live-queue-order";
const QUEUE_DONE_KEY = "ev-live-queue-done";

type QueueFlowActionType =
  | "prev"
  | "next"
  | "jump-undone"
  | "reset-done"
  | "reset-order"
  | "refresh";

interface QueueFlowActionDetail {
  type: QueueFlowActionType;
}

const safeParseArray = (raw: string | null): string[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return [];
  }
};

export const QueueFlowPanel: React.FC<QueueFlowPanelProps> = ({
  isDarkMode: _isDarkMode,
}) => {
  const dispatch = useAppDispatch();
  const songs = useAppSelector((state) => state.songs.songs);
  const selectedSong = useAppSelector((state) => state.songs.selectedSong);
  const prelistedSongs = useMemo(
    () => songs.filter((song) => song.isPrelisted),
    [songs],
  );

  const [queueOrder, setQueueOrder] = useState<string[]>(() =>
    safeParseArray(localStorage.getItem(QUEUE_ORDER_KEY)),
  );
  const [doneSongIds, setDoneSongIds] = useState<string[]>(() =>
    safeParseArray(localStorage.getItem(QUEUE_DONE_KEY)),
  );

  const emitQueueState = useCallback((order: string[], doneIds: string[]) => {
    window.dispatchEvent(
      new CustomEvent("queueflow:state", {
        detail: {
          queueCount: order.length,
          doneCount: doneIds.length,
          remainingCount: Math.max(0, order.length - doneIds.length),
        },
      }),
    );
  }, []);

  useEffect(() => {
    const prelistedIds = new Set(prelistedSongs.map((song) => song.id));

    setQueueOrder((prev) => {
      const persisted = prev.filter((id) => prelistedIds.has(id));
      const missing = prelistedSongs
        .map((song) => song.id)
        .filter((id) => !persisted.includes(id));
      const nextOrder = [...persisted, ...missing];
      localStorage.setItem(QUEUE_ORDER_KEY, JSON.stringify(nextOrder));
      return nextOrder;
    });

    setDoneSongIds((prev) => {
      const nextDone = prev.filter((id) => prelistedIds.has(id));
      localStorage.setItem(QUEUE_DONE_KEY, JSON.stringify(nextDone));
      return nextDone;
    });
  }, [prelistedSongs]);

  const queueSongs = useMemo(() => {
    const songMap = new Map(prelistedSongs.map((song) => [song.id, song]));
    return queueOrder
      .map((id) => songMap.get(id))
      .filter((song): song is Song => Boolean(song));
  }, [prelistedSongs, queueOrder]);

  const currentQueueIndex = useMemo(() => {
    if (!selectedSong) return -1;
    return queueSongs.findIndex((song) => song.id === selectedSong.id);
  }, [queueSongs, selectedSong]);

  const loadSong = (song: Song) => {
    const slides = song.slides || [];
    dispatch(setSlides(slides));
    dispatch(setSongTitle(song.title));
    dispatch(setCurrentSongId(song.id));
    dispatch({ type: "songs/setSelectedSong", payload: song });
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= queueSongs.length) return;

    setQueueOrder((prev) => {
      const next = [...prev];
      const [moved] = next.splice(index, 1);
      next.splice(target, 0, moved);
      localStorage.setItem(QUEUE_ORDER_KEY, JSON.stringify(next));
      emitQueueState(next, doneSongIds);
      return next;
    });
  };

  const toggleDone = (songId: string) => {
    setDoneSongIds((prev) => {
      const next = prev.includes(songId)
        ? prev.filter((id) => id !== songId)
        : [...prev, songId];
      localStorage.setItem(QUEUE_DONE_KEY, JSON.stringify(next));
      emitQueueState(queueOrder, next);
      return next;
    });
  };

  const resetDone = () => {
    setDoneSongIds([]);
    localStorage.setItem(QUEUE_DONE_KEY, JSON.stringify([]));
    emitQueueState(queueOrder, []);
  };

  const resetOrder = useCallback(() => {
    const nextOrder = prelistedSongs.map((song) => song.id);
    setQueueOrder(nextOrder);
    localStorage.setItem(QUEUE_ORDER_KEY, JSON.stringify(nextOrder));
    emitQueueState(nextOrder, doneSongIds);
  }, [doneSongIds, emitQueueState, prelistedSongs]);

  useEffect(() => {
    emitQueueState(queueOrder, doneSongIds);
  }, [doneSongIds, emitQueueState, queueOrder]);

  useEffect(() => {
    const handleQueueAction = (event: Event) => {
      const customEvent = event as CustomEvent<QueueFlowActionDetail>;
      const action = customEvent.detail?.type;

      switch (action) {
        case "prev":
          goToRelative(-1);
          break;
        case "next":
          goToRelative(1);
          break;
        case "jump-undone":
          jumpToFirstUndone();
          break;
        case "reset-done":
          resetDone();
          break;
        case "reset-order":
          resetOrder();
          break;
        case "refresh":
          emitQueueState(queueOrder, doneSongIds);
          break;
        default:
          break;
      }
    };

    window.addEventListener(
      "queueflow:action",
      handleQueueAction as EventListener,
    );
    return () => {
      window.removeEventListener(
        "queueflow:action",
        handleQueueAction as EventListener,
      );
    };
  }, [doneSongIds, emitQueueState, queueOrder, resetOrder]);

  const goToRelative = (direction: -1 | 1) => {
    if (queueSongs.length === 0) return;

    if (currentQueueIndex === -1) {
      const fallback = direction > 0 ? 0 : queueSongs.length - 1;
      loadSong(queueSongs[fallback]);
      return;
    }

    const target = currentQueueIndex + direction;
    if (target < 0 || target >= queueSongs.length) return;
    loadSong(queueSongs[target]);
  };

  const jumpToFirstUndone = () => {
    const target = queueSongs.find((song) => !doneSongIds.includes(song.id));
    if (target) loadSong(target);
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="px-3 py-2.5 border-b border-app-border flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <ListOrdered className="w-3.5 h-3.5 text-app-text-muted" />
          <span className="text-app-text font-semibold text-ew-sm tracking-wide">
            Live Queue & Flow
          </span>
        </div>
        <span className="text-[10px] text-app-text-muted tabular-nums px-1.5 py-0.5 rounded-full border border-app-border bg-app-bg">
          {queueSongs.length}
        </span>
      </div>

      <div className="px-2.5 py-2 border-b border-app-border flex items-center gap-1.5 flex-wrap">
        <DepthButton
          type="button"
          onClick={() => goToRelative(-1)}
          disabled={queueSongs.length === 0}
          title="Previous in queue"
          sizeClassName="h-6 px-2 rounded-full"
          className="text-[10px]"
        >
          <span className="inline-flex items-center gap-1">
            <ChevronsLeft className="w-3 h-3" />
            Prev
          </span>
        </DepthButton>
        <DepthButton
          type="button"
          onClick={() => goToRelative(1)}
          disabled={queueSongs.length === 0}
          title="Next in queue"
          sizeClassName="h-6 px-2 rounded-full"
          className="text-[10px]"
        >
          <span className="inline-flex items-center gap-1">
            Next
            <ChevronsRight className="w-3 h-3" />
          </span>
        </DepthButton>
        <DepthButton
          type="button"
          onClick={jumpToFirstUndone}
          disabled={queueSongs.length === 0}
          title="Jump to first undone item"
          sizeClassName="h-6 px-2 rounded-full"
          className="text-[10px]"
        >
          <span className="inline-flex items-center gap-1">
            <ListOrdered className="w-3 h-3" />
            Jump
          </span>
        </DepthButton>
        <DepthButton
          type="button"
          onClick={resetDone}
          disabled={doneSongIds.length === 0}
          title="Reset done markers"
          sizeClassName="h-6 px-2 rounded-full"
          className="text-[10px]"
        >
          <span className="inline-flex items-center gap-1">
            <RotateCcw className="w-3 h-3" />
            Reset
          </span>
        </DepthButton>
      </div>

      <div className="flex- h-[68%] overflow-y-auto no-scrollbar p-2">
        {queueSongs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center px-4">
            <p className="text-[11px] text-app-text-muted">
              Add songs to prelist to build your live queue.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {queueSongs.map((song, index) => {
              const isActive = selectedSong?.id === song.id;
              const isDone = doneSongIds.includes(song.id);

              return (
                <div key={song.id} className={`group rounded-lg px-2  `}>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => loadSong(song)}
                      className="min-w-0 flex-1 text-left"
                      title={song.title}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <DepthSurface className="text-[9px] px-1.5 py-0.5 rounded-full text-app-text-muted tabular-nums leading-none">
                          {index + 1}
                        </DepthSurface>
                        {/* dashed line */}
                        <DepthSurface
                          className={`text-[11px] truncate py-1 px-4 ${
                            isDone
                            ? "line-through text-app-text-muted"
                            : "text-app-text"
                            }`}
                        >
                          {song.title}
                        </DepthSurface>
                            <div className="flex-1 border-t border-dashed border-app-accent mx-1" />
                      </div>
                    </button>

                    <div className="flex items-center gap-0.5">
                      <DepthButton
                        type="button"
                        onClick={() => moveItem(index, -1)}
                        disabled={index === 0}
                        sizeClassName="w-5 h-5 rounded-full"
                        className="text-app-text-muted"
                        title="Move up"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </DepthButton>
                      <DepthButton
                        type="button"
                        onClick={() => moveItem(index, 1)}
                        disabled={index === queueSongs.length - 1}
                        sizeClassName="w-5 h-5 rounded-full"
                        className="text-app-text-muted"
                        title="Move down"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </DepthButton>
                      <DepthButton
                        type="button"
                        onClick={() => toggleDone(song.id)}
                        sizeClassName="w-5 h-5 rounded-full"
                        className={
                          isDone ? "text-emerald-500" : "text-app-text-muted"
                        }
                        title={isDone ? "Mark undone" : "Mark done"}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </DepthButton>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
