import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const url   = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || '';

const dir = path.join(__dirname, 'temporary screenshots');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

// Auto-increment
const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'));
const nums  = files.map(f => parseInt(f.match(/screenshot-(\d+)/)?.[1] ?? '0')).filter(n => !isNaN(n));
const next  = (nums.length ? Math.max(...nums) : 0) + 1;
const name  = label ? `screenshot-${next}-${label}.png` : `screenshot-${next}.png`;
const dest  = path.join(dir, name);

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const page    = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

// Scroll through the page slowly to trigger IntersectionObserver animations
await page.evaluate(async () => {
  await new Promise(resolve => {
    const totalHeight = document.body.scrollHeight;
    const step = 400;
    let pos = 0;
    const interval = setInterval(() => {
      window.scrollTo(0, pos);
      pos += step;
      if (pos >= totalHeight) {
        clearInterval(interval);
        // Stay at bottom briefly, then scroll back to top
        setTimeout(() => {
          window.scrollTo(0, 0);
          setTimeout(resolve, 600);
        }, 500);
      }
    }, 150);
  });
});

await new Promise(r => setTimeout(r, 1000));
await page.screenshot({ path: dest, fullPage: true });
await browser.close();

console.log(`Saved: ${dest}`);
