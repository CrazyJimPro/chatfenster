# Chatfenster unter Windows

Gilt für Windows 10 und 11 (64 Bit). Du brauchst **keine Adminrechte**.
Zurück zur [Übersicht](README.md).

> Für Windows gibt es auch die offizielle WhatsApp-App im Microsoft Store.
> Chatfenster ist die Alternative, die unter Windows und Linux gleich aussieht
> und sich gleich bedienen lässt.

## Chatfenster installieren

1. Lade den Installer herunter:
   **[ChatfensterSetup.exe](https://github.com/CrazyJimPro/chatfenster/releases/latest/download/ChatfensterSetup.exe)**
   (ca. 100 MB, landet in deinem Ordner **Downloads**).
2. Falls der Browser meldet, die Datei werde *nicht häufig heruntergeladen*:
   in der Download-Liste auf **⋯** → **Behalten** → **Trotzdem behalten**
   klicken.
3. Doppelklick auf **ChatfensterSetup.exe**.
4. Wahrscheinlich erscheint ein blaues Fenster **„Der Computer wurde durch
   Windows geschützt“**. Das liegt daran, dass der Installer nicht bei
   Microsoft signiert ist. Klicke auf **Weitere Informationen** und dann auf
   **Trotzdem ausführen**.
5. Ein kurzer Fortschrittsbalken läuft durch, eine Rückfrage gibt es nicht.
   Danach startet Chatfenster von selbst.
6. Ab jetzt findest du **Chatfenster** im Startmenü und als Verknüpfung auf
   dem Desktop.

## Mit dem Handy anmelden

Das musst du nur beim ersten Start machen, danach bleibst du angemeldet.

1. Starte **Chatfenster**.
2. Im Fenster erscheint **„Zum Anmelden scannen“** mit einem QR-Code.
3. Auf dem Handy: WhatsApp öffnen → **Einstellungen** (iPhone) bzw. **⋮**
   (Android) → **Verknüpfte Geräte** → **Gerät hinzufügen**.
4. Halte die Handykamera auf den QR-Code. Nach ein paar Sekunden erscheinen
   deine Chats.

Den Haken **„In diesem Browser angemeldet bleiben“** unter dem QR-Code drin
lassen, sonst musst du bei jedem Start neu scannen.

## Chatfenster benutzen

- **Menüleiste einblenden:** Die Leiste ist versteckt. Drück kurz `Alt`, dann
  erscheinen **Datei, Bearbeiten, Ansicht, Hilfe**.
- **Neu laden**, falls etwas hängt: `F5`.
- **Links** aus Chats öffnen sich in deinem normalen Browser.
- **Dateien/Bilder herunterladen:** landen direkt in **Downloads**. Der
  Fortschritt läuft grün über das Symbol in der Taskleiste, danach zeigt ein
  Hinweis den Dateinamen. **„Ordner öffnen“** springt hin.
- **Rechtschreibung:** rot unterstrichene Wörter rechts anklicken, einen
  Vorschlag wählen oder **„… zum Wörterbuch hinzufügen“**.
- **Beenden:** Fenster schließen oder `Strg` + `Q`.

## Auf eine neue Version aktualisieren

1. Prüfen, ob es eine neue Version gibt: in Chatfenster `Alt` drücken →
   **Hilfe → Nach Updates suchen**.
2. Wenn ja: **Release-Seite öffnen** klicken (oder den Link aus
   [Installieren, Schritt 1](#chatfenster-installieren) benutzen) und
   **ChatfensterSetup.exe** herunterladen.
3. **Chatfenster schließen.**
4. Die neue **ChatfensterSetup.exe** ausführen, wie bei der Installation
   (Schritte 3 bis 5). Sie ersetzt die alte Version, deine Anmeldung bleibt
   erhalten.

## Chatfenster deinstallieren

1. **Start** → **Einstellungen** → **Apps** → **Installierte Apps** (Windows 10:
   **Apps & Features**).
2. In der Liste **Chatfenster** suchen → **⋯** → **Deinstallieren** →
   nochmals **Deinstallieren**.
3. Deine Anmeldung und Einstellungen bleiben dabei erhalten. Wenn du auch die
   löschen willst: `Windows-Taste` + `R` drücken, `%APPDATA%` eingeben,
   `Enter`, und dort den Ordner **Chatfenster** löschen.

Tipp: Auf dem Handy unter **Verknüpfte Geräte** kannst du das Gerät danach
auch dort abmelden.

## Wenn etwas nicht klappt

**Wo stehen Fehlermeldungen?**

- Logbuch: `%APPDATA%\Chatfenster\logs\chatfenster.log`
  (schnell erreichbar über `Alt` → **Hilfe → Logordner öffnen**)

**Häufige Fälle**

| Was passiert                                   | Was hilft |
|-----------------------------------------------|-----------|
| „Der Computer wurde durch Windows geschützt“  | Normal bei nicht signierten Programmen: **Weitere Informationen** → **Trotzdem ausführen**. |
| Virenscanner hält den Installer fest          | Datei im Virenscanner freigeben oder später erneut herunterladen. Den Quellcode kannst du auf GitHub einsehen. |
| Fenster bleibt leer / „Verbindung wird hergestellt …“ | Internet prüfen. Chatfenster versucht es alle 10 Sekunden selbst neu. `F5` lädt sofort neu. |
| QR-Code wird nach dem Scannen nicht angenommen | Handy und PC brauchen Internet. Am Handy unter **Verknüpfte Geräte** prüfen, ob schon 4 Geräte verknüpft sind (das ist das Maximum). |
| Nach jedem Start wieder QR-Code               | Beim Scannen war der Haken **„In diesem Browser angemeldet bleiben“** aus. Einmal mit Haken neu scannen. |
| Ich will komplett neu anfangen                 | Chatfenster schließen, Ordner `%APPDATA%\Chatfenster` löschen, neu starten und neu scannen. |
| Installer meldet, Chatfenster laufe noch      | Chatfenster schließen. Wenn es hängt: Task-Manager (`Strg` + `Umschalt` + `Esc`) → **Chatfenster** → **Task beenden**. |

**Wo liegt was?**

| Was                         | Ort |
|-----------------------------|-----|
| Programm                    | `%LOCALAPPDATA%\Programs\Chatfenster` |
| Anmeldung, Einstellungen    | `%APPDATA%\Chatfenster` |
| Logbuch                     | `%APPDATA%\Chatfenster\logs\chatfenster.log` |
