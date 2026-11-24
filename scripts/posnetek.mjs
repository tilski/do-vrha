// Odpre igro v Chromu brez okna, izvede ukaze in posname zaslon po vsakem.
//   node scripts/posnetek.mjs <url> <izhodna-predpona> ["js ukaz" ...]
//   MOBI=390x844 node scripts/posnetek.mjs …      (zaslon telefona)
//   TIPKOVNICA=1 MOBI=390x844 …                    (simulira tipkovnico: zmanjša vidni del zaslona)
// Izpiše rezultate ukazov, napake in okna (alert/confirm). Za lokalni preizkus: cd igra && python3 -m http.server 8765
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const [url, out, ...akcije] = process.argv.slice(2);
const port = 9333;
const ch = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', `--remote-debugging-port=${port}`, '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--window-size=1300,820', `--user-data-dir=${out}-prof`, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws, odprt;
for (let i = 0; i < 50 && !ws; i++) {
  try { const t = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const p = t.find((x) => x.type === 'page'); if (p) { ws = new WebSocket(p.webSocketDebuggerUrl); odprt = new Promise((r) => (ws.onopen = r)); break; } } catch {}
  await sleep(200);
}
await odprt;
let id = 0; const cak = new Map(); const log = [];
const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; cak.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
ws.onmessage = (m) => {
  const d = JSON.parse(m.data);
  if (d.id && cak.has(d.id)) { cak.get(d.id)(d.result); cak.delete(d.id); }
  if (d.method === 'Runtime.exceptionThrown') log.push('[NAPAKA] ' + (d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text));
  if (d.method === 'Page.javascriptDialogOpening') { log.push('[OKNO] ' + d.params.message); cmd('Page.handleJavaScriptDialog', { accept: true }); }
};
await cmd('Runtime.enable'); await cmd('Page.enable');
if (process.env.MOBI) {
  const [w, h] = process.env.MOBI.split('x').map(Number);
  await cmd('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 2, mobile: true });
  await cmd('Emulation.setTouchEmulationEnabled', { enabled: true });
}
await cmd('Page.navigate', { url }); await sleep(12000);
const shot = async (ime) => { const r = await cmd('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(`${out}-${ime}.png`, Buffer.from(r.data, 'base64')); };
let n = 0;
for (const a of akcije) {
  const r = await cmd('Runtime.evaluate', { expression: a, awaitPromise: true, returnByValue: true });
  if (r?.result?.value !== undefined) log.push('= ' + JSON.stringify(r.result.value));
  if (r?.exceptionDetails) log.push('[NAPAKA eval] ' + (r.exceptionDetails.exception?.description || ''));
  await sleep(1500); await shot(String(n++));
}
console.log(log.join('\n')); ws.close(); ch.kill();
