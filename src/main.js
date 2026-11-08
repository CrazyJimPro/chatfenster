// Chatfenster – eigenes Desktop-Fenster für WhatsApp Web
const {
  app, BrowserWindow, Menu, shell, session, screen, dialog, net, ipcMain, nativeTheme,
} = require('electron');
const path = require('path');
const fs = require('fs');
const settings = require('./settings');
const log = require('./log');
const tray = require('./tray');
const autostart = require('./autostart');

const APP_URL = 'https://web.whatsapp.com/';
const PARTITION = 'persist:chatfenster';
const REPO = 'CrazyJimPro/chatfenster';
const ICON = path.join(__dirname, '..', 'assets', 'icon.png');

// WhatsApp Web lehnt Browser ab, die sich als "Electron" melden.
// Deshalb geben wir uns als normales Chrome derselben Version aus.
function chromeUserAgent() {
  const chrome = process.versions.chrome;
  let platform = 'X11; Linux x86_64';
  if (process.platform === 'win32') platform = 'Windows NT 10.0; Win64; x64';
  if (process.platform === 'darwin') platform = 'Macintosh; Intel Mac OS X 10_15_7';
  return `Mozilla/5.0 (${platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chrome} Safari/537.36`;
}
const USER_AGENT = chromeUserAgent();
app.userAgentFallback = USER_AGENT;

// Windows: gleiche Kennung wie der Installer, damit Taskleisten-Gruppierung
// und Benachrichtigungen dem Startmenü-Eintrag zugeordnet werden.
if (process.platform === 'win32') {
  app.setAppUserModelId('de.crazyjimpro.chatfenster');
}

// Für Tests: eigener Datenordner, damit die echte Anmeldung unberührt bleibt
if (process.env.CHATFENSTER_USERDATA) {
  app.setPath('userData', path.resolve(process.env.CHATFENSTER_USERDATA));
}

// Nur eine Instanz: ein zweiter Start holt das vorhandene Fenster nach vorn.
if (!app.requestSingleInstanceLock()) {
  app.quit();
}

let win = null;
let quitting = false;
let askingCloseBehaviour = false;

function showWindow() {
  if (!win) return;
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
}

app.on('second-instance', showWindow);
app.on('before-quit', () => { quitting = true; });

// Beim allerersten Schließen fragen, statt das Fenster still zu verstecken:
// Wer das nicht kennt, hält das Programm sonst für beendet.
async function askCloseBehaviour() {
  if (askingCloseBehaviour) return;
  askingCloseBehaviour = true;
  const { response } = await dialog.showMessageBox(win, {
    type: 'question',
    title: 'Chatfenster schließen',
    message: 'Soll Chatfenster beim Schließen im Infobereich weiterlaufen?',
    detail: 'Dann bekommst du weiter Benachrichtigungen und siehst ungelesene Chats '
      + 'am Symbol neben der Uhr. Beenden kannst du es dann mit Strg+Q oder über '
      + 'das Symbol.\n\nÄndern kannst du das jederzeit unter Einstellungen.',
    buttons: ['Weiterlaufen', 'Beenden'],
    defaultId: 0,
    cancelId: 0,
  });
  askingCloseBehaviour = false;
  if (!win) return;
  const keepRunning = response === 0;
  settings.set('closeHintShown', true);
  settings.set('closeToTray', keepRunning);
  buildMenu();
  if (keepRunning) win.hide();
  else app.quit();
}

function handleClose(event) {
  if (quitting || settings.get('closeToTray') === false) return; // wirklich beenden
  event.preventDefault();
  if (settings.get('closeHintShown')) win.hide();
  else askCloseBehaviour();
}

// --- Benachrichtigungen (Hülle in preload.js) -----------------------------
function fromOurWindow(event) {
  return win && !win.isDestroyed() && event.sender === win.webContents;
}

ipcMain.on('chatfenster:notification-settings', (event) => {
  event.returnValue = {
    enabled: settings.get('notifications') !== false,
    preview: settings.get('notificationPreview') !== false,
  };
});

ipcMain.on('chatfenster:notification-shown', (event) => {
  // Taskleisten-Eintrag blinken lassen, solange das Fenster im Hintergrund ist
  if (fromOurWindow(event) && !win.isFocused()) win.flashFrame(true);
});

ipcMain.on('chatfenster:notification-click', (event) => {
  if (fromOurWindow(event)) showWindow();
});

