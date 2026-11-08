# Chatfenster

Ein eigenes Desktop-Fenster für **WhatsApp Web** – für Linux und Windows.
Statt WhatsApp im Browser-Tab zu öffnen, hast du ein eigenes Programm mit
eigenem Symbol im Startmenü und in der Taskleiste.

> Chatfenster ist **kein offizielles Produkt** von WhatsApp oder Meta. Es zeigt
> einfach die Seite `web.whatsapp.com` in einem eigenen Fenster an. Deine
> Nachrichten laufen genauso verschlüsselt wie im Browser.

## Ich möchte …

| Ich möchte …                              | Linux | Windows |
|-------------------------------------------|-------|---------|
| Chatfenster installieren                  | [Installieren](LINUX.md#chatfenster-installieren) | [Installieren](WINDOWS.md#chatfenster-installieren) |
| mich mit dem Handy anmelden               | [Anmelden](LINUX.md#mit-dem-handy-anmelden) | [Anmelden](WINDOWS.md#mit-dem-handy-anmelden) |
| wissen, wie ich es bediene                | [Benutzen](LINUX.md#chatfenster-benutzen) | [Benutzen](WINDOWS.md#chatfenster-benutzen) |
| auf eine neue Version aktualisieren       | [Aktualisieren](LINUX.md#auf-eine-neue-version-aktualisieren) | [Aktualisieren](WINDOWS.md#auf-eine-neue-version-aktualisieren) |
| Chatfenster wieder entfernen              | [Deinstallieren](LINUX.md#chatfenster-deinstallieren) | [Deinstallieren](WINDOWS.md#chatfenster-deinstallieren) |
| nachsehen, warum etwas nicht klappt       | [Hilfe bei Problemen](LINUX.md#wenn-etwas-nicht-klappt) | [Hilfe bei Problemen](WINDOWS.md#wenn-etwas-nicht-klappt) |

## Was Chatfenster kann (Version 0.2.0)

- WhatsApp Web in einem eigenen Fenster, Anmeldung bleibt nach dem Neustart erhalten
- Links aus Chats öffnen sich in deinem normalen Browser
- Dateien und Bilder landen direkt im Ordner **Downloads**
- Rechtschreibprüfung Deutsch/Englisch, Rechtsklick zeigt Vorschläge
- Fenstergröße und -position werden gemerkt
- Startest du Chatfenster ein zweites Mal, kommt einfach das offene Fenster nach vorn
- Menü **Hilfe → Nach Updates suchen**

Geplant: Benachrichtigungen, Symbol im Infobereich mit Zähler für ungelesene
Chats, Autostart, Dunkelmodus und Zoom.

## Technik (für Neugierige)

- [Electron](https://www.electronjs.org/) – bringt einen eigenen Chromium mit,
  deshalb funktioniert WhatsApp Web vollständig (auch Sprachnachrichten).
- Linux-Paket: `.deb`, installiert nach `/opt/Chatfenster`.
- Windows-Installer: NSIS, installiert pro Benutzer nach
  `%LOCALAPPDATA%\Programs\Chatfenster`, ohne Adminrechte.
- Selbst bauen: `npm install`, dann `npm start` (testen),
  `npm run dist:linux` bzw. `npm run dist:win` (Paket nach `dist/`).
- Starttest: `npm run smoke -- <Programmdatei>` startet das gebaute Programm
  und prüft, dass WhatsApp Web den QR-Code anzeigt.
- Releases: Wird auf GitHub ein Release veröffentlicht, baut GitHub Actions
  beide Pakete, testet sie und hängt sie an (`.github/workflows/build.yml`).
- Symbol neu erzeugen: `python3 tools/make_icon.py` (braucht Pillow).

Lizenz: MIT
