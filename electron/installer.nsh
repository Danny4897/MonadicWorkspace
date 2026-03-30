; Sovrascrive il check "app in esecuzione" di NSIS — killa silenziosamente invece di mostrare il dialog
!macro customCheckAppRunning
  ExecWait 'taskkill /F /IM "${APP_FILENAME}.exe" /T'
  Sleep 1000
!macroend
