import { SongSlide } from "@/vmusic/ControlRoom/utils/lyricsParser";

export interface Song {
  size: any;
  id: string;
  title: string;
  path: string;
  content: string; // Base64-encoded JSON for .evsong files
  message?: string;
  categories: string[];
  dateModified: string;
  isPrelisted?: boolean;
  slides?: SongSlide[]; // Decoded slides from backend
  metadata?: {
    created: string;
    modified: string;
    isPrelisted?: boolean;
  };
}

export interface EditSong {
  currentScreen: string;
  setCurrentScreen: (screen: string) => void;
  setEditContent: (content: string) => void;
  setEditTitle: (title: string) => void;
  editContent: string;
  editTitle: string;
  selectedSong: Song | null;
  setSelectedSong: (song: Song | null) => void;
}

export interface Collection {
  id: string;
  name: string;
  songIds: string[];
  dateCreated: string;
}
