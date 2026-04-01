import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'temporary screenshots', 'pricing-frames');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });

const html = `<!DOCTYPE html><html><body style="margin:0;background:#000;">
<video id="v" src="http://localhost:3000/pricing_section_preview.mp4" style="width:1440px;" muted></video>
</body></html>`;
await page.setContent(html, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => document.getElementById('v').readyState >= 1, { timeout: 15000 });

const duration = await page.evaluate(() => document.getElementById('v').duration);
console.log('Duration:', duration);

const times = [0.5, 1.5, 3, 5, 7, 9, 11, 13];
for (let i = 0; i < times.length; i++) {
  const t = Math.min(times[i], duration - 0.1);
  await page.evaluate((time) => { document.getElementById('v').currentTime = time; }, t);
  await new Promise(r => setTimeout(r, 700));
  const fp = path.join(outDir, `frame-${String(i+1).padStart(2,'0')}.png`);
  await page.screenshot({ path: fp });
  console.log('Saved frame', i+1, 'at', t.toFixed(1), 's');
}

await browser.close();
