; Beim Deinstallieren den Autostart-Eintrag entfernen, den Chatfenster unter
; Einstellungen anlegt. Der Name ist die AppUserModelId aus src/main.js.
; Nicht beim Aktualisieren: Das ruft ebenfalls den Deinstaller auf, und der
; Autostart soll dabei erhalten bleiben.
!macro customUnInstall
  ${ifNot} ${isUpdated}
    DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "de.crazyjimpro.chatfenster"
    DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\Run" "de.crazyjimpro.chatfenster"
  ${endIf}
!macroend
