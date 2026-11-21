// Remakes the README screenshots from a demo copy with invented data (never the real database):
//   node tools/screenshots.mjs            all of them
//   node tools/screenshots.mjs phone-log  just the ones named
import { join } from "node:path";
import { ROOT, buildDemo, serve, browser } from "./lib.mjs";

const PHONE = [390, 844, 3, true], DESK = [1440, 900, 2, false];
const click = (sel, i) => `document.querySelector('#chart .hit[data-i="${i}"]').dispatchEvent(new MouseEvent("click", { bubbles: true })); await new Promise(r => setTimeout(r, 400)); document.activeElement.blur();`;
const scrollTo = sel => `const p = document.querySelector("${sel}"); scrollTo(0, p.getBoundingClientRect().top + scrollY - 12);`;
const SHOTS = {
  "phone-home": [PHONE, ""],
  "phone-chart": [PHONE, "", scrollTo(".chart-panel")],
  "phone-claims": [PHONE, "", scrollTo("#claimPanel")],
  "phone-log": [PHONE, "", `document.querySelector("#addBtn").click(); await new Promise(r => setTimeout(r, 100));
    document.querySelector('input[name="car"][value="suv"]').click(); document.querySelector("#ty-home").click();
    const set = (s, v) => { const el = document.querySelector(s); el.value = v; el.dispatchEvent(new Event("input", { bubbles: true })); };
    const last = Number(document.querySelector("#f-odo").placeholder.replace(/[^\\d]/g, "")); set("#f-odo", String(last + 284)); set("#f-kwh", "46.8");
    document.activeElement.blur(); await new Promise(r => setTimeout(r, 400));`],
  "phone-month": [PHONE, "", click("", 6)],
  "phone-list": [PHONE, "", scrollTo("#logTitle")],
  "phone-light": [PHONE, "theme=light"],
  "desktop-dark": [DESK, ""],
  "desktop-light": [DESK, "theme=light"],
  "desktop-hover": [DESK, "", `await new Promise(r => setTimeout(r, 600)); document.querySelector('#chart .hit[data-i="6"]').dispatchEvent(new PointerEvent("pointermove", { bubbles: true, pointerType: "mouse" }));`],
  "desktop-month": [DESK, "", click("", 6)],
  "desktop-share": [DESK, "style=share", `document.querySelector("#m-kwh").click();`],
  "desktop-efficiency": [DESK, "", `document.querySelector("#m-eff").click();`],
  "desktop-settings": [DESK, "", `document.querySelector("#settingsBtn").click(); await new Promise(r => setTimeout(r, 300)); document.activeElement.blur();`],
};

const only = process.argv.slice(2);
const demo = buildDemo(), server = await serve(demo.dir), page = await browser();
try {
  for (const [name, [vp, query, action]] of Object.entries(SHOTS)) {
    if (only.length && !only.includes(name)) continue;
    await page.viewport(...vp);
    await page.goto(server.url + "?seed&" + query, 1500);
    if (action) await page.eval(action);
    await page.sleep(900);
    await page.screenshot(join(ROOT, "screenshots", name + ".png"));
    console.log("saved screenshots/" + name + ".png");
  }
} finally { page.close(); server.close(); demo.cleanup(); }
