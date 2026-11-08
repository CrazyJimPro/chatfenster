// Starttest: startet das gebaute Programm, wartet bis WhatsApp Web geladen ist
// und prüft, dass der Anmelde-QR-Code erscheint (also kein
// "Browser nicht unterstützt"). Danach werden die Funktionen des Programms
// selbst geprüft (Infobereich, Schließen ...), ohne Anmeldung und ohne echte
// Einstellungen anzufassen. Wird in GitHub Actions nach dem Bauen ausgeführt.
//
// Aufruf: node tools/smoke-test.mjs <Programmdatei> [weitere Argumente ...]
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [exe, ...extra] = process.argv.slice(2);
if (!exe) {
  console.error('Aufruf: node tools/smoke-test.mjs <Programmdatei> [Argumente]');
  process.exit(2);
}

const PORT = 9333;
const MAIN_PORT = 9334;
const TIMEOUT_MS = 120_000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fatal = (msg) => Object.assign(new Error(msg), { fatal: true });

// Eigener, leerer Datenordner: echte Anmeldungen bleiben unberührt
const profile = mkdtempSync(join(tmpdir(), 'chatfenster-test-'));
const child = spawn(exe, [`--remote-debugging-port=${PORT}`, `--inspect=${MAIN_PORT}`, ...extra], {
  stdio: 'inherit',
  // XDG_CONFIG_HOME: Linux-Autostart-Eintrag landet im Testordner, nicht beim Benutzer
  env: { ...process.env, CHATFENSTER_USERDATA: profile, XDG_CONFIG_HOME: profile },
});
let exited = false;
child.on('exit', (code) => { exited = true; console.log(`Programm beendet (Code ${code})`); });

function evaluate(wsUrl, expression) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    const timer = setTimeout(() => { ws.close(); reject(new Error('CDP-Zeitüberschreitung')); }, 10_000);
    ws.onerror = () => { clearTimeout(timer); reject(new Error('CDP-Verbindung fehlgeschlagen')); };
    ws.onopen = () => ws.send(JSON.stringify({
      id: 1,
      method: 'Runtime.evaluate',
      params: {
        expression, returnByValue: true, awaitPromise: true, includeCommandLineAPI: true,
      },
    }));
    ws.onmessage = (m) => {
      const d = JSON.parse(m.data);
      if (d.id !== 1) return;
      clearTimeout(timer);
      ws.close();
      const failure = d.result?.exceptionDetails;
      if (failure) reject(fatal(`Fehler im Programm: ${failure.exception?.description || failure.text}`));
      else resolve(d.result?.result?.value);
    };
  });
}

async function pageSocket() {
  const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  return list.find((p) => p.type === 'page' && p.url.includes('web.whatsapp.com'))?.webSocketDebuggerUrl;
}

// Ausdruck im Hauptprozess des Programms auswerten. Dort stehen zur Verfügung:
// electron, win (das Fenster), mod('settings') für die eigenen Module aus src/.
async function inMain(expression) {
  const list = await (await fetch(`http://127.0.0.1:${MAIN_PORT}/json/list`)).json();
  return evaluate(list[0].webSocketDebuggerUrl, `(async () => {
    const electron = process.mainModule.require('electron');
    const loaded = Object.entries(process.mainModule.constructor._cache);
    const mod = (name) => loaded.find(([file]) => file.replace(/\\\\/g, '/').endsWith('/src/' + name + '.js'))[1].exports;
    const win = electron.BrowserWindow.getAllWindows()[0];
    return (${expression});
  })()`);
}

const inPage = async (expression) => evaluate(await pageSocket(), expression);

function expect(name, actual, wanted) {
  const ok = JSON.stringify(actual) === JSON.stringify(wanted);
  console.log(`${ok ? 'OK' : 'FEHLER'}: ${name}${ok ? '' : ` (ist ${JSON.stringify(actual)}, soll ${JSON.stringify(wanted)})`}`);
  if (!ok) throw fatal(`Prüfung fehlgeschlagen: ${name}`);
}

