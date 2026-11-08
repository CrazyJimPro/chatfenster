// Einfaches Logbuch: schreibt Warnungen und Fehler zusätzlich in eine Datei
// (Linux: ~/.config/Chatfenster/logs/chatfenster.log,
//  Windows: %APPDATA%\Chatfenster\logs\chatfenster.log)
const { app } = require('electron');
const fs = require('fs');
const path = require('path');
const util = require('util');

const MAX_BYTES = 1024 * 1024;
let file = null;

function write(level, args) {
  if (!file) return;
  const line = `${new Date().toISOString()} [${level}] ${util.format(...args)}\n`;
  try { fs.appendFileSync(file, line); } catch { /* Logbuch darf nie stören */ }
}

function init() {
  const dir = path.join(app.getPath('userData'), 'logs');
  try {
    fs.mkdirSync(dir, { recursive: true });
    file = path.join(dir, 'chatfenster.log');
    if (fs.existsSync(file) && fs.statSync(file).size > MAX_BYTES) {
      fs.renameSync(file, `${file}.1`);
    }
  } catch {
    file = null;
  }
  for (const level of ['log', 'info', 'warn', 'error']) {
    const orig = console[level].bind(console);
    console[level] = (...args) => { orig(...args); write(level.toUpperCase(), args); };
  }
  process.on('uncaughtException', (err) => console.error('Unerwarteter Fehler:', err));
  process.on('unhandledRejection', (err) => console.error('Unbehandelter Fehler:', err));
  console.info(`Chatfenster ${app.getVersion()} gestartet (Electron ${process.versions.electron}, ${process.platform})`);
  return file;
}

module.exports = { init };
