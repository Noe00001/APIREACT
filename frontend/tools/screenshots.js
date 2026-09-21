const puppeteer = require('puppeteer');
const fs = require('fs');
const paths = ['/', '/login', '/register', '/recover'];
const outDir = 'screenshots';

(async () => {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // wait for local dev server to be ready
  const base = 'http://localhost:3000';

  for (const p of paths) {
    try {
      await page.setViewport({ width: 1280, height: 800 });
      await page.goto(base + p, { waitUntil: 'networkidle2', timeout: 30000 });
      // if on /login, try opening modal
      if (p === '/login') {
        // try click Registrar button
        try {
          await page.waitForSelector('button', { timeout: 2000 });
          await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const c = btns.find(b => /crear cuenta/i.test(b.innerText) || /crear cuenta/i.test(b.textContent));
            if (c) c.click();
          });
          await page.waitForTimeout(600);
        } catch (err) {
          // ignore
        }
      }
      const name = p === '/' ? 'home' : p.replace('/', '') || 'home';
      const file = `${outDir}/${name}-desktop.png`;
      await page.screenshot({ path: file, fullPage: true });

      // mobile
      await page.setViewport({ width: 375, height: 812, isMobile: true });
      await page.goto(base + p, { waitUntil: 'networkidle2', timeout: 30000 });
      if (p === '/login') {
        try {
          await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const c = btns.find(b => /crear cuenta/i.test(b.innerText) || /crear cuenta/i.test(b.textContent));
            if (c) c.click();
          });
          await page.waitForTimeout(600);
        } catch (err) {}
      }
      const fileMobile = `${outDir}/${name}-mobile.png`;
      await page.screenshot({ path: fileMobile, fullPage: true });

      console.log('Captured', file, fileMobile);
    } catch (err) {
      console.error('Failed capturing', p, err.message);
    }
  }

  await browser.close();
})();
