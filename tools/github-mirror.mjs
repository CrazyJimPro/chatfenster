// Führt einen Befehl aus und lenkt dessen Downloads von GitHub-Releases über die
// GitHub-API um, zum Beispiel: node tools/github-mirror.mjs npm run dist:linux
//
// Warum: github.com/.../releases/download antwortet zeitweise über längere Phasen
// mit 504, die API liefert dieselben Dateien dann weiter aus. electron-builder und
// Electron lassen sich über Umgebungsvariablen auf einen Spiegel umstellen. Das ist
// hier ein kleiner Server nur für die Dauer des Befehls, er liefert selbst keine
// Dateien, sondern leitet auf die echte Datei von GitHub weiter. Die Prüfsummen
// kontrollieren electron-builder und Electron weiterhin selbst.
//
// GH_TOKEN sollte gesetzt sein, sonst greift schnell das API-Limit.
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Aufruf: node tools/github-mirror.mjs <Befehl> [Argumente]');
  process.exit(2);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
const apiHeaders = {
  'User-Agent': 'chatfenster-build',
  'X-GitHub-Api-Version': '2022-11-28',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
};

async function api(path, headers = {}) {
  let failure;
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    try {
      const res = await fetch(`https://api.github.com${path}`, {
        headers: { ...apiHeaders, ...headers },
        redirect: 'manual',
      });
      if (res.status < 500) return res;
      failure = new Error(`API antwortet ${res.status}`);
    } catch (err) {
      failure = err;
    }
    await sleep(attempt * 2000);
  }
  throw failure;
}

const releases = new Map();

function assetsOf(repo, tag) {
  const key = `${repo}/${tag}`;
  if (!releases.has(key)) {
    const load = (async () => {
      const res = await api(`/repos/${repo}/releases/tags/${encodeURIComponent(tag)}`);
      if (!res.ok) throw new Error(`Release ${key}: ${res.status}`);
      return (await res.json()).assets;
    })();
    load.catch(() => releases.delete(key)); // Fehlschlag nicht merken
    releases.set(key, load);
  }
  return releases.get(key);
}

// Pfad: /<Besitzer>/<Repo>/<Tag>/<Datei>, Antwort: Weiterleitung zur echten Datei
async function locate(pathname) {
  const parts = pathname.split('/').filter(Boolean).map(decodeURIComponent);
  if (parts.length !== 4) return null;
  const [owner, name, tag, file] = parts;
  const repo = `${owner}/${name}`;
  const asset = (await assetsOf(repo, tag)).find((a) => a.name === file);
  if (!asset) return null;
  const res = await api(`/repos/${repo}/releases/assets/${asset.id}`, {
    Accept: 'application/octet-stream',
  });
  const location = res.headers.get('location');
  if (!location) throw new Error(`Datei ${file}: keine Weiterleitung (${res.status})`);
  return location;
}

const server = createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');
  try {
    const location = await locate(pathname);
    console.log(`[Spiegel] ${location ? 'gefunden' : 'NICHT GEFUNDEN'}: ${pathname}`);
    res.writeHead(location ? 302 : 404, location ? { Location: location } : {});
  } catch (err) {
    console.error(`[Spiegel] FEHLER: ${pathname}: ${err.message}`);
    res.writeHead(502);
  }
  res.end();
});

server.listen(0, '127.0.0.1', () => {
  const base = `http://127.0.0.1:${server.address().port}`;
  const child = spawn(args.join(' '), {
    shell: true,
    stdio: 'inherit',
    env: {
      ...process.env,
      ELECTRON_MIRROR: `${base}/electron/electron/`,
      ELECTRON_BUILDER_BINARIES_MIRROR: `${base}/electron-userland/electron-builder-binaries/`,
      ELECTRON_BUILDER_BINARIES_ALLOW_HTTP: 'true',
    },
  });
  child.on('error', (err) => {
    console.error(`Befehl nicht startbar: ${err.message}`);
    process.exit(1);
  });
  child.on('exit', (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
});
