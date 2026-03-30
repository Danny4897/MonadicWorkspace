; Killa il processo prima dell'installazione
!macro customInit
  ExecWait 'taskkill /F /IM "MonadicWorkspace.exe" /T'
  Sleep 1000
!macroend
