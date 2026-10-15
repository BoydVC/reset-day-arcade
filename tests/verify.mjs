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
    const badges = await c.ev("[...document.querySelectorAll('.card')].filter(b=>b.querySelector('.newb')).map(b=>b.dataset.id).join(',')");
    const hud = await c.ev("document.querySelector('.hud').innerText + ' | ' + document.querySelector('.marquee p').innerText");
    console.log(`[${label}] cards=${cards} thumbs=${imgs} badges=${badges} hud="${hud}" launcher errors:`, c.errors.length ? c.errors : "none");
    if (cards !== 8 || imgs !== 8 || badges !== "pumpkin-carver,bridge-penalties" || c.errors.length) fail++;
    // keyboard launch check: keys 1-8 each open the matching game
    const ids0 = await c.ev("window.__ARCADE__.games");
    let keyOk = 0;
    for (let k = 1; k <= 8; k++) {
      await c.send("Input.dispatchKeyEvent", { type: "keyDown", key: String(k), code: "Digit" + k, text: String(k) });
      await c.send("Input.dispatchKeyEvent", { type: "keyUp", key: String(k), code: "Digit" + k });
      await sleep(250);
      const cur = await c.ev("window.__ARCADE__.current()");
      if (cur === ids0[k - 1]) keyOk++; else console.log(`[${label}] key ${k} opened ${cur}, expected ${ids0[k - 1]}`);
      await c.ev("document.getElementById('pclose').click(), true");
      await sleep(150);
    }
    console.log(`[${label}] keys 1-8: ${keyOk}/8 opened the right game`);
    if (keyOk !== 8) fail++;
    c.errors.length = 0;
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
          visible: f.getBoundingClientRect().height, painted: (() => {
            const cs = [...d.querySelectorAll('canvas')].sort((a,b)=>b.width*b.height-a.width*a.height)[0];
            if (!cs || !cs.width) return 0;
            try { const x = cs.getContext('2d'); if (!x) return -1;
              const px = x.getImageData(0,0,cs.width,cs.height).data; const seen = new Set();
              for (let i=0;i<px.length;i+=4*97) seen.add((px[i]>>4)+','+(px[i+1]>>4)+','+(px[i+2]>>4));
              return seen.size; } catch (e) { return -2; } })() }; })()`);
      if (label === "file") await c.shot(join(ROOT, "screenshots", `launch-${id}.png`));
      // DOM games need real content; canvas-only games (e.g. Bridge Penalties) need a painted canvas (>20 distinct colors)
      const ok = r && !r.err && r.visible > 300 && c.errors.length === 0 &&
        ((r.els > 20 && (r.text > 20 || r.canvas > 0)) || (r.canvas > 0 && r.painted > 20));
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