function sendTestNotification() {
  if (!win) return;
  if (settings.get('notifications') === false) {
    dialog.showMessageBox(win, {
      type: 'info',
      title: 'Benachrichtigungen sind aus',
      message: 'Benachrichtigungen sind ausgeschaltet.',
      detail: 'Schalte sie unter Einstellungen → Benachrichtigungen anzeigen ein.',
    });
    return;
  }
  win.webContents.executeJavaScript(
    "new Notification('Chatfenster', { body: 'So sehen deine Benachrichtigungen aus.' }); true",
  ).catch((err) => console.warn('Test-Benachrichtigung fehlgeschlagen:', err.message));
}

// --- Darstellung ------------------------------------------------------------
const windowBackground = () => (nativeTheme.shouldUseDarkColors ? '#111b21' : '#f0f2f5');

// themeSource steuert prefers-color-scheme und die Dialoge des Programms.
// WhatsApp merkt sich zusätzlich eine eigene Wahl im localStorage, die sonst
// gewinnen würde, und liest das Schema nur beim Laden: deshalb beides setzen
// und neu laden. "Wie das System" löscht die Wahl wieder (WhatsApp-Standard).
async function setTheme(theme) {
  settings.set('theme', theme);
  nativeTheme.themeSource = theme;
  if (!win) return;
  win.setBackgroundColor(windowBackground());
  const script = theme === 'system'
    ? "localStorage.removeItem('theme'); localStorage.removeItem('system-theme-mode');"
    : `localStorage.setItem('theme', ${JSON.stringify(JSON.stringify(theme))});`
      + " localStorage.setItem('system-theme-mode', 'false');";
  try {
    await win.webContents.executeJavaScript(`${script} true`);
  } catch (err) {
    console.warn('WhatsApp-Darstellung nicht gesetzt:', err.message);
  }
  win.webContents.reload();
}

// --- Zoom -------------------------------------------------------------------
const ZOOM_STEPS = [0.5, 0.67, 0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2];

function setZoom(factor) {
  settings.set('zoom', factor);
  if (win) win.webContents.setZoomFactor(factor);
}

function zoomStep(direction) {
  const current = settings.get('zoom') || 1;
  const next = direction > 0
    ? ZOOM_STEPS.find((s) => s > current + 0.001)
    : [...ZOOM_STEPS].reverse().find((s) => s < current - 0.001);
  if (next) setZoom(next);
}

function isWhatsAppUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && (u.hostname === 'web.whatsapp.com');
  } catch {
    return false;
  }
}

function openExternal(url) {
  try {
    const { protocol } = new URL(url);
    if (['http:', 'https:', 'mailto:', 'tel:'].includes(protocol)) {
      shell.openExternal(url);
    }
  } catch { /* ungültige Adresse ignorieren */ }
}

// Gespeicherte Fensterposition nur übernehmen, wenn sie auf einem
// angeschlossenen Bildschirm liegt (sonst landet das Fenster im Nirgendwo).
function restoredBounds() {
  const b = settings.get('bounds') || {};
  const width = Math.max(600, b.width || 1100);
  const height = Math.max(450, b.height || 780);
  if (typeof b.x === 'number' && typeof b.y === 'number') {
    const visible = screen.getAllDisplays().some(({ workArea: a }) =>
      b.x + 100 > a.x && b.x < a.x + a.width - 100 &&
      b.y >= a.y - 10 && b.y < a.y + a.height - 100);
    if (visible) return { x: b.x, y: b.y, width, height };
  }
  return { width, height };
}

function trackWindowState() {
  let timer = null;
  const save = () => {
    if (!win || win.isDestroyed()) return;
    settings.set('maximized', win.isMaximized());
    if (!win.isMaximized() && !win.isMinimized() && !win.isFullScreen()) {
      settings.set('bounds', win.getBounds());
    }
  };
  const later = () => { clearTimeout(timer); timer = setTimeout(save, 500); };
  win.on('resize', later);
  win.on('move', later);
  win.on('close', () => { clearTimeout(timer); save(); });
}

