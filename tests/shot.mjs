import { pathToFileURL, fileURLToPath } from "node:url";
import { join, dirname } from "node:path";
import { launch } from "./cdp.mjs";
const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "out-oct15");
const c = await launch({ width: 1280, height: 1240, port: 9479 });
try {
  await c.goto(pathToFileURL(join(OUT, "reset-day-arcade.html")).href, 1500);
  const h = await c.ev("Math.ceil(document.documentElement.scrollHeight)");
  await c.send("Emulation.setDeviceMetricsOverride", { width: 1280, height: h, deviceScaleFactor: 1, mobile: false });
  await c.sleep(600);
  await c.shot(join(OUT, "reset-day-arcade-00-best.png"));
  console.log("shot h=" + h, c.errors.length ? c.errors : "no errors");
} finally { await c.close(); }
