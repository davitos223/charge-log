// Automated checks for Charge Log, run against a demo copy with invented data (never the real database):
//   node tools/test.mjs
// Checks the figures against an independent calculation, adding/editing/deleting charges, the typo checks,
// loading backups, saving settings, and the layout at phone, tablet and desktop widths.
import { writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { demoData, buildDemo, serve, browser } from "./lib.mjs";

let pass = 0, fail = 0;
const ok = (cond, name, detail = "") => { if (cond) { pass++; console.log("  ✓ " + name); } else { fail++; console.log("  ✗ " + name + (detail ? "  →  " + detail : "")); } };
const section = t => console.log("\n" + t);
const num = s => parseFloat((String(s).match(/-?\d[\d,]*(\.\d+)?/) || ["NaN"])[0].replace(/,/g, ""));
const r = (v, d) => Math.round(v * 10 ** d) / 10 ** d;
const near = (a, b, d) => Math.abs(a - r(b, d)) < 0.5 * 10 ** -d + 1e-9;

/* ---------- independent calculation (deliberately written separately from the app) ---------- */
const pad = n => String(n).padStart(2, "0");
const now = new Date(), THIS_MONTH = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
const prevMonth = k => { const [y, m] = k.split("-").map(Number); return m === 1 ? `${y - 1}-12` : `${y}-${pad(m - 1)}`; };
function expected(charges, settings, year = "2026") {
  const sum = (l, f) => l.reduce((a, c) => a + f(c), 0), cost = c => c.cost ?? 0;
  const inMonth = k => charges.filter(c => c.date.startsWith(k));
  const byOdo = car => charges.filter(c => c.car === car && typeof c.odo === "number").sort((a, b) => a.odo - b.odo || a.date.localeCompare(b.date));
  const cars = settings.cars.map(c => c.id);
  let ek = 0, ed = 0, ec = 0; const since = {};
  for (const car of cars) { const w = byOdo(car); for (let i = 1; i < w.length; i++) { ek += w[i].kwh; ec += cost(w[i]); since[w[i].id] = w[i].odo - w[i - 1].odo; } if (w.length > 1) ed += w[w.length - 1].odo - w[0].odo; }
  const y = charges.filter(c => c.date.startsWith(year)); let yd = 0, ykd = 0;
  for (const c of y) if (since[c.id] >= 0) { yd += since[c.id]; ykd += c.kwh; }
  const work = {}; for (const c of y.filter(c => c.type === "work")) work[c.date.slice(0, 7)] = (work[c.date.slice(0, 7)] || 0) + cost(c);
  let paid = 0, owed = 0;
  for (const [k, v] of Object.entries(work)) { const amt = r(v, 2), cl = (settings.claimed || {})[k]; if (typeof cl === "number") { paid += Math.min(cl, amt); if (amt - cl > 0.004) owed += amt - cl; } else owed += amt; }
  const m = inMonth(THIS_MONTH);
  return {
    count: charges.length, monthCost: sum(m, cost), monthKwh: sum(m, c => c.kwh), monthN: m.length,
    avg: sum(charges, cost) / sum(charges, c => c.kwh), allCost: sum(charges, cost), eff: ek / ed * 100, per100: ec / ed * 100,
    yCost: sum(y, cost), yKwh: sum(y, c => c.kwh), yN: y.length, yDist: yd, yEff: ykd / yd * 100, paid, owed,
    months: Object.fromEntries(Array.from({ length: 12 }, (_, i) => `${year}-${pad(i + 1)}`).map(k => [k, { cost: sum(inMonth(k), cost), kwh: sum(inMonth(k), c => c.kwh), n: inMonth(k).length }])),
  };
}

/* ---------- reading the page ---------- */
const READ = `
  const t = s => [...document.querySelectorAll(s)].map(e => e.innerText.replace(/\\s+/g, " ").trim());
  const st = JSON.parse(localStorage.getItem("chargelog.v1"));
  return { stats: t("#stats .tile .val"), statSubs: t("#stats .tile .sub"), year: t("#yearSum b"), claims: t("#claimTop b"), sub: document.querySelector("#subline").textContent, data: st };`;

const demo = buildDemo(), server = await serve(demo.dir), page = await browser();
const files = mkdtempSync(join(tmpdir(), "chargelog-files-"));
const URL0 = server.url;
try {
  /* ---------- figures ---------- */
  section("Figures match an independent calculation");
  await page.viewport(1440, 900);
  await page.goto(URL0 + "?seed");
  let s = await page.eval(READ), e = expected(s.data.charges, s.data.settings);
  ok(page.errors.length === 0, "no errors while loading", page.errors.join(" | "));
  ok(num(s.sub) === e.count, `charge count (${e.count})`, s.sub);
  ok(near(num(s.stats[0]), e.monthCost, 2), `spent this month (${r(e.monthCost, 2)})`, s.stats[0]);
  ok(near(num(s.stats[1]), e.monthKwh, 0), `energy this month (${r(e.monthKwh, 0)} kWh)`, s.stats[1]);
  ok(near(num(s.stats[2]), e.avg, 3), `average price (${r(e.avg, 3)}/kWh)`, s.stats[2]);
  ok(near(num(s.statSubs[2]), e.allCost, 2), `spent all time (${r(e.allCost, 2)})`, s.statSubs[2]);
  ok(near(num(s.stats[3]), e.eff, 1), `efficiency all time (${r(e.eff, 1)} kWh/100 km)`, s.stats[3]);
  ok(near(num(s.statSubs[3]), e.per100, 2), `cost per 100 km (${r(e.per100, 2)})`, s.statSubs[3]);
  ok(near(num(s.year[0]), e.yCost, 2), `spent in 2026 (${r(e.yCost, 2)})`, s.year[0]);
  ok(near(num(s.year[1]), e.yKwh, 0), `energy in 2026 (${r(e.yKwh, 0)})`, s.year[1]);
  ok(num(s.year[2]) === e.yN, `charges in 2026 (${e.yN})`, s.year[2]);
  ok(num(s.year[3]) === e.yDist, `distance in 2026 (${e.yDist} km)`, s.year[3]);
  ok(near(num(s.year[4]), e.yEff, 1), `efficiency in 2026 (${r(e.yEff, 1)})`, s.year[4]);
  ok(near(num(s.claims[0]), e.paid, 2) && near(num(s.claims[1]), e.owed, 2), `work claims: claimed ${r(e.paid, 2)}, to claim ${r(e.owed, 2)}`, s.claims.join(" / "));

  section("Month pages match");
  let bad = [];
  for (let i = 0; i < 11; i++) {
    const k = `2026-${pad(i + 1)}`, x = e.months[k];
    const got = await page.eval(`document.querySelector('#chart .hit[data-i="${i}"]').dispatchEvent(new MouseEvent("click", { bubbles: true })); await new Promise(r => setTimeout(r, 120));
      const v = [...document.querySelectorAll("#mBody .m-tile b")].map(b => b.innerText); document.querySelector("#mClose").click(); return v;`);
    if (!near(num(got[0]), x.cost, 2) || !near(num(got[1]), x.kwh, 0) || num(got[4]) !== x.n) bad.push(`${k}: ${got[0]} ${got[1]} ${got[4]} vs ${r(x.cost, 2)} ${r(x.kwh, 0)} ${x.n}`);
  }
  ok(!bad.length, "spend, energy and charge count on every month page, Jan–Nov", bad.join("; "));

  /* ---------- add, edit, delete ---------- */
  section("Adding, editing and deleting charges");
  const before = e;
  const lastOdo = c => Math.max(...s.data.charges.filter(x => x.car === c).map(x => x.odo));
  await page.eval(`document.querySelector("#carBar [data-car=all]").click(); document.querySelector("#addBtn").click(); await new Promise(r => setTimeout(r, 100));
    document.querySelector('input[name="car"][value="hatch"]').click(); document.querySelector("#ty-public").click();
    const set = (s, v) => { const el = document.querySelector(s); el.value = v; el.dispatchEvent(new Event("input", { bubbles: true })); };
    set("#f-odo", "${lastOdo("hatch") + 150}"); set("#f-kwh", "30"); set("#f-cost", "12.34"); set("#f-loc", "Test charger");
    document.querySelector("#chargeForm").requestSubmit(); await new Promise(r => setTimeout(r, 200));`);
  s = await page.eval(READ); let e2 = expected(s.data.charges, s.data.settings);
  const added = s.data.charges.find(c => c.location === "Test charger");
  ok(added && e2.count === before.count + 1, "new charge saved once");
  ok(added && added.cost === 12.34 && added.kwh === 30 && added.car === "hatch" && added.type === "public", "saved with the values entered", JSON.stringify(added));
  ok(near(num(s.stats[0]), before.monthCost + 12.34, 2), "this month's spend went up by exactly 12.34", s.stats[0]);
  ok(near(num(s.stats[3]), e2.eff, 1), "efficiency recalculated", s.stats[3]);

  ok(await page.eval(`return !document.querySelector("#history").offsetWidth && !document.querySelector("#claimPanel").offsetWidth`), "dashboard omits history and claims"); await page.eval(`document.querySelector("a[href=\u0027#claims\u0027]").click()`); await page.sleep(200); ok(await page.eval(`return !!document.querySelector("#claimPanel").offsetWidth && !document.querySelector("#history").offsetWidth`), "claims has its own view"); await page.eval(`document.querySelector("a[href=\u0027#charges\u0027]").click()`); await page.sleep(200); ok(await page.eval(`return !!document.querySelector("#history").offsetWidth && !document.querySelector("#claimPanel").offsetWidth`), "history has its own view"); const beforeEdit = e2, old = s.data.charges.find(c => c.date.startsWith("2026-01"));
  await page.eval(`const row = document.querySelector('#list .row[data-id="${old.id}"]'); row.click(); await new Promise(r => setTimeout(r, 100));
    const el = document.querySelector("#f-kwh"); el.value = "${old.kwh + 10}"; el.dispatchEvent(new Event("input", { bubbles: true }));
    document.querySelector("#chargeForm").requestSubmit(); await new Promise(r => setTimeout(r, 200));`);
  s = await page.eval(READ); e2 = expected(s.data.charges, s.data.settings);
  const edited = s.data.charges.find(c => c.id === old.id);
  ok(edited && r(edited.kwh, 3) === r(old.kwh + 10, 3) && edited.createdAt === old.createdAt && edited.by === old.by && edited.cost === old.cost, "editing an old charge keeps its id, cost, author and creation time");
  ok(near(num(s.year[1]), beforeEdit.yKwh + 10, 0) && near(num(s.year[4]), e2.yEff, 1) && num(s.year[4]) !== r(beforeEdit.yEff, 1) || r(e2.yEff, 1) === r(beforeEdit.yEff, 1),
    "year energy (+10 kWh) and efficiency follow the edit", `${s.year[1]} ${s.year[4]}, expected ${r(beforeEdit.yKwh + 10, 0)} and ${r(e2.yEff, 1)}`);

  await page.eval(`document.querySelector('#list .row[data-id="${added.id}"]').click(); await new Promise(r => setTimeout(r, 100));
    document.querySelector("#delBtn").click(); await new Promise(r => setTimeout(r, 50)); document.querySelector("#delBtn").click(); await new Promise(r => setTimeout(r, 200));`);
  s = await page.eval(READ);
  ok(!s.data.charges.some(c => c.id === added.id) && s.data.charges.length === before.count, "deleting needs two taps and removes the charge");
  ok(near(num(s.stats[0]), before.monthCost, 2), "this month's spend back to where it was", s.stats[0]);

  /* ---------- typo checks ---------- */
  section("Typo checks");
  const typo = (odo, kwh, date = "") => page.eval(`document.querySelector("#addBtn").click(); await new Promise(r => setTimeout(r, 100));
    document.querySelector('input[name="car"][value="suv"]').click();
    const set = (s, v) => { const el = document.querySelector(s); el.value = v; el.dispatchEvent(new Event("input", { bubbles: true })); };
    ${date ? `set("#f-date", "${date}");` : ""} set("#f-odo", "${odo}"); set("#f-kwh", "${kwh}");
    const n = JSON.parse(localStorage.getItem("chargelog.v1")).charges.length;
    document.querySelector("#chargeForm").requestSubmit(); await new Promise(r => setTimeout(r, 150));
    const res = { msg: document.querySelector("#formErr").hidden ? "" : document.querySelector("#formErr").innerText, btn: document.querySelector("#saveBtn").textContent, saved: JSON.parse(localStorage.getItem("chargelog.v1")).charges.length !== n };
    document.querySelector("#chargeScrim [data-close]").click(); return res;`);
  const suvOdo = lastOdo("suv");
  let t1 = await typo(suvOdo - 5000, 40); ok(!t1.saved && /lower/.test(t1.msg) && t1.btn === "Save anyway", "odometer lower than before is stopped", t1.msg);
  t1 = await typo(suvOdo + 9000, 40); ok(!t1.saved && /since the last charge/.test(t1.msg), "odometer jump over 2,500 km is stopped", t1.msg);
  t1 = await typo(suvOdo + 200, 140); ok(!t1.saved && /full battery/.test(t1.msg), "more than 100 kWh is stopped", t1.msg);
  const fut = new Date(Date.now() + 3 * 864e5); t1 = await typo(suvOdo + 200, 40, `${fut.getFullYear()}-${pad(fut.getMonth() + 1)}-${pad(fut.getDate())}`);
  ok(!t1.saved && /future/.test(t1.msg), "a future date is stopped", t1.msg);

  /* ---------- backups ---------- */
  section("Backups");
  const backup = join(files, "backup.json"), extra = join(files, "backup-plus-two.json");
  const d0 = demoData();
  writeFileSync(backup, JSON.stringify({ app: "charge-log", version: 1, settings: d0.settings, charges: d0.charges }));
  writeFileSync(extra, JSON.stringify({ app: "charge-log", version: 1, settings: d0.settings, charges: [...d0.charges,
    { id: "extra1", date: "2026-11-02", type: "home", car: "hatch", kwh: 10, cost: 1.7, odo: null }, { id: "extra2", date: "2026-11-03", type: "home", car: "suv", kwh: 12, cost: 2.04, odo: null }] }));
  const load = async f => { await page.eval(`document.querySelector("#settingsBtn").click();`); await page.setFiles("#importFile", [f]); await page.sleep(400); return page.eval(`return { n: JSON.parse(localStorage.getItem("chargelog.v1")).charges.length, toast: document.querySelector("#toast").textContent };`); };
  await page.goto(URL0 + "?seed");
  let b1 = await load(backup); ok(b1.n === d0.charges.length, "loading a backup of the same charges adds nothing", `${b1.n} charges, "${b1.toast}"`);
  b1 = await load(backup); ok(b1.n === d0.charges.length, "loading it a second time still adds nothing", `${b1.n}`);
  b1 = await load(extra); ok(b1.n === d0.charges.length + 2 && /2 new/.test(b1.toast), "a backup with two new charges adds exactly two", `${b1.n}, "${b1.toast}"`);

  /* ---------- settings ---------- */
  section("Settings");
  await page.goto(URL0 + "?seed");
  const sv = await page.eval(`const a = localStorage.getItem("chargelog.v1"); document.querySelector("#settingsBtn").click(); await new Promise(r => setTimeout(r, 100));
    document.querySelector("#setForm").requestSubmit(); await new Promise(r => setTimeout(r, 200));
    const A = JSON.parse(a).settings, B = JSON.parse(localStorage.getItem("chargelog.v1")).settings;
    const keys = [...new Set([...Object.keys(A), ...Object.keys(B)])]; return keys.filter(k => JSON.stringify(A[k]) !== JSON.stringify(B[k]));`);
  ok(sv.length === 0, "saving Settings without changes changes nothing", sv.join(", "));

  const rateCorrection = await page.eval(`document.querySelector("#addBtn").click();
    document.querySelector("#ty-home").click();
    document.querySelector("#f-date").value = "2026-11-15";
    document.querySelector("#f-kwh").value = "52.7";
    const cost = document.querySelector("#f-cost");
    cost.dispatchEvent(new Event("input"));
    const automatic = cost.readOnly && document.querySelector("#preview").textContent.includes("8.96");
    document.querySelector("#overrideCost").click();
    cost.value = "4.93"; cost.dispatchEvent(new Event("input"));
    const button = document.querySelector("#useHomeRate");
    const mismatch = !button.hidden && button.textContent.includes("8.96") && document.querySelector("#preview").textContent.includes("Effective €0.094/kWh") && document.querySelector("#preview").textContent.includes("Home rate €0.170/kWh");
    button.click();
    const corrected = button.hidden && document.querySelector("#preview").textContent.includes("8.96");
    document.querySelector("#chargeScrim [data-close]").click();
    return automatic && mismatch && corrected && cost.readOnly;`);
  ok(rateCorrection, "52.7 kWh can be repriced from 4.93 to 8.96 using the dated home tariff");
  const homeTotals = await page.eval(`const totals = [];
    for (const manual of [null,"4.93","0"]) {
      document.querySelector("#addBtn").click();
      document.querySelector("#ty-home").click();
      document.querySelector("#f-date").value = "2026-11-15";
      const energy = document.querySelector("#f-kwh");
      energy.value = "52.7"; energy.dispatchEvent(new Event("input"));
      if (manual !== null) {
        document.querySelector("#overrideCost").click();
        document.querySelector("#f-cost").value = manual;
      }
      document.querySelector("#f-loc").value = "Home pricing check " + manual;
      document.querySelector("#chargeForm").requestSubmit();
      await new Promise(r => setTimeout(r,100));
      const entries = JSON.parse(localStorage.getItem("chargelog.v1")).charges;
      totals.push(entries.find(c => c.location === "Home pricing check " + manual)?.cost);
    }
    return totals;`);
  ok(JSON.stringify(homeTotals) === "[8.96,4.93,0]", "saved home charges use the dated tariff unless an explicit total or zero is entered");
  const paletteCheck = await page.eval(`document.querySelector("#settingsBtn").click();
    const read = () => getComputedStyle(document.querySelector(".chart-panel")).backgroundColor;
    const categories = () => ["home","public","fast","work"].map(c => getComputedStyle(document.querySelector(".bg-"+c) || document.documentElement).getPropertyValue("--"+c)).join("|");
    const before = categories(), colours = new Set();
    for (const input of document.querySelectorAll('[name="palette"]')) {
      input.click(); colours.add(read());
      if (categories() !== before) return false;
    }
    document.querySelector("#setScrim [data-close]").click();
    return colours.size === 18 && document.documentElement.dataset.palette === "plum";`);
  ok(paletteCheck, "18 distinct surface palettes preserve charging colours and cancel restores the original");
  await page.eval(`document.querySelector("#settingsBtn").click(); document.querySelector('[value="cocoa"]').click(); document.querySelector("#setForm").requestSubmit();`);
  await page.goto(URL0);
  ok(await page.eval(`return document.documentElement.dataset.palette === "cocoa"`), "saved device palette survives reload");

  /* ---------- layouts ---------- */
  section("Layouts: nothing cut off or overlapping");
  const WIDTHS = [[320, 640], [360, 760], [375, 812], [390, 844], [414, 896], [430, 932], [768, 1024], [1024, 768], [1280, 800], [1440, 900], [1920, 1080]];
  const CUT = `const cut = sel => [...document.querySelectorAll(sel)].filter(e => e.offsetParent && e.scrollWidth > e.clientWidth + 1).map(e => e.innerText.trim().slice(0, 30));`;
  for (const [w, h] of WIDTHS) {
    await page.viewport(w, h, 1, w < 768);
    await page.goto(URL0 + "?seed", 900);
    const L = await page.eval(`${CUT}
      const res = { overflow: document.documentElement.scrollWidth > innerWidth + 1, cut: cut("#stats .tile .val, #yearSum b, #claimTop b, .carbar button, .seg-mini button, .chip, .leg b, .claim .ca") };
      document.querySelector("#addBtn").click(); await new Promise(r => setTimeout(r, 300));
      const R = s => document.querySelector(s).getBoundingClientRect(), hit = (a, b) => a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1;
      const f = ["#f-date", "#f-odo", "#f-kwh", "#f-cost"].map(R), sheet = R("#chargeForm");
      res.formOverlap = hit(f[0], f[1]) || hit(f[2], f[3]) || hit(f[0], f[2]) || f.some(r => r.right > sheet.right + 1 || r.left < sheet.left - 1);
      res.formOverflow = document.querySelector("#chargeForm").scrollWidth > document.querySelector("#chargeForm").clientWidth + 1;
      document.querySelector("#chargeScrim [data-close]").click();
      document.querySelector('#chart .hit[data-i="6"]').dispatchEvent(new MouseEvent("click", { bubbles: true })); await new Promise(r => setTimeout(r, 300));
      const ms = document.querySelector(".month-sheet"); res.monthOverflow = ms.scrollWidth > ms.clientWidth + 1; res.monthCut = cut("#mBody .m-tile b, #mBody .m-row b");
      document.querySelector("#mClose").click(); return res;`);
    const probs = [L.overflow && "page wider than screen", L.cut.length && "cut off: " + L.cut.join(", "), L.formOverlap && "form fields overlap", L.formOverflow && "form wider than sheet", L.monthOverflow && "month page wider than sheet", L.monthCut.length && "month page cut off: " + L.monthCut.join(", ")].filter(Boolean);
    ok(!probs.length, `${w}×${h}`, probs.join("; "));
  }
  section("Cloud startup");
  writeFileSync(join(demo.dir,"config.js"),"window.CHARGE_LOG_FIREBASE = {};");
  writeFileSync(join(demo.dir,"cloud.js"),"window.dispatchEvent(new Event('cloud-failed'));");
  const isolated = await serve(demo.dir);
  try {
    await page.goto(isolated.url);
    ok(await page.eval(`return document.body.classList.contains("awaiting-list") && document.querySelector("#addBtn").hidden && document.querySelector("#syncTxt").textContent === "Sync stopped"`), "sync failure keeps the cloud account out of local-only mode");
    const states = await page.eval(`window.Cloud = {subscribe(charges){window.sendCharges=charges;return ()=>{};}};
      dispatchEvent(new CustomEvent("cloud-auth",{detail:{uid:"demo",email:"demo@example.test"}}));
      sendCharges([],{fromCache:true}); const waiting=document.body.classList.contains("awaiting-list") && document.querySelector("#addBtn").hidden;
      sendCharges([],{fromCache:false}); return [waiting,!document.body.classList.contains("awaiting-list") && !document.querySelector("#addBtn").hidden];`);
    ok(states.every(Boolean), "initial empty cache waits for server confirmation before showing an empty account");
  } finally { isolated.close(); }
  section("Errors");
  ok(page.errors.length === 0, "no JavaScript errors during the whole run", page.errors.slice(0, 3).join(" | "));
} catch (err) {
  fail++; console.log("\n✗ The test run stopped: " + err.message);
} finally {
  page.close(); server.close(); demo.cleanup(); rmSync(files, { recursive: true, force: true });
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
