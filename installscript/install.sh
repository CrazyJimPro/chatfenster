#!/usr/bin/env bash
# Chatfenster – Installation und Update unter Linux (Debian/Ubuntu/Mint)
#
#   curl -fsSL https://raw.githubusercontent.com/CrazyJimPro/chatfenster/main/installscript/install.sh | bash
#
# Lädt das neueste .deb-Paket aus den GitHub-Releases und installiert es.
# Erneut ausführen = auf die neueste Version aktualisieren.
# Optional: ./install.sh /pfad/zu/Chatfenster-x.y.z-amd64.deb  (lokale Datei)
set -euo pipefail

REPO="CrazyJimPro/chatfenster"

fehler() { echo "FEHLER: $*" >&2; exit 1; }

command -v apt-get >/dev/null || fehler "Dieses Skript braucht ein System mit apt (Debian, Ubuntu, Linux Mint)."
[ "$(dpkg --print-architecture)" = "amd64" ] || fehler "Es gibt nur ein Paket für 64-Bit-PCs (amd64)."
command -v curl >/dev/null || fehler "curl fehlt. Bitte zuerst: sudo apt install curl"

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
chmod 755 "$tmp"   # apt liest die Datei als eigener Benutzer
deb="$tmp/chatfenster.deb"

if [ $# -ge 1 ]; then
  [ -f "$1" ] || fehler "Datei nicht gefunden: $1"
  cp "$1" "$deb"
  echo "Installiere lokale Datei $1 ..."
else
  echo "Suche die neueste Version von Chatfenster ..."
  json="$(curl -fsSL "https://api.github.com/repos/$REPO/releases/latest")" \
    || fehler "GitHub ist nicht erreichbar. Internetverbindung prüfen."
  tag="$(printf '%s' "$json" | grep -o '"tag_name": *"[^"]*"' | head -1 | cut -d'"' -f4)"
  url="$(printf '%s' "$json" | grep -o '"browser_download_url": *"[^"]*amd64\.deb"' | head -1 | cut -d'"' -f4)"
  [ -n "$url" ] || fehler "Im neuesten Release wurde kein .deb-Paket gefunden."
  # nur echte Installationen zählen (Status "ii"), nicht Reste nach dem Entfernen ("rc")
  installiert="$(dpkg-query -W -f='${db:Status-Abbrev}|${Version}' chatfenster 2>/dev/null | sed -n 's/^ii *|//p' || true)"
  if [ -n "$installiert" ] && [ "v$installiert" = "$tag" ]; then
    echo "Chatfenster $tag ist bereits installiert – nichts zu tun."
    exit 0
  fi
  echo "Lade Chatfenster $tag herunter ..."
  # GitHub antwortet bei Release-Dateien zeitweise mit 504, darum mehrfach versuchen
  curl -fL --retry 6 --retry-delay 10 --progress-bar -o "$deb" "$url" \
    || fehler "Download fehlgeschlagen. Bitte in ein paar Minuten noch einmal versuchen."
fi
chmod 644 "$deb"

# Läuft Chatfenster noch (auch versteckt im Infobereich), sauber beenden,
# damit nach dem Update nicht weiter die alte Version läuft.
if pgrep -x chatfenster >/dev/null 2>&1; then
  echo "Beende das laufende Chatfenster ..."
  pkill -x chatfenster || true
  sleep 2
fi

echo "Installiere (dafür wird einmal dein Passwort abgefragt) ..."
sudo apt-get install -y "$deb"

echo
echo "Fertig! Chatfenster findest du jetzt im Startmenü (Kategorie Internet)."
echo "Beim ersten Start mit dem Handy den QR-Code scannen:"
echo "  WhatsApp > Einstellungen > Verknüpfte Geräte > Gerät hinzufügen"
