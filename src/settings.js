// Einstellungen als kleine JSON-Datei im Benutzerordner der App
// (Linux: ~/.config/Chatfenster/settings.json,
//  Windows: %APPDATA%\Chatfenster\settings.json)
const { app } = require('electron');
const fs = require('fs');
const path = require('path');

const DEFAULTS = {
  bounds: { width: 1100, height: 780 },
  maximized: false,
};

let file = null;
let data = null;

function load() {
  file = path.join(app.getPath('userData'), 'settings.json');
  try {
    data = { ...DEFAULTS, ...JSON.parse(fs.readFileSync(file, 'utf8')) };
  } catch {
    data = { ...DEFAULTS };
  }
  return data;
}

function get(key) {
  if (!data) load();
  return data[key];
}

function set(key, value) {
  if (!data) load();
  data[key] = value;
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const tmp = file + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, file);
  } catch (err) {
    console.error('Einstellungen konnten nicht gespeichert werden:', err);
  }
}

module.exports = { load, get, set };
