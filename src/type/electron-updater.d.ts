interface VersionInfo {
  update: boolean
  version: string
  newVersion?: string
}

interface ErrorType {
  message: string
  error: Error
}


 interface Song {
  title: string;
  path: string;
  content: string;
  message?: string;
  dateModified: string;
}
