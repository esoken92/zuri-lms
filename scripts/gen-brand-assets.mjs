// Generates PNG/ICO brand assets from the SVG logo + an OG share card.
// Usage: node scripts/gen-brand-assets.mjs   (requires puppeteer-core + Chrome)
import puppeteer from "puppeteer-core";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const CHROME =
  process.env.CHROME_PATH ??
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const ICON_SVG = readFileSync("src/app/icon.svg", "utf8");

const OG_HTML = `<!doctype html><html><body style="margin:0">
<div style="width:1200px;height:630px;background:#faf7f3;display:flex;flex-direction:column;justify-content:space-between;padding:72px;font-family:'Segoe UI',system-ui,sans-serif;box-sizing:border-box">
  <div style="display:flex;align-items:center;gap:20px">
    ${ICON_SVG.replace("<svg", '<svg width="88" height="88"')}
    <span style="font-size:34px;font-weight:700;color:#332617;letter-spacing:-0.5px">Zuri LMS</span>
  </div>
  <div>
    <div style="font-size:15px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#88480d;margin-bottom:16px">Logistics management · community edition</div>
    <div style="font-size:58px;font-weight:700;line-height:1.1;letter-spacing:-1.5px;color:#332617;max-width:900px">Tyre &amp; fleet operations for the small yard.</div>
    <div style="font-size:22px;color:#543818;margin-top:20px;max-width:780px;line-height:1.45">Self-hosted inspections, scrap tracking and reports — free to run for a small fleet. MIT licensed.</div>
  </div>
  <div style="display:flex;justify-content:space-between;font-size:17px;color:#98744d;font-weight:600">
    <span>github.com/esoken92/zuri-lms</span><span>MIT · no telemetry · self-hosted</span>
  </div>
</div></body></html>`;

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "shell",
});

async function rasterizeSvg(svg, size) {
  // Canvas-produced PNGs are RGBA — required for the ICO wrapper.
  const page = await browser.newPage();
  const dataUrl =
    "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64");
  const b64 = await page.evaluate(
    async (src, s) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const c = document.createElement("canvas");
      c.width = s;
      c.height = s;
      c.getContext("2d").drawImage(img, 0, 0, s, s);
      return c.toDataURL("image/png");
    },
    dataUrl,
    size,
  );
  return Buffer.from(b64.split(",")[1], "base64");
}

function pngToIco(png, size) {
  // ICO container: 6-byte ICONDIR + 16-byte ICONDIRENTRY + PNG payload
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  const entry = Buffer.alloc(16);
  entry.writeUInt8(size === 256 ? 0 : size, 0);
  entry.writeUInt8(size === 256 ? 0 : size, 1);
  entry.writeUInt8(0, 2);
  entry.writeUInt8(0, 3);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(22, 12);
  return Buffer.concat([header, entry, png]);
}

mkdirSync("src/app", { recursive: true });
mkdirSync("public/icons", { recursive: true });

const icon32 = await rasterizeSvg(ICON_SVG, 32);
writeFileSync("src/app/favicon.ico", pngToIco(icon32, 32));

const apple = await rasterizeSvg(ICON_SVG, 180);
writeFileSync("src/app/apple-icon.png", apple);

const icon192 = await rasterizeSvg(ICON_SVG, 192);
writeFileSync("public/icons/icon-192x192.png", icon192);
const icon512 = await rasterizeSvg(ICON_SVG, 512);
writeFileSync("public/icons/icon-512x512.png", icon512);

const og = await browser.newPage();
await og.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
await og.setContent(OG_HTML);
writeFileSync("src/app/opengraph-image.png", await og.screenshot({ type: "png" }));

await browser.close();
console.log("Wrote favicon.ico, apple-icon.png, opengraph-image.png, icons/{192,512}.png");
