# Chatfenster unter Linux

Gilt für Linux Mint, Ubuntu und Debian (64 Bit). Zurück zur
[Übersicht](README.md).

## Chatfenster installieren

1. Öffne ein **Terminal** (Startmenü → „Terminal“, oder `Strg` + `Alt` + `T`).
2. Kopiere diesen Befehl hinein und drücke `Enter`:

   ```bash
   curl -fsSL https://raw.githubusercontent.com/CrazyJimPro/chatfenster/main/installscript/install.sh | bash
   ```

3. Das Skript sucht die neueste Version und lädt sie herunter (ca. 100 MB,
   ein Fortschrittsbalken läuft durch).
4. Es fragt **einmal dein Passwort** ab (`[sudo] Passwort für …`). Beim Tippen
   erscheinen keine Sternchen – das ist normal. Mit `Enter` bestätigen.
5. Am Ende steht **„Fertig!“**. Chatfenster ist jetzt im Startmenü unter
   **Internet** zu finden.

> Falls `curl` fehlt, meldet das Skript das. Dann zuerst
> `sudo apt install curl` ausführen und Schritt 2 wiederholen.

## Mit dem Handy anmelden

Das musst du nur beim ersten Start machen – danach bleibst du angemeldet.

1. Starte **Chatfenster** aus dem Startmenü.
2. Im Fenster erscheint **„Zum Anmelden scannen“** mit einem QR-Code.
3. Auf dem Handy: WhatsApp öffnen → **Einstellungen** (iPhone) bzw. **⋮**
   (Android) → **Verknüpfte Geräte** → **Gerät hinzufügen**.
4. Halte die Handykamera auf den QR-Code. Nach ein paar Sekunden erscheinen
   deine Chats.

Den Haken **„In diesem Browser angemeldet bleiben“** unter dem QR-Code drin
lassen, sonst musst du bei jedem Start neu scannen.

## Chatfenster benutzen

- **Menüleiste einblenden:** Die Leiste ist versteckt. Drück kurz `Alt`, dann
  erscheinen **Datei, Bearbeiten, Ansicht, Einstellungen, Hilfe**.
- **Neu laden**, falls etwas hängt: `F5`.
- **Links** aus Chats öffnen sich in deinem normalen Browser.
- **Dateien/Bilder herunterladen:** landen direkt in **Downloads**. Ein
  Hinweis zeigt den Dateinamen, **„Ordner öffnen“** springt hin.
- **Rechtschreibung:** rot unterstrichene Wörter rechts anklicken → Vorschlag
  wählen oder **„… zum Wörterbuch hinzufügen“**.
