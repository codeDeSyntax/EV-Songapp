export interface Song {
  id: string;
  title: string;
  path: string;
  content: string;
  message?: string;
  categories: string[];
  dateModified: string;
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
