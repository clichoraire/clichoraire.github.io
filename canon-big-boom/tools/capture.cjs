#!/usr/bin/env node
// Capture d'écran d'une page du jeu dans Chrome headless, en temps réel (animations comprises), via le protocole DevTools.
// Usage : node tools/capture.cjs <url> <sortie.png> [attente en ms] [largeur] [hauteur] [script à évaluer avant la capture]
'use strict';
const { spawn } = require('child_process');
const fs = require('fs');
const [url, out, waitMs = '3000', width = '1280', height = '900', evalScript = ''] = process.argv.slice(2);
if (!url || !out) { console.error('Usage : node tools/capture.cjs <url> <sortie.png> [attente ms] [largeur] [hauteur] [script]'); process.exit(1); }
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const port = 9300 + Math.floor(Math.random() * 500), profile = fs.mkdtempSync('/tmp/cb-chrome-');
const chrome = spawn(CHROME, ['--headless=new', '--no-first-run', '--disable-features=WebAppInstallation', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files', '--hide-scrollbars', '--autoplay-policy=no-user-gesture-required', '--window-size=' + width + ',' + height, '--remote-debugging-port=' + port, '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  let targets = null;
  for (let i = 0; i < 50 && !targets; i++) { await sleep(200); try { targets = await (await fetch('http://127.0.0.1:' + port + '/json')).json(); } catch (e) { } }
  if (!targets) throw new Error('Chrome ne répond pas');
  const page = targets.find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl); let id = 0; const pending = new Map(); const logs = [];
  await new Promise(r => ws.onopen = r);
  ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } else if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') logs.push(d.params.args.map(a => a.value || a.description).join(' ')); else if (d.method === 'Runtime.exceptionThrown') logs.push(d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text); };
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Runtime.enable'); await send('Page.enable');
  await send('Page.navigate', { url });
  await sleep(+waitMs);
  if (evalScript) { const r = await send('Runtime.evaluate', { expression: evalScript, awaitPromise: true }); if (r.result?.exceptionDetails) logs.push('eval: ' + (r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text)); await sleep(800); }
  const title = (await send('Runtime.evaluate', { expression: 'document.title' })).result?.result?.value;
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(out, Buffer.from(shot.result.data, 'base64'));
  console.log('✔ ' + out + ' · titre : ' + title + (logs.length ? '\n✖ erreurs :\n' + logs.join('\n') : ' · aucune erreur'));
  ws.close(); await new Promise(r => { chrome.on('exit', r); chrome.kill(); }); for (let i = 0; i < 5; i++) { try { fs.rmSync(profile, { recursive: true, force: true }); break; } catch (e) { await sleep(300); } } process.exit(logs.length ? 2 : 0);
})().catch(e => { console.error(e); chrome.kill(); process.exit(1); });
