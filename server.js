import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const host = process.env.HOST || (process.env.CODESPACES === "true" ? "0.0.0.0" : "127.0.0.1");
let port = Number.parseInt(process.env.PORT || process.argv[2] || "5173", 10);
const root = path.dirname(fileURLToPath(import.meta.url));
const safeRoot = root.endsWith(path.sep) ? root : `${root}${path.sep}`;
const blocked = new Set([".git", "node_modules", "test"]);

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
};

function send(response, statusCode, body, contentType = "text/plain; charset=utf-8", cache = "no-store") {
  response.writeHead(statusCode, {
    "Cache-Control": cache,
    "Content-Type": contentType,
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
  });
  response.end(body);
}

async function handleStatic(response, pathname) {
  const safePathname = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.normalize(path.join(root, decodeURIComponent(safePathname)));

  if (!filePath.startsWith(safeRoot) || blocked.has(path.relative(root, filePath).split(path.sep)[0])) {
    send(response, 403, "Forbidden");
    return;
  }

  const body = await fs.readFile(filePath);
  const isFont = filePath.includes(`${path.sep}fonts${path.sep}`);
  send(response, 200, body, contentTypes[path.extname(filePath)] || "application/octet-stream", isFont ? "max-age=3600" : "no-store");
}

const server = http.createServer(async (request, response) => {
  try {
    if (request.method !== "GET" && request.method !== "HEAD") {
      send(response, 405, "Method not allowed");
      return;
    }
    const requestUrl = new URL(request.url, `http://${request.headers.host || "localhost"}`);
    await handleStatic(response, requestUrl.pathname);
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "EISDIR") {
      send(response, 404, "Not found");
      return;
    }
    send(response, 500, "Server error");
  }
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE" && port < 5190) {
    port += 1;
    console.warn(`Port ${port - 1} is already in use. Trying ${port}...`);
    server.listen(port, host);
    return;
  }

  console.error(error.message);
  process.exit(1);
});

server.listen(port, host, () => {
  const shownHost = host === "0.0.0.0" ? "127.0.0.1" : host;
  console.log(`Builder Check running at http://${shownHost}:${port}`);
  // In a codespace, the forwarded address is the one to open in your own browser.
  const { CODESPACE_NAME: codespace, GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN: domain } = process.env;
  if (codespace && domain) console.log(`Open it from Codespaces: https://${codespace}-${port}.${domain}`);
});
