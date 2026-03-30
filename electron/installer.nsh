; Killa il processo e tutti i figli prima di installare
!macro customInit
  ExecWait 'taskkill /F /IM "MonadicWorkspace.exe" /T'
  ExecWait 'taskkill /F /IM "MonadicWorkspace Helper.exe" /T'
  ExecWait 'taskkill /F /IM "MonadicWorkspace Helper (GPU).exe" /T'
  ExecWait 'taskkill /F /IM "MonadicWorkspace Helper (Renderer).exe" /T'
  Sleep 2000
!macroend
