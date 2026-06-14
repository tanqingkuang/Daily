const fs = require("fs/promises");
const http = require("http");
const path = require("path");

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 3000);
const DATA_FILE = path.resolve(ROOT, process.env.DATA_FILE || "daily-data.json");

const EMPTY_STATE = {
  schemaVersion: 1,
  workTypes: [],
  workItems: [],
  records: [],
};

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
};

function normalizeState(value) {
  return {
    schemaVersion: 1,
    workTypes: Array.isArray(value?.workTypes) ? value.workTypes : [],
    workItems: Array.isArray(value?.workItems) ? value.workItems : [],
    records: Array.isArray(value?.records) ? value.records : [],
  };
}

async function readState() {
  try {
    const content = await fs.readFile(DATA_FILE, "utf8");
    return normalizeState(JSON.parse(content));
  } catch (error) {
    if (error.code === "ENOENT") {
      await writeState(EMPTY_STATE);
      return EMPTY_STATE;
    }
    throw error;
  }
}

async function writeState(nextState) {
  const normalized = normalizeState(nextState);
  const tempFile = `${DATA_FILE}.tmp`;
  await fs.writeFile(tempFile, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
  await fs.rename(tempFile, DATA_FILE);
}

async function readRequestBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "Content-Type": MIME_TYPES[".json"] });
  response.end(JSON.stringify(payload));
}

async function serveStatic(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const requestedPath = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const filePath = path.resolve(ROOT, `.${requestedPath}`);

  if (!filePath.startsWith(ROOT) || path.basename(filePath) === path.basename(DATA_FILE)) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }

  try {
    const content = await fs.readFile(filePath);
    const contentType = MIME_TYPES[path.extname(filePath)] || "application/octet-stream";
    response.writeHead(200, { "Content-Type": contentType });
    response.end(content);
  } catch (error) {
    if (error.code === "ENOENT") {
      response.writeHead(404);
      response.end("Not found");
      return;
    }
    throw error;
  }
}

const server = http.createServer(async (request, response) => {
  try {
    if (request.url === "/api/state" && request.method === "GET") {
      sendJson(response, 200, await readState());
      return;
    }

    if (request.url === "/api/state" && request.method === "PUT") {
      const body = await readRequestBody(request);
      const nextState = JSON.parse(body);
      await writeState(nextState);
      sendJson(response, 200, { ok: true });
      return;
    }

    if (request.method === "GET") {
      await serveStatic(request, response);
      return;
    }

    response.writeHead(405);
    response.end("Method not allowed");
  } catch (error) {
    console.error(error);
    sendJson(response, 500, { error: "server_error" });
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`每日工作记录已启动：http://127.0.0.1:${PORT}`);
  console.log(`数据文件：${DATA_FILE}`);
});
