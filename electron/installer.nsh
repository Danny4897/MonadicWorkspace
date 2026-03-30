; Chiude automaticamente MonadicWorkspace prima di installare/aggiornare
!macro customInit
  ExecWait 'taskkill /F /IM "MonadicWorkspace.exe" /T'
  Sleep 500
!macroend
