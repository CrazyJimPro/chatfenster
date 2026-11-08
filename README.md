# Chatfenster

Ein eigenes Desktop-Fenster für **WhatsApp Web** – für Linux (und bald Windows).
Statt WhatsApp im Browser-Tab zu öffnen, hast du ein eigenes Programm mit
eigenem Symbol im Startmenü und in der Taskleiste.

> Chatfenster ist **kein offizielles Produkt** von WhatsApp oder Meta. Es zeigt
> einfach die Seite `web.whatsapp.com` in einem eigenen Fenster an. Deine
> Nachrichten laufen genauso verschlüsselt wie im Browser.

## Ich möchte …

| Ich möchte …                              | Linux                                   | Windows                 |
|-------------------------------------------|-----------------------------------------|-------------------------|
| Chatfenster installieren                  | [LINUX.md → Installieren](LINUX.md#chatfenster-installieren) | kommt mit Version 0.2.0 |
| mich mit dem Handy anmelden               | [LINUX.md → Anmelden](LINUX.md#mit-dem-handy-anmelden)       | –                       |
| auf eine neue Version aktualisieren       | [LINUX.md → Aktualisieren](LINUX.md#auf-eine-neue-version-aktualisieren) | –         |
| Chatfenster wieder entfernen              | [LINUX.md → Deinstallieren](LINUX.md#chatfenster-deinstallieren) | –                   |
| einen Fehler melden / nachsehen, was los ist | [LINUX.md → Wenn etwas nicht klappt](LINUX.md#wenn-etwas-nicht-klappt) | –        |

## Was Chatfenster kann (Version 0.1.0)

- WhatsApp Web in einem eigenen Fenster, Anmeldung bleibt nach dem Neustart erhalten
- Links aus Chats öffnen sich in deinem normalen Browser
- Dateien und Bilder landen direkt im Ordner **Downloads**
- Rechtschreibprüfung Deutsch/Englisch, Rechtsklick zeigt Vorschläge
- Fenstergröße und -position werden gemerkt
- Startest du Chatfenster ein zweites Mal, kommt einfach das offene Fenster nach vorn
- Menü **Hilfe → Nach Updates suchen**

Geplant: Windows-Installer, Benachrichtigungen, Symbol im Infobereich mit
Zähler für ungelesene Chats, Autostart, Dunkelmodus und Zoom.

## Technik (für Neugierige)

- [Electron](https://www.electronjs.org/) – bringt einen eigenen Chromium mit,
  deshalb funktioniert WhatsApp Web vollständig (auch Sprachnachrichten).
- Linux-Paket: `.deb`, installiert nach `/opt/Chatfenster`.
- Selbst bauen: `npm install`, dann `npm start` (testen) oder
  `npm run dist:linux` (Paket nach `dist/`).
- Symbol neu erzeugen: `python3 tools/make_icon.py` (braucht Pillow).

Lizenz: MIT
