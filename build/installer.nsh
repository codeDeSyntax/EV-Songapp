!macro customInit
  ; Kill running songCast before installing so app.asar isn't locked
  nsExec::ExecToLog 'taskkill /f /im songCast.exe'
!macroend
