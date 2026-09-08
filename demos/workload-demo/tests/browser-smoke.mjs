import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const homepageInitialLoadBudget = 2 * 1024 * 1024;
const missingRequests = new Set();
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mp4": "video/mp4",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".zip": "application/zip",
};

const server = createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    const relativePath = decodeURIComponent(requestUrl.pathname).replace(/^\/+/, "") || "index.html";
    let filePath = path.resolve(root, relativePath);
    if (!filePath.startsWith(root + path.sep)) throw new Error("path escapes portfolio root");
    if ((await stat(filePath)).isDirectory()) filePath = path.join(filePath, "index.html");
    const body = await readFile(filePath);
    response.writeHead(200, { "content-type": mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream" });
    response.end(body);
  } catch {
    if (request.url === "/favicon.ico") {
      response.writeHead(204);
      response.end();
      return;
    }
    missingRequests.add(request.url || "/");
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
});

await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", resolve);
});

const serverAddress = server.address();
assert.ok(serverAddress && typeof serverAddress === "object");
const siteOrigin = `http://127.0.0.1:${serverAddress.port}`;
const chromeCandidates = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter(Boolean);
const chromePath = chromeCandidates.find(existsSync);
assert.ok(chromePath, "Chrome/Chromium was not found; set CHROME_PATH to run browser tests");

const profileDir = await mkdtemp(path.join(tmpdir(), "portfolio-browser-smoke-"));
const chrome = spawn(chromePath, [
  "--headless=new",
  "--disable-background-networking",
  "--disable-default-apps",
  "--disable-extensions",
  "--disable-gpu",
  "--disable-sync",
  "--metrics-recording-only",
  "--no-default-browser-check",
  "--no-first-run",
  "--no-sandbox",
  "--remote-debugging-address=127.0.0.1",
  "--remote-debugging-port=0",
  `--user-data-dir=${profileDir}`,
  "about:blank",
], { stdio: "ignore" });

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
async function waitFor(readValue, message, timeout = 15000) {
  const deadline = Date.now() + timeout;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const value = await readValue();
      if (value) return value;
    } catch (error) {
      lastError = error;
    }
    await delay(50);
  }
  throw new Error(`${message}${lastError ? `: ${lastError.message}` : ""}`);
}

let socket;
const pending = new Map();
const errors = [];
let sequence = 0;