function setupSession(ses) {
  ses.setUserAgent(USER_AGENT);

  // Nur das erlauben, was WhatsApp Web wirklich braucht.
  const allowed = new Set([
    'notifications', 'media', 'clipboard-read', 'clipboard-sanitized-write',
    'fullscreen', 'speaker-selection',
  ]);
  ses.setPermissionRequestHandler((wc, permission, callback, details) => {
    callback(allowed.has(permission) && isWhatsAppUrl(details.requestingUrl || wc.getURL()));
  });
  ses.setPermissionCheckHandler((wc, permission, origin) =>
    allowed.has(permission) && isWhatsAppUrl(origin));

  // Rechtschreibprüfung Deutsch (plus Englisch für gemischte Chats)
  try {
    ses.setSpellCheckerLanguages(['de-DE', 'en-US']);
  } catch (err) {
    console.warn('Rechtschreibprüfung nicht verfügbar:', err.message);
  }

  // Downloads direkt in den Download-Ordner, mit Fortschritt in der Taskleiste
  ses.on('will-download', (event, item) => {
    const dir = app.getPath('downloads');
    const parsed = path.parse(item.getFilename() || 'download');
    let target = path.join(dir, parsed.base);
    for (let i = 1; fs.existsSync(target); i += 1) {
      target = path.join(dir, `${parsed.name} (${i})${parsed.ext}`);
    }
    item.setSavePath(target);
    item.on('updated', () => {
      const total = item.getTotalBytes();
      if (win && total > 0) win.setProgressBar(item.getReceivedBytes() / total);
    });
    item.once('done', (e, state) => {
      if (!win) return;
      win.setProgressBar(-1);
      if (state === 'completed') {
        win.flashFrame(true);
        dialog.showMessageBox(win, {
          type: 'info',
          title: 'Download fertig',
          message: `Gespeichert: ${path.basename(target)}`,
          detail: dir,
          buttons: ['OK', 'Ordner öffnen'],
        }).then(({ response }) => {
          if (response === 1) shell.showItemInFolder(target);
        });
      }
    });
  });
}

function contextMenu(wc, params) {
  const items = [];
  if (params.misspelledWord) {
    for (const s of params.dictionarySuggestions.slice(0, 5)) {
      items.push({ label: s, click: () => wc.replaceMisspelling(s) });
    }
    if (!params.dictionarySuggestions.length) {
      items.push({ label: 'Keine Vorschläge', enabled: false });
    }
    items.push({
      label: `„${params.misspelledWord}“ zum Wörterbuch hinzufügen`,
      click: () => wc.session.addWordToSpellCheckerDictionary(params.misspelledWord),
    });
    items.push({ type: 'separator' });
  }
  if (params.linkURL && !isWhatsAppUrl(params.linkURL)) {
    items.push({ label: 'Link im Browser öffnen', click: () => openExternal(params.linkURL) });
    items.push({ label: 'Link-Adresse kopieren', click: () => require('electron').clipboard.writeText(params.linkURL) });
    items.push({ type: 'separator' });
  }
  if (params.mediaType === 'image' && params.srcURL) {
    items.push({ label: 'Bild kopieren', click: () => wc.copyImageAt(params.x, params.y) });
    items.push({ label: 'Bild speichern', click: () => wc.downloadURL(params.srcURL) });
    items.push({ type: 'separator' });
  }
  if (params.isEditable) {
    items.push({ label: 'Ausschneiden', role: 'cut', enabled: params.editFlags.canCut });
    items.push({ label: 'Kopieren', role: 'copy', enabled: params.editFlags.canCopy });
    items.push({ label: 'Einfügen', role: 'paste', enabled: params.editFlags.canPaste });
    items.push({ label: 'Alles auswählen', role: 'selectAll' });
  } else if (params.selectionText) {
    items.push({ label: 'Kopieren', role: 'copy' });
  }
  while (items.length && items[items.length - 1].type === 'separator') items.pop();
  if (items.length) Menu.buildFromTemplate(items).popup({ window: win });
}

function compareVersions(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i += 1) {
    if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0);
  }
  return 0;
}

async function checkForUpdates() {
  try {
    const res = await net.fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'Chatfenster' },
    });
    if (!res.ok) throw new Error(`GitHub antwortet mit ${res.status}`);
    const rel = await res.json();
    const latest = String(rel.tag_name || '').replace(/^v/, '');
    const current = app.getVersion();
    if (latest && compareVersions(latest, current) > 0) {
      const { response } = await dialog.showMessageBox(win, {
        type: 'info',
        title: 'Update verfügbar',
        message: `Version ${latest} ist da (installiert: ${current}).`,
        detail: process.platform === 'win32'
          ? 'Lade ChatfensterSetup.exe von der Release-Seite und führe es aus.'
          : 'Führe den Installationsbefehl aus der Anleitung erneut aus.',
        buttons: ['Release-Seite öffnen', 'Später'],
      });
      if (response === 0) shell.openExternal(rel.html_url);
    } else {
      dialog.showMessageBox(win, {
        type: 'info',
        title: 'Kein Update',
        message: `Chatfenster ${current} ist aktuell.`,
      });
    }
  } catch (err) {
    dialog.showMessageBox(win, {
      type: 'warning',
      title: 'Update-Prüfung fehlgeschlagen',
      message: 'Konnte nicht nach Updates suchen.',
      detail: err.message,
    });
  }
}

