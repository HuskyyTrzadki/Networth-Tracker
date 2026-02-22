import { chromium } from "@playwright/test";
import fs from "node:fs/promises";

const url =
  process.argv[2] ??
  "https://pl.tradingview.com/symbols/GPW-PKN/financials-overview/";
const needles = [
  /Switzerland/i,
  /Germany/i,
  /Szwajcaria/i,
  /Niemcy/i,
  /18\\.72B/i,
  /\\b187\\b/,
];
const hits = [];
const allRequests = [];
const websockets = [];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

page.on("websocket", (ws) => {
  const wsItem = {
    url: ws.url(),
    framesSent: 0,
    framesReceived: 0,
    sampleSent: [],
    sampleReceived: [],
    closed: false,
  };
  websockets.push(wsItem);

  ws.on("framesent", (event) => {
    wsItem.framesSent += 1;
    if (wsItem.sampleSent.length < 8) {
      wsItem.sampleSent.push(String(event.payload).slice(0, 1200));
    }
  });
  ws.on("framereceived", (event) => {
    wsItem.framesReceived += 1;
    if (wsItem.sampleReceived.length < 5) {
      wsItem.sampleReceived.push(String(event.payload).slice(0, 12000));
    }
  });
  ws.on("close", () => {
    wsItem.closed = true;
  });
});

context.on("response", async (res) => {
  const req = res.request();
  const type = req.resourceType();

  const u = res.url();
  let body = "";
  try {
    const ct = res.headers()["content-type"] || "";
    if (ct.includes("json") || ct.includes("text") || ct.includes("javascript")) {
      body = await res.text();
    }
  } catch {}

  allRequests.push({
    status: res.status(),
    method: req.method(),
    type,
    url: u,
    postData: req.postData() || null,
    contentType: res.headers()["content-type"] || "",
    sample: body.slice(0, 600),
  });

  const match =
    needles.some((re) => re.test(u)) || needles.some((re) => re.test(body));

  if (match) {
    hits.push({
      status: res.status(),
      method: req.method(),
      url: u,
      postData: req.postData() || null,
      sample: body.slice(0, 2000),
    });
    console.log(`HIT ${res.status()} ${u}`);
  }
});

await page.goto(url, { waitUntil: "networkidle" });

for (let i = 0; i < 8; i += 1) {
  await page.evaluate((step) => {
    const h = document.body.scrollHeight;
    window.scrollTo(0, (h * (step + 1)) / 8);
  }, i);
  await page.waitForTimeout(1000);
}

const chartTabs = ["By country", "By source", "Wg kraju", "Wg źródła"];
for (const tab of chartTabs) {
  const locator = page.getByText(tab, { exact: false }).first();
  if ((await locator.count()) > 0) {
    try {
      await locator.click({ timeout: 1500 });
      await page.waitForTimeout(1500);
    } catch {}
  }
}

await page.waitForTimeout(4000);

const finalHtml = await page.content();
const htmlNeedleMatches = needles.filter((re) => re.test(finalHtml)).map(String);

await fs.writeFile("tv-network-hits.json", JSON.stringify(hits, null, 2));
await fs.writeFile("tv-network-all.json", JSON.stringify(allRequests, null, 2));
await fs.writeFile("tv-websockets.json", JSON.stringify(websockets, null, 2));
await fs.writeFile("tv-page-content.html", finalHtml);
await fs.writeFile(
  "tv-html-needle-matches.json",
  JSON.stringify(htmlNeedleMatches, null, 2),
);
await browser.close();

console.log(`URL: ${url}`);
console.log(`Saved ${hits.length} matching requests to tv-network-hits.json`);
console.log(`Saved ${allRequests.length} requests to tv-network-all.json`);
console.log(`Saved ${websockets.length} websockets to tv-websockets.json`);
console.log(
  `Needle matches in final HTML: ${
    htmlNeedleMatches.length ? htmlNeedleMatches.join(", ") : "none"
  }`,
);