async function until(read, wanted, ms = 5000) {
  const start = Date.now();
  let value = await read();
  while (JSON.stringify(value) !== JSON.stringify(wanted) && Date.now() - start < ms) {
    await sleep(200);
    value = await read();
  }
  return value;
}

async function testTray() {
  expect('Symbol im Infobereich angelegt', await inMain("mod('tray').status().active"), true);

  const setTitle = (title) => inPage(`document.title = ${JSON.stringify(title)}; true`);
  const unread = () => inMain("mod('tray').status().unread");
  await setTitle('(3) WhatsApp');
  expect('Zähler übernimmt Zahl aus dem Seitentitel', await until(unread, 3), 3);
  expect('Fenstertitel ohne WhatsApp', await inMain('win.getTitle()'), '(3) Chatfenster');
  await setTitle('(12) WhatsApp');
  expect('Zähler über 9', await until(unread, 12), 12);
  await setTitle('WhatsApp');
  expect('Zähler zurück auf 0', await until(unread, 0), 0);
}

async function testCloseToTray() {
  // Erstes Schließen fragt nach, das Fenster bleibt dabei offen (Dialog nicht bedienbar im Test)
  await inMain("mod('settings').set('closeHintShown', true), true");
  await inMain('win.show(), true');
  await until(() => inMain('win.isVisible()'), true);
  await inMain('win.close(), true');
  expect('Schließen versteckt das Fenster', await until(() => inMain('win.isVisible()'), false), false);
  expect('Programm läuft weiter', exited, false);
  expect(
    'Seite gilt als nicht sichtbar (wichtig für Benachrichtigungen)',
    await until(() => inPage('document.visibilityState'), 'hidden'),
    'hidden',
  );
  await inMain("electron.app.emit('second-instance'), true");
  expect('Zweiter Start holt das Fenster zurück', await until(() => inMain('win.isVisible()'), true), true);
}

async function run() {
  const start = Date.now();
  let last = null;
  while (Date.now() - start < TIMEOUT_MS) {
    if (exited) throw new Error('Programm hat sich vorzeitig beendet');
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const page = list.find((p) => p.type === 'page' && p.url.includes('web.whatsapp.com'));
      if (page) {
        last = await evaluate(page.webSocketDebuggerUrl, `({
          title: document.title,
          ua: navigator.userAgent,
          qr: !!document.querySelector('canvas'),
          notificationWrapper: !!(window.Notification && window.Notification.chatfenster),
          notificationPermission: window.Notification && Notification.permission,
          text: (document.body ? document.body.innerText : '').slice(0, 300),
        })`);
        if (last?.qr) {
          console.log('OK: Anmelde-QR-Code wird angezeigt.');
          if (!last.notificationWrapper) throw fatal('Benachrichtigungs-Hülle fehlt (preload.js nicht geladen?)');
          if (last.notificationPermission !== 'granted') {
            throw fatal(`Benachrichtigungen nicht erlaubt (${last.notificationPermission})`);
          }
          console.log('OK: Benachrichtigungen erlaubt, Hülle aktiv.');
          console.log('User-Agent:', last.ua);
          await testTray();
          await testCloseToTray();
          return;
        }
      }
    } catch (err) {
      if (err.fatal) throw err; // echter Fehler, kein "startet noch"
    }
    await sleep(2000);
  }
  console.error('Letzter Seitenzustand:', JSON.stringify(last, null, 1));
  throw new Error(`Kein QR-Code nach ${TIMEOUT_MS / 1000} s`);
}

let code = 0;
try {
  await run();
} catch (err) {
  console.error('FEHLER:', err.message);
  code = 1;
} finally {
  if (!exited) child.kill();
  await sleep(1500);
  try { rmSync(profile, { recursive: true, force: true }); } catch { /* egal */ }
}
process.exit(code);
