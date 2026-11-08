// Autostart beim Anmelden.
// Linux: Eintrag in ~/.config/autostart (dort auch in den Systemeinstellungen sichtbar).
// Windows: Registry-Wert unter HKCU\...\Run, den Electron selbst schreibt und den
// der Deinstaller wieder entfernt (build/installer.nsh).
const { app } = require('electron');
const fs = require('fs');
const path = require('path');

// Daran erkennt das Programm, dass es vom Autostart gestartet wurde
const ARG = '--autostart';
const IS_WINDOWS = process.platform === 'win32';

const startedByAutostart = () => process.argv.includes(ARG);

function linuxFile() {
  return path.join(app.getPath('appData'), 'autostart', 'chatfenster.desktop');
}

function linuxExec() {
  // Beim Entwickeln ist execPath nur "electron", dazu gehört der App-Ordner
  const parts = app.isPackaged ? [process.execPath] : [process.execPath, app.getAppPath()];
  return [...parts.map((p) => `"${p.replace(/(["`$\\])/g, '\\$1')}"`), ARG].join(' ');
}

function isEnabled() {
  if (IS_WINDOWS) {
    const item = app.getLoginItemSettings({ args: [ARG] });
    // executableWillLaunchAtLogin ist false, wenn im Task-Manager deaktiviert
    return item.openAtLogin && item.executableWillLaunchAtLogin;
  }
  try {
    const text = fs.readFileSync(linuxFile(), 'utf8');
    return !/^Hidden=true/m.test(text) && !/^X-GNOME-Autostart-enabled=false/m.test(text);
  } catch {
    return false;
  }
}

function setEnabled(on) {
  try {
    if (IS_WINDOWS) {
      app.setLoginItemSettings({ openAtLogin: on, enabled: on, args: [ARG] });
    } else if (on) {
      fs.mkdirSync(path.dirname(linuxFile()), { recursive: true });
      fs.writeFileSync(linuxFile(), [
        '[Desktop Entry]',
        'Type=Application',
        'Name=Chatfenster',
        'Comment=Desktop-Fenster für WhatsApp Web',
        `Exec=${linuxExec()}`,
        'Icon=chatfenster',
        'Terminal=false',
        'Categories=Network;InstantMessaging;',
        // Kurz warten, bis Panel und Infobereich der Oberfläche bereit sind
        'X-GNOME-Autostart-Delay=5',
        '',
      ].join('\n'));
    } else {
      fs.rmSync(linuxFile(), { force: true });
    }
  } catch (err) {
    console.error('Autostart konnte nicht geändert werden:', err);
  }
  return isEnabled();
}

module.exports = { isEnabled, setEnabled, startedByAutostart };