function buildMenu() {
  const template = [
    {
      label: 'Datei',
      submenu: [
        { label: 'Neu laden', accelerator: 'F5', click: () => win && win.webContents.reload() },
        { type: 'separator' },
        { label: 'Beenden', accelerator: 'CmdOrCtrl+Q', role: 'quit' },
      ],
    },
    {
      label: 'Bearbeiten',
      submenu: [
        { label: 'Rückgängig', role: 'undo' },
        { label: 'Wiederholen', role: 'redo' },
        { type: 'separator' },
        { label: 'Ausschneiden', role: 'cut' },
        { label: 'Kopieren', role: 'copy' },
        { label: 'Einfügen', role: 'paste' },
        { label: 'Alles auswählen', role: 'selectAll' },
      ],
    },
    {
      label: 'Ansicht',
      submenu: [
        {
          label: 'Darstellung',
          submenu: [
            ['system', 'Wie das System'],
            ['light', 'Hell'],
            ['dark', 'Dunkel'],
          ].map(([theme, label]) => ({
            id: `theme-${theme}`,
            label,
            type: 'radio',
            checked: (settings.get('theme') || 'system') === theme,
            click: () => setTheme(theme),
          })),
        },
        { type: 'separator' },
        { id: 'zoom-in', label: 'Vergrößern', accelerator: 'CmdOrCtrl+Plus', click: () => zoomStep(1) },
        { id: 'zoom-out', label: 'Verkleinern', accelerator: 'CmdOrCtrl+-', click: () => zoomStep(-1) },
        { id: 'zoom-reset', label: 'Originalgröße', accelerator: 'CmdOrCtrl+0', click: () => setZoom(1) },
        // Unsichtbar, nur für die Tastatur: "+" ohne Umschalt (deutsche Tastatur)
        // und der Ziffernblock sind für Electron andere Tasten
        { label: 'Vergrößern', accelerator: 'CmdOrCtrl+=', visible: false, click: () => zoomStep(1) },
        { label: 'Vergrößern', accelerator: 'CmdOrCtrl+numadd', visible: false, click: () => zoomStep(1) },
        { label: 'Verkleinern', accelerator: 'CmdOrCtrl+numsub', visible: false, click: () => zoomStep(-1) },
        { label: 'Originalgröße', accelerator: 'CmdOrCtrl+num0', visible: false, click: () => setZoom(1) },
        { type: 'separator' },
        { label: 'Vollbild', role: 'togglefullscreen' },
        { type: 'separator' },
        { label: 'Entwicklerwerkzeuge', accelerator: 'CmdOrCtrl+Shift+I', role: 'toggleDevTools' },
      ],
    },
    {
      label: 'Einstellungen',
      submenu: [
        {
          label: 'Benachrichtigungen anzeigen',
          type: 'checkbox',
          checked: settings.get('notifications') !== false,
          click: (item) => settings.set('notifications', item.checked),
        },
        {
          label: 'Nachrichtentext in Benachrichtigungen zeigen',
          type: 'checkbox',
          checked: settings.get('notificationPreview') !== false,
          click: (item) => settings.set('notificationPreview', item.checked),
        },
        { type: 'separator' },
        { label: 'Test-Benachrichtigung senden', click: sendTestNotification },
        { type: 'separator' },
        {
          label: 'Beim Schließen im Infobereich weiterlaufen',
          type: 'checkbox',
          checked: settings.get('closeToTray') !== false,
          click: (item) => {
            settings.set('closeToTray', item.checked);
            settings.set('closeHintShown', true); // Frage ist damit beantwortet
          },
        },
        { type: 'separator' },
        {
          label: 'Beim Anmelden automatisch starten',
          type: 'checkbox',
          checked: autostart.isEnabled(),
          click: (item) => {
            autostart.setEnabled(item.checked);
            buildMenu(); // zeigt den echten Stand und schaltet den Punkt darunter frei
          },
        },
        {
          label: 'Dabei nur als Symbol starten, ohne Fenster',
          type: 'checkbox',
          enabled: autostart.isEnabled(),
          checked: settings.get('autostartHidden') === true,
          click: (item) => settings.set('autostartHidden', item.checked),
        },
      ],
    },
    {
      label: 'Hilfe',
      submenu: [
        { label: 'Nach Updates suchen', click: checkForUpdates },
        { label: 'Projektseite öffnen', click: () => shell.openExternal(`https://github.com/${REPO}`) },
        { label: 'Logordner öffnen', click: () => shell.openPath(path.join(app.getPath('userData'), 'logs')) },
        { type: 'separator' },
        {
          label: 'Über Chatfenster',
          click: () => dialog.showMessageBox(win, {
            type: 'info',
            title: 'Über Chatfenster',
            message: `Chatfenster ${app.getVersion()}`,
            detail: 'Eigenes Desktop-Fenster für WhatsApp Web.\n'
              + 'Kein offizielles Produkt von WhatsApp oder Meta.\n\n'
              + `Electron ${process.versions.electron} · Chrome ${process.versions.chrome}`,
          }),
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function createWindow() {
  win = new BrowserWindow({
    ...restoredBounds(),
    minWidth: 600,
    minHeight: 450,
    title: 'Chatfenster',
    icon: ICON,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: windowBackground(),
    // backgroundThrottling bewusst NICHT abschalten: Sonst gilt die Seite auch im
    // versteckten Fenster als sichtbar, und WhatsApp zeigt keine Benachrichtigungen
    // mehr bzw. könnte Nachrichten als gelesen markieren.
    webPreferences: {
      partition: PARTITION,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (settings.get('maximized')) win.maximize();
  const startHidden = autostart.startedByAutostart() && settings.get('autostartHidden') === true;
  win.once('ready-to-show', () => { if (!startHidden) win.show(); });
  win.on('focus', () => win.flashFrame(false));
  trackWindowState();
  win.on('close', handleClose);
  // Windows fährt herunter oder meldet ab: nicht verstecken, sondern beenden
  win.on('session-end', () => { quitting = true; });

  const wc = win.webContents;

  // Seitentitel von WhatsApp ("(3) WhatsApp") als Fenstertitel übernehmen;
  // die Zahl darin ist die Anzahl der Chats mit ungelesenen Nachrichten
  win.on('page-title-updated', (e, title) => {
    e.preventDefault();
    win.setTitle(title.replace(/WhatsApp/g, 'Chatfenster'));
    const match = /^\((\d+)\)/.exec(title);
    tray.setUnread(match ? Number(match[1]) : 0);
  });

  // Fremde Links im normalen Browser öffnen, nie im App-Fenster
  wc.setWindowOpenHandler(({ url }) => {
    if (!isWhatsAppUrl(url)) openExternal(url);
    return { action: 'deny' };
  });
  wc.on('will-navigate', (e, url) => {
    if (!isWhatsAppUrl(url)) {
      e.preventDefault();
      openExternal(url);
    }
  });

  wc.on('context-menu', (e, params) => contextMenu(wc, params));

  // Gespeicherten Zoom bei jedem Laden setzen; Strg + Mausrad läuft über dieselben Stufen
  wc.on('dom-ready', () => wc.setZoomFactor(settings.get('zoom') || 1));
  wc.on('zoom-changed', (e, direction) => zoomStep(direction === 'in' ? 1 : -1));

  // Bei Verbindungsfehler (z. B. kein Internet beim Start) nach 10 s neu versuchen
  wc.on('did-fail-load', (e, code, desc, url, isMainFrame) => {
    if (isMainFrame && code !== -3) {
      console.warn(`Laden fehlgeschlagen (${code} ${desc}), neuer Versuch in 10 s`);
      setTimeout(() => { if (win && !win.isDestroyed()) win.loadURL(APP_URL); }, 10000);
    }
  });

  wc.on('render-process-gone', (e, details) => {
    console.error('Seitenprozess beendet:', details.reason, details.exitCode);
    if (details.reason !== 'clean-exit') setTimeout(() => win && win.loadURL(APP_URL), 2000);
  });

  win.on('closed', () => { win = null; });
  win.loadURL(APP_URL);
}

app.whenReady().then(() => {
  log.init();
  settings.load();
  nativeTheme.themeSource = settings.get('theme') || 'system';
  setupSession(session.fromPartition(PARTITION));
  buildMenu();
  createWindow();
  tray.init({ show: showWindow, getWindow: () => win });
});

app.on('window-all-closed', () => app.quit());