function send(method, params = {}) {
  const id = ++sequence;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

async function evaluate(expression) {
  const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
}

async function openPage(pathname, selector) {
  errors.length = 0;
  missingRequests.clear();
  await send("Page.navigate", { url: `${siteOrigin}${pathname}` });
  await waitFor(
    () => evaluate(`document.readyState === "complete" && Boolean(document.querySelector(${JSON.stringify(selector)}))`),
    `${pathname} did not finish loading`,
  );
  await delay(250);
  assert.deepEqual(errors, [], `${pathname} logged browser errors`);
  assert.deepEqual([...missingRequests], [], `${pathname} requested missing local files`);
}

try {
  const devToolsPortFile = path.join(profileDir, "DevToolsActivePort");
  const devToolsPort = await waitFor(async () => {
    const contents = await readFile(devToolsPortFile, "utf8");
    return Number.parseInt(contents.split(/\r?\n/)[0], 10) || 0;
  }, "Chrome did not expose a DevTools port");

  const target = await waitFor(async () => {
    const response = await fetch(`http://127.0.0.1:${devToolsPort}/json/list`);
    const list = await response.json();
    return list.find((item) => item.type === "page");
  }, "Chrome did not create a page target");

  socket = new WebSocket(target.webSocketDebuggerUrl);
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.method === "Runtime.exceptionThrown") {
      const details = message.params.exceptionDetails;
      errors.push(details.exception?.description || `${details.text} (${details.url}:${details.lineNumber})`);
    }
    if (message.method === "Log.entryAdded" && message.params.entry.level === "error") {
      const entry = message.params.entry;
      if (!entry.url?.endsWith("/favicon.ico")) errors.push(`${entry.text}${entry.url ? ` (${entry.url})` : ""}`);
    }
    if (!message.id) return;
    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);
    if (message.error) request.reject(new Error(message.error.message));
    else request.resolve(message.result);
  });
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  await send("Runtime.enable");
  await send("Log.enable");
  await send("Page.enable");

  const pages = [
    ["/index.html", ".prototype-homepage"],
    ["/pages/case.html", "main"],
    ["/pages/cnap-case.html", "main"],
    ["/pages/dodo.html", "main"],
    ["/pages/skip-read.html", "main"],
    ["/pages/xiaohongshu.html", "main"],
    ["/pages/design-review-skill.html", "main"],
    ["/pages/figma-asset-exporter.html", "main"],
  ];
  await openPage(...pages[0]);
  const homepageLoad = await evaluate(`(() => {
    const entries = [
      ...performance.getEntriesByType('navigation'),
      ...performance.getEntriesByType('resource')
    ];
    return {
      bytes: entries.reduce((sum, entry) => sum + (entry.transferSize || entry.encodedBodySize || 0), 0),
      resources: entries.length
    };
  })()`);
  assert.ok(
    homepageLoad.bytes <= homepageInitialLoadBudget,
    `homepage initial load is ${(homepageLoad.bytes / 1048576).toFixed(2)} MiB; budget is 2.00 MiB`,
  );
  console.log(`homepage initial load: ${(homepageLoad.bytes / 1048576).toFixed(2)} MiB across ${homepageLoad.resources} requests`);

  await send("Emulation.setDeviceMetricsOverride", {
    width: 640,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await openPage(...pages[0]);
  const narrowCursorGuide = await evaluate(`(() => {
    const probe = document.createElement('span');
    probe.className = 'hero-stack-demo-cursor';
    probe.innerHTML = '<svg viewBox="0 0 36 37" aria-hidden="true"></svg>';
    document.querySelector('.hero-project-stack').append(probe);
    const styles = getComputedStyle(probe);
    const cnapCard = document.querySelector('.hero-stack-cnap');
    const tooltip = cnapCard.querySelector('.hero-project-tooltip');
    tooltip.style.transition = 'none';
    cnapCard.classList.add('is-demo-hover');
    const tooltipStyles = getComputedStyle(tooltip);
    const result = {
      width: Number.parseFloat(styles.width),
      height: Number.parseFloat(styles.height),
      position: styles.position,
      opacity: styles.opacity,
      tooltip: {
        display: tooltipStyles.display,
        width: Number.parseFloat(tooltipStyles.width),
        opacity: tooltipStyles.opacity,
      },
    };
    cnapCard.classList.remove('is-demo-hover');
    probe.remove();
    return result;
  })()`);
  assert.ok(narrowCursorGuide.width >= 40 && narrowCursorGuide.width <= 52, `narrow cursor guide width is ${narrowCursorGuide.width}px`);
  assert.ok(narrowCursorGuide.height >= 40 && narrowCursorGuide.height <= 54, `narrow cursor guide height is ${narrowCursorGuide.height}px`);
  assert.equal(narrowCursorGuide.position, "absolute");
  assert.equal(narrowCursorGuide.opacity, "0");
  assert.equal(narrowCursorGuide.tooltip.display, "grid");
  assert.ok(narrowCursorGuide.tooltip.width > 0 && narrowCursorGuide.tooltip.width <= 190, `narrow tooltip width is ${narrowCursorGuide.tooltip.width}px`);
  assert.equal(narrowCursorGuide.tooltip.opacity, "1");
  await send("Emulation.clearDeviceMetricsOverride");

  for (const [pathname, selector] of pages.slice(1)) await openPage(pathname, selector);

  await openPage("/xiaohongshu.html?source=legacy#top", "main");
  const redirect = await evaluate(`({ pathname: location.pathname, search: location.search, hash: location.hash })`);
  assert.deepEqual(redirect, { pathname: "/pages/xiaohongshu.html", search: "?source=legacy", hash: "#top" });

  await openPage("/demos/workload-demo/index.html", "#clusterGroups");
  await waitFor(
    () => evaluate(`typeof window.mountCnapApplicationDropdown === "function"`),
    "the deferred application dropdown did not initialize",
  );
  const initial = await evaluate(`({
    groups: document.querySelectorAll('#clusterGroups .cluster-group').length,
    exposureLabel: document.querySelector('[data-app-nav="exposure"] span')?.textContent,
    dropdownReady: typeof window.mountCnapApplicationDropdown === 'function'
  })`);
  assert.equal(initial.groups, 7);
  assert.equal(initial.exposureLabel, "流量接入");
  assert.equal(initial.dropdownReady, true);

  await evaluate(`document.querySelector('[data-context="application"]').click()`);
  await delay(100);
  const menu = await evaluate(`({
    hidden: document.querySelector('#actionMenu').classList.contains('hidden'),
    type: document.querySelector('#actionMenu').dataset.menuType,
    reactRoot: Boolean(document.querySelector('#actionMenu [data-cnap-react-root="application-dropdown"]')),
    legacyMenu: Boolean(document.querySelector('#actionMenu [data-application-search]'))
  })`);
  assert.equal(menu.hidden, false);
  assert.equal(menu.type, "application");
  assert.equal(menu.reactRoot, true);
  assert.equal(menu.legacyMenu, false);
  assert.deepEqual(errors, []);
  assert.deepEqual([...missingRequests], []);

  console.log(`browser smoke test passed for ${pages.length + 2} routes`);
} finally {
  socket?.close();
  chrome.kill("SIGTERM");
  server.close();
  await rm(profileDir, { recursive: true, force: true });
}
