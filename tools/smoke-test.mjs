// Starttest: startet das gebaute Programm, wartet bis WhatsApp Web geladen ist
// und prüft, dass der Anmelde-QR-Code erscheint (also kein
// "Browser nicht unterstützt"). Wird in GitHub Actions nach dem Bauen ausgeführt.
//
// Aufruf: node tools/smoke-test.mjs <Programmdatei> [weitere Argumente ...]
import { spawn } from 'node:child_process';

const [exe, ...extra] = process.argv.slice(2);
if (!exe) {
  console.error('Aufruf: node tools/smoke-test.mjs <Programmdatei> [Argumente]');
  process.exit(2);
}

const PORT = 9333;
const TIMEOUT_MS = 120_000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const child = spawn(exe, [`--remote-debugging-port=${PORT}`, ...extra], { stdio: 'inherit' });
let exited = false;
child.on('exit', (code) => { exited = true; console.log(`Programm beendet (Code ${code})`); });

function evaluate(wsUrl, expression) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    const timer = setTimeout(() => { ws.close(); reject(new Error('CDP-Zeitüberschreitung')); }, 10_000);
    ws.onerror = () => { clearTimeout(timer); reject(new Error('CDP-Verbindung fehlgeschlagen')); };
    ws.onopen = () => ws.send(JSON.stringify({
      id: 1, method: 'Runtime.evaluate', params: { expression, returnByValue: true },
    }));
    ws.onmessage = (m) => {
      const d = JSON.parse(m.data);
      if (d.id !== 1) return;
      clearTimeout(timer);
      ws.close();
      resolve(d.result?.result?.value);
    };
  });
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
          text: (document.body ? document.body.innerText : '').slice(0, 300),
        })`);
        if (last?.qr) {
          console.log('OK: Anmelde-QR-Code wird angezeigt.');
          console.log('User-Agent:', last.ua);
          return;
        }
      }
    } catch { /* Programm startet noch */ }
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
  await sleep(1000);
}
process.exit(code);
