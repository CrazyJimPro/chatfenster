#!/usr/bin/env bash
# Chatfenster – Deinstallation unter Linux
#
#   curl -fsSL https://raw.githubusercontent.com/CrazyJimPro/chatfenster/main/installscript/uninstall.sh | bash
set -euo pipefail

if dpkg-query -W chatfenster >/dev/null 2>&1; then
  pkill -x chatfenster 2>/dev/null || true
  echo "Entferne Chatfenster (dafür wird einmal dein Passwort abgefragt) ..."
  sudo apt-get remove -y chatfenster
else
  echo "Chatfenster ist nicht installiert."
fi

rm -f "$HOME/.config/autostart/chatfenster.desktop"

daten="$HOME/.config/Chatfenster"
if [ -d "$daten" ]; then
  echo
  echo "Deine Anmeldung und Einstellungen liegen noch in $daten."
  antwort="n"
  if [ -r /dev/tty ]; then
    read -r -p "Auch löschen? Dann musst du beim nächsten Mal neu den QR-Code scannen. [j/N] " antwort < /dev/tty || true
  fi
  case "$antwort" in
    j|J|ja|Ja) rm -rf "$daten"; echo "Daten gelöscht." ;;
    *) echo "Daten bleiben erhalten." ;;
  esac
fi
echo "Fertig."
