// Symbol im Infobereich (neben der Uhr) mit Zähler für ungelesene Chats.
// Unter Windows zeigt zusätzlich das Taskleisten-Symbol den Zähler,
// unter Linux der Starter, sofern die Oberfläche das unterstützt (z. B. Ubuntu-Dock).
const {
  app, Menu, Tray, nativeImage,
} = require('electron');
const path = require('path');

const DIR = path.join(__dirname, '..', 'assets', 'tray');
const IS_WINDOWS = process.platform === 'win32';

let tray = null;
let unread = 0;
let actions = { show: () => {}, getWindow: () => null };

function image(name) {
  return nativeImage.createFromPath(path.join(DIR, `${name}.${IS_WINDOWS ? 'ico' : 'png'}`));
}

const suffix = (count) => (count > 9 ? '9plus' : String(count));

function unreadText(count) {
  return count === 1 ? '1 ungelesener Chat' : `${count} ungelesene Chats`;
}

function buildMenu() {
  const items = [
    { label: 'Chatfenster öffnen', click: () => actions.show() },
  ];
  if (unread > 0) items.push({ label: unreadText(unread), enabled: false });
  items.push({ type: 'separator' }, { label: 'Beenden', click: () => app.quit() });
  return Menu.buildFromTemplate(items);
}

function refresh() {
  if (tray) {
    tray.setImage(image(unread > 0 ? `tray-${suffix(unread)}` : 'tray'));
    tray.setToolTip(unread > 0 ? `Chatfenster: ${unreadText(unread)}` : 'Chatfenster');
    // Unter Linux wird ein geändertes Menü erst durch erneutes Setzen übernommen
    tray.setContextMenu(buildMenu());
  }
  if (IS_WINDOWS) {
    const win = actions.getWindow();
    if (win && !win.isDestroyed()) {
      win.setOverlayIcon(unread > 0 ? image(`badge-${suffix(unread)}`) : null, unread > 0 ? unreadText(unread) : '');
    }
  } else {
    app.setBadgeCount(unread);
  }
}

function init(callbacks) {
  actions = callbacks;
  try {
    tray = new Tray(image('tray'));
    tray.on('click', () => actions.show());
    refresh();
  } catch (err) {
    // Ohne Infobereich läuft alles andere normal weiter
    tray = null;
    console.warn('Symbol im Infobereich nicht verfügbar:', err.message);
  }
}

function setUnread(count) {
  if (count === unread) return;
  unread = count;
  refresh();
}

// Nur für den Starttest
function status() {
  return { active: !!tray && !tray.isDestroyed(), unread };
}

module.exports = { init, setUnread, status };
