export interface Song {
  size: any;
  id: string;
  title: string;
  path: string;
  content: string;
  message?: string;
  categories: string[];
  dateModified: string;
  isPrelisted?: boolean;
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
