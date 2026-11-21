// Shared helpers for the test and screenshot scripts: invented demo data, a demo copy of the app
// (no sync, data in the page's own storage), a tiny static server and a headless Edge/Chrome driver.
// Needs only Node 22+ and Microsoft Edge or Google Chrome. Nothing here touches the real database.
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync, mkdtempSync, rmSync, statSync } from "node:fs";
import { join, extname, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const DOCS = join(ROOT, "docs");

/* ---------- demo data (same every run) ---------- */
export function demoData() {
  let seed = 7;
  const rnd = () => { seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const U = (a, b) => a + rnd() * (b - a), pick = a => a[Math.floor(rnd() * a.length)];
  const iso = d => d.toISOString().slice(0, 10);
  const homePrice = date => date < "2026-05-01" ? 0.16 : 0.17;
  const LOC = { public: ["Supermarket car park", "Town centre", "Leisure centre"], fast: ["Motorway services", "Fast charger hub"], work: ["Office car park"] };
  const eff = (car, m) => (car === "hatch" ? 15.4 : 17.6) + ([12, 1, 2].includes(m) ? 3.2 : [11, 3].includes(m) ? 2 : [6, 7, 8].includes(m) ? -1.4 : 0) + U(-0.8, 0.8);
  const charges = []; let n = 0;
  for (const car of ["hatch", "suv"]) {
    let odo = car === "hatch" ? 31240 : 18610, acc = 0;
    for (let d = new Date(Date.UTC(2025, 9, 1)); d <= new Date(Date.UTC(2026, 10, 20)); d.setUTCDate(d.getUTCDate() + 1)) {
      const date = iso(d), m = d.getUTCMonth() + 1;
      let km = car === "hatch" ? U(18, 52) : U(25, 75);
      const trip = car === "suv" && (m === 7 || m === 8) && rnd() < 0.08;
      if (trip) km += U(250, 420);
      acc += km;
      if (acc < (car === "hatch" ? U(160, 320) : U(220, 380)) && !trip) continue;
      const dist = Math.round(acc); odo += dist; acc = 0;
      const kwh = Math.round(dist * eff(car, m) / 10) / 10, r = rnd();
      const type = trip ? "fast" : car === "suv" && r < 0.13 && date >= "2026-01-01" ? "work" : r < 0.22 ? "public" : r < 0.25 ? "fast" : "home";
      const price = { home: homePrice(date), public: U(0.38, 0.46), fast: U(0.59, 0.69), work: 0.31 }[type];
      const t = Date.parse(date + "T20:00:00Z");
      charges.push({ id: `demo${String(++n).padStart(4, "0")}`, date, type, car, kwh, cost: Math.round(kwh * price * 100) / 100, odo,
        location: type === "home" ? "Home" : pick(LOC[type]), notes: type === "home" ? pick(["", "", "", "", "Preconditioned before leaving", "Cold morning"]) : "",
        by: (car === "hatch") !== (rnd() < 0.15) ? "u2" : "u1", socStart: null, socEnd: null, createdAt: t, updatedAt: t });
    }
  }
  // one work charge this month that hasn't been claimed yet, so both claim states show
  const last = charges.filter(c => c.car === "suv" && c.date.startsWith("2026-11")).pop();
  Object.assign(last, { type: "work", location: "Office car park", notes: "", cost: Math.round(last.kwh * 0.31 * 100) / 100 });
  const claimed = {};
  for (const c of charges) if (c.type === "work" && c.date < "2026-11") claimed[c.date.slice(0, 7)] = Math.round(((claimed[c.date.slice(0, 7)] || 0) + c.cost) * 100) / 100;
  const settings = { currency: "EUR", unit: "km", homePrices: [{ from: "", price: 0.16 }, { from: "2026-05", price: 0.17 }], homePrice: 0.17,
    cars: [{ id: "hatch", name: "Hatchback" }, { id: "suv", name: "SUV" }], theme: "dark", accent: "teal", chartStyle: "bars", claimed, people: { u1: "Alex", u2: "Sam" } };
  return { charges, settings };
}

/* ---------- demo copy of the app ---------- */
// ?seed loads the demo data (replacing whatever the page stored); theme/accent/style override settings.
export function buildDemo() {
  const dir = mkdtempSync(join(tmpdir(), "chargelog-demo-"));
  cpSync(join(DOCS, "icons"), join(dir, "icons"), { recursive: true });
  cpSync(join(DOCS, "manifest.webmanifest"), join(dir, "manifest.webmanifest"));
  writeFileSync(join(dir, "config.js"), "window.CHARGE_LOG_FIREBASE = null;\n");
  writeFileSync(join(dir, "cloud.js"), "// demo: no sync\n");
  const seed = `<script>(() => { const q = new URLSearchParams(location.search); if (!q.has("seed")) return;
  const data = ${JSON.stringify(demoData())};
  for (const k of ["theme", "accent"]) if (q.get(k)) data.settings[k] = q.get(k);
  if (q.get("style")) data.settings.chartStyle = q.get("style");
  localStorage.clear();
  localStorage.setItem("chargelog.v1", JSON.stringify(data));
  localStorage.setItem("chargelog.car", q.get("car") || "all");
  localStorage.setItem("chargelog.year", "2026");
  localStorage.setItem("chargelog.look", JSON.stringify({ theme: data.settings.theme, accent: data.settings.accent }));
})();</script>`;
  let html = readFileSync(join(DOCS, "index.html"), "utf8");
  const tag = html.match(/<script src="config\.js[^"]*"><\/script>/)[0];
  html = html.replace(tag, tag + "\n" + seed);
  writeFileSync(join(dir, "index.html"), html);
  return { dir, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

/* ---------- static server ---------- */
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml", ".json": "application/json", ".webmanifest": "application/manifest+json", ".ico": "image/x-icon" };
export function serve(dir) {
  return new Promise(res => {
    const srv = createServer((req, rsp) => {
      let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p.endsWith("/")) p += "index.html";
      const f = join(dir, p);
      if (!f.startsWith(dir) || !existsSync(f) || statSync(f).isDirectory()) { rsp.writeHead(404); rsp.end(); return; }
      rsp.writeHead(200, { "Content-Type": TYPES[extname(f)] || "application/octet-stream", "Cache-Control": "no-store" }); rsp.end(readFileSync(f));
    }).listen(0, "127.0.0.1", () => res({ url: `http://127.0.0.1:${srv.address().port}/`, close: () => srv.close() }));
  });
}

/* ---------- headless browser over the DevTools protocol ---------- */
const BROWSERS = [process.env.BROWSER, "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe", "/usr/bin/microsoft-edge", "/usr/bin/google-chrome", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"];
const sleep = ms => new Promise(r => setTimeout(r, ms));
export async function browser() {
  const exe = BROWSERS.find(p => p && existsSync(p));
  if (!exe) throw new Error("No Edge or Chrome found. Set BROWSER to its path.");
  const profile = mkdtempSync(join(tmpdir(), "chargelog-browser-")), port = 9300 + Math.floor(Math.random() * 500);
  const proc = spawn(exe, ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run", "--no-default-browser-check", "--lang=en-GB",
    `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore" });
  let target;
  for (let i = 0; i < 60 && !target; i++) { try { target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t => t.type === "page"); } catch {} if (!target) await sleep(250); }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener("open", r, { once: true }));
  let id = 0; const pending = new Map(), onLoad = [], errors = [];
  ws.addEventListener("message", e => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    if (m.method === "Page.loadEventFired") onLoad.splice(0).forEach(f => f());
    if (m.method === "Runtime.exceptionThrown") errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
    if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") errors.push(m.params.args.map(a => a.value ?? a.description).join(" "));
  });
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, m => m.error ? rej(new Error(method + ": " + m.error.message)) : res(m.result)); ws.send(JSON.stringify({ id: i, method, params })); });
  await send("Page.enable"); await send("Runtime.enable"); await send("DOM.enable");
  await send("Emulation.setLocaleOverride", { locale: "en-GB" }).catch(() => {});
  const page = {
    errors,
    viewport: (width, height, deviceScaleFactor = 1, mobile = false) => send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor, mobile }),
    async goto(url, settle = 1200) { const loaded = new Promise(r => onLoad.push(r)); await send("Page.navigate", { url }); await loaded; await sleep(settle); },
    async eval(expr) {
      const r = await send("Runtime.evaluate", { expression: `(async () => { ${expr} })()`, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
      return r.result.value;
    },
    async screenshot(file) { const r = await send("Page.captureScreenshot", { format: "png" }); mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, Buffer.from(r.data, "base64")); },
    async setFiles(selector, files) { const { root } = await send("DOM.getDocument"); const { nodeId } = await send("DOM.querySelector", { nodeId: root.nodeId, selector }); await send("DOM.setFileInputFiles", { nodeId, files }); },
    sleep,
    close() { try { ws.close(); } catch {} proc.kill(); setTimeout(() => { try { rmSync(profile, { recursive: true, force: true }); } catch {} }, 1500); },
  };
  return page;
}