- **Beenden:** `Strg` + `Q`. Das **X** versteckt das Fenster nur, siehe
  [Das Symbol im Infobereich](#das-symbol-im-infobereich).

## Das Symbol im Infobereich

Solange Chatfenster läuft, liegt sein Symbol in der Leiste neben der Uhr. Hast du
ungelesene Chats, zeigt ein **roter Kreis mit Zahl** an, wie viele es sind
(ab 10 steht dort „9+“).

- **Klick auf das Symbol:** holt das Fenster nach vorn.
- **Rechtsklick:** Menü mit **Chatfenster öffnen** und **Beenden**.

**Fenster schließen heißt jetzt verstecken:** Mit dem **X** verschwindet nur das
Fenster. Chatfenster läuft im Hintergrund weiter, du bekommst also weiter
Benachrichtigungen. Beim allerersten Schließen fragt Chatfenster, ob du das so
möchtest (**Weiterlaufen** oder **Beenden**).

**Ganz beenden** kannst du es so:

- `Strg` + `Q` im Fenster, oder
- Rechtsklick auf das Symbol → **Beenden**.

**Lieber wie früher?** `Alt` drücken → **Einstellungen** → Haken bei **Beim
Schließen im Infobereich weiterlaufen** entfernen. Dann beendet das **X**
Chatfenster wieder ganz.

## Benachrichtigungen einstellen

Bei neuen Nachrichten erscheint unten rechts am Bildschirmrand eine Benachrichtigung mit Name und
Nachrichtentext, auch wenn Chatfenster im Hintergrund liegt.
**Ein Klick darauf** holt Chatfenster nach vorn und öffnet den Chat.

1. In Chatfenster kurz `Alt` drücken, dann erscheint die Menüleiste.
2. Menü **Einstellungen** öffnen. Dort gibt es drei Punkte:
   - **Benachrichtigungen anzeigen**: Haken weg = gar keine Benachrichtigungen mehr.
   - **Nachrichtentext in Benachrichtigungen zeigen**: Haken weg = es erscheint
     nur noch „Neue Nachricht“, ohne Absender, Text und Profilbild. Gut, wenn
     andere auf deinen Bildschirm schauen können.
   - **Test-Benachrichtigung senden**: zeigt sofort eine Probe-Benachrichtigung.
     Damit prüfst du, ob Linux sie durchlässt.
3. Die Einstellungen gelten sofort und bleiben nach einem Neustart erhalten.

Kommt bei der Test-Benachrichtigung nichts an: Im Startmenü
**Benachrichtigungen** öffnen (Linux Mint: *Systemeinstellungen →
Benachrichtigungen*) und prüfen, ob Benachrichtigungen eingeschaltet sind und
**„Nicht stören“** aus ist.

Ton und Benachrichtigungen lassen sich zusätzlich in WhatsApp selbst einstellen
(in WhatsApp Web unter dessen eigenen Einstellungen → Benachrichtigungen). Was
du dort abschaltest, kommt in Chatfenster auch nicht an.

## Auf eine neue Version aktualisieren

1. Prüfen, ob es eine neue Version gibt: in Chatfenster `Alt` drücken →
   **Hilfe → Nach Updates suchen**.
2. Wenn ja: **denselben Befehl wie bei der Installation** im Terminal ausführen.
   Läuft Chatfenster noch, beendet das Skript es selbst:

   ```bash
   curl -fsSL https://raw.githubusercontent.com/CrazyJimPro/chatfenster/main/installscript/install.sh | bash
   ```

3. Passwort eingeben, danach Chatfenster wieder starten. Deine Anmeldung bleibt
   erhalten.

Ist schon die neueste Version drauf, meldet das Skript
**„… ist bereits installiert – nichts zu tun.“**

## Chatfenster deinstallieren

1. Terminal öffnen und ausführen:

   ```bash
   curl -fsSL https://raw.githubusercontent.com/CrazyJimPro/chatfenster/main/installscript/uninstall.sh | bash
   ```

2. Passwort eingeben.
3. Das Skript fragt: **„Auch löschen? [j/N]“**
   - `j` → deine Anmeldung und Einstellungen werden gelöscht (beim nächsten
     Installieren musst du neu scannen).
   - `Enter` → sie bleiben erhalten.

Tipp: Auf dem Handy unter **Verknüpfte Geräte** kannst du das Gerät danach
auch dort abmelden.

## Wenn etwas nicht klappt

**Wo stehen Fehlermeldungen?**

- Logbuch: `~/.config/Chatfenster/logs/chatfenster.log`
  (schnell erreichbar über `Alt` → **Hilfe → Logordner öffnen**)
- Noch mehr Ausgaben: Chatfenster schließen und im Terminal mit
  `chatfenster` starten – alles erscheint dann direkt dort.

**Häufige Fälle**

| Was passiert                                   | Was hilft |
|-----------------------------------------------|-----------|
| Fenster bleibt leer / „Verbindung wird hergestellt …“ | Internet prüfen. Chatfenster versucht es alle 10 Sekunden selbst neu. `F5` lädt sofort neu. |
| QR-Code wird nach dem Scannen nicht angenommen | Handy und PC brauchen Internet. Am Handy unter **Verknüpfte Geräte** prüfen, ob schon 4 Geräte verknüpft sind (das ist das Maximum). |
| Nach jedem Start wieder QR-Code               | Beim Scannen war der Haken **„In diesem Browser angemeldet bleiben“** aus. Einmal mit Haken neu scannen. |
| Ich will komplett neu anfangen                 | Chatfenster beenden (`Strg` + `Q`), Ordner `~/.config/Chatfenster` löschen, neu starten und neu scannen. |
| Keine Benachrichtigungen                        | Siehe [Benachrichtigungen einstellen](#benachrichtigungen-einstellen): Haken unter **Einstellungen** prüfen, Test-Benachrichtigung senden, „Nicht stören“ aus. |
| Kein Symbol neben der Uhr                       | Der Oberfläche fehlt der Infobereich (z. B. GNOME ohne Erweiterung *AppIndicator*). Chatfenster läuft trotzdem: Ein neuer Start aus dem Startmenü holt das Fenster zurück. Oder den Haken bei **Einstellungen → Beim Schließen im Infobereich weiterlaufen** entfernen. |
| Fenster ist weg, Programm läuft noch            | Das **X** versteckt nur. Klick auf das Symbol oder Chatfenster aus dem Startmenü starten holt es zurück. |
| Startet gar nicht                               | Im Terminal `chatfenster` starten und die Ausgabe ansehen bzw. mitschicken. |

**Wo liegt was?**

| Was                         | Ort |
|-----------------------------|-----|
| Programm                    | `/opt/Chatfenster` |
| Startmenü-Eintrag           | `/usr/share/applications/chatfenster.desktop` |
| Anmeldung, Einstellungen    | `~/.config/Chatfenster` |
| Logbuch                     | `~/.config/Chatfenster/logs/chatfenster.log` |
