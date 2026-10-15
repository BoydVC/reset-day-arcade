import { pathToFileURL, fileURLToPath } from "node:url";
import { join, dirname } from "node:path";
import { launch, sleep } from "./cdp.mjs";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "..", "out-oct15");
const targets = [
  ["file", pathToFileURL(join(OUT, "reset-day-arcade.html")).href],
  ["http", "http://127.0.0.1:4358/"],
];
const shotOnly = process.argv.includes("--shot");
let fail = 0;
const c = await launch({ width: 1280, height: 860, port: 9478 });
try {
  // standalone escape room check
  c.errors.length = 0;
  await c.goto(pathToFileURL(join(OUT, "escape-room.html")).href, 1200);
  const er = await c.ev("({title:document.title, text:document.body.innerText.length, btns:document.querySelectorAll('button').length})");
  console.log("escape-room.html standalone:", JSON.stringify(er), "errors:", c.errors.length ? c.errors : "none");
  if (er.text < 50 || c.errors.length) fail++;

  for (const [label, url] of targets) {
    c.errors.length = 0; c.requests.length = 0;
    await c.goto(url, 1200);
    const cards = await c.ev("document.querySelectorAll('.card').length");
    const imgs = await c.ev("[...document.querySelectorAll('.shot')].filter(s=>s.style.backgroundImage.includes('data:image')).length");
    console.log(`[${label}] cards=${cards} thumbs=${imgs} launcher errors:`, c.errors.length ? c.errors : "none");
    if (cards !== 6 || imgs !== 6 || c.errors.length) fail++;
    if (label === "file") await c.shot(join(OUT, "reset-day-arcade-00-best.png"));
    if (shotOnly) continue;
    const ids = await c.ev("window.__ARCADE__.games");
    for (const id of ids) {
      c.errors.length = 0;
      await c.ev(`document.querySelector('.card[data-id="${id}"]').click(), true`);
      await sleep(2500);
      const r = await c.ev(`(() => { const f = document.getElementById('frame'); const d = f.contentDocument;
        if (!d) return {err:'no contentDocument'};
        return { src: f.src.slice(0,5), title: d.title, text: (d.body && d.body.innerText.length) || 0,
          els: d.querySelectorAll('*').length, canvas: d.querySelectorAll('canvas').length,
          visible: f.getBoundingClientRect().height }; })()`);
      if (label === "file") await c.shot(join(ROOT, "screenshots", `launch-${id}.png`));
      const ok = r && !r.err && r.els > 20 && (r.text > 20 || r.canvas > 0) && r.visible > 300 && c.errors.length === 0;
      if (!ok) fail++;
      console.log(`[${label}] ${ok ? "OK  " : "FAIL"} ${id}: ${JSON.stringify(r)}`, c.errors.length ? "errors: " + c.errors.join(" | ") : "");
      await c.ev("document.getElementById('pclose').click(), true");
      await sleep(300);
    }
    console.log(`[${label}] external requests:`, c.requests.filter(u => !u.startsWith("http://127.0.0.1:4358")).length ? c.requests : "none");
  }
} finally { await c.close(); }
console.log(fail ? `FAILURES: ${fail}` : "ALL CHECKS PASSED");
process.exit(fail ? 1 : 0);
