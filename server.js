const http = require("http");
process.env.PLAYWRIGHT_BROWSERS_PATH = "/opt/browsers";
const { chromium } = require("playwright");

let browser, page;

async function init() {
  browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"]
  });
  page = await (await browser.newContext()).newPage();
  await page.goto("https://www.google.com");
  console.log("Browser ready, on Google");
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  res.setHeader("Content-Type", "application/json");
  try {
    if (url.pathname === "/health") {
      res.end(JSON.stringify({ status: "ok", hasBrowser: !!browser }));
    } else if (url.pathname === "/navigate") {
      const target = url.searchParams.get("url") || "https://example.com";
      await page.goto(target, { waitUntil: "domcontentloaded", timeout: 15000 });
      res.end(JSON.stringify({ title: await page.title(), cookies: (await page.context().cookies()).length }));
    } else if (url.pathname === "/screenshot") {
      const buf = await page.screenshot({ type: "jpeg", quality: 80 });
      res.setHeader("Content-Type", "image/jpeg");
      res.end(buf);
    } else if (url.pathname === "/cookies") {
      res.end(JSON.stringify({ cookies: await page.context().cookies() }));
    } else {
      res.statusCode = 404;
      res.end(JSON.stringify({ error: "not found" }));
    }
  } catch (e) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: e.message }));
  }
});

init().then(() => {
  server.listen(3000, "0.0.0.0", () => console.log("Listening :3000"));
}).catch(e => { console.error(e); process.exit(1); });
