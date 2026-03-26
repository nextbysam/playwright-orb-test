const http = require("http");

const server = http.createServer((req, res) => {
  res.setHeader("Content-Type", "application/json");
  if (req.url === "/health") {
    res.end(JSON.stringify({ status: "ok", pid: process.pid }));
  } else if (req.url === "/launch-chrome") {
    // Try launching Chrome on demand instead of at startup
    const { chromium } = require("playwright");
    chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"]
    }).then(async browser => {
      const page = await browser.newPage();
      await page.goto("https://example.com");
      const title = await page.title();
      const buf = await page.screenshot({ type: "jpeg" });
      await browser.close();
      res.end(JSON.stringify({ title, screenshot_bytes: buf.length }));
    }).catch(err => {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: err.message }));
    });
  } else {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: "not found" }));
  }
});

server.listen(3000, "0.0.0.0", () => console.log("Listening :3000"));
