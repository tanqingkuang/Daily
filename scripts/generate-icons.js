const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "..");
const buildDir = path.join(root, "build");
const svgPath = path.join(buildDir, "icon.svg");
const pngPath = path.join(buildDir, "icon.png");
const icoPath = path.join(buildDir, "icon.ico");
const iconsetDir = path.join(buildDir, "icon.iconset");
const icnsPath = path.join(buildDir, "icon.icns");
const htmlPath = path.join(buildDir, "icon-render.html");

const icoSizes = [16, 24, 32, 48, 64, 128, 256];
const icnsFiles = [
  ["icon_16x16.png", 16],
  ["icon_16x16@2x.png", 32],
  ["icon_32x32.png", 32],
  ["icon_32x32@2x.png", 64],
  ["icon_128x128.png", 128],
  ["icon_128x128@2x.png", 256],
  ["icon_256x256.png", 256],
  ["icon_256x256@2x.png", 512],
  ["icon_512x512.png", 512],
  ["icon_512x512@2x.png", 1024],
];

function pngChunks(buffer) {
  const chunks = [];
  let offset = 8;
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString("ascii");
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    chunks.push({ type, data });
    offset += length + 12;
  }
  return chunks;
}

function pngDimensions(buffer) {
  const ihdr = pngChunks(buffer).find((chunk) => chunk.type === "IHDR");
  if (!ihdr) throw new Error("Invalid PNG: missing IHDR");
  return {
    width: ihdr.data.readUInt32BE(0),
    height: ihdr.data.readUInt32BE(4),
  };
}

function makeIco(entries) {
  const headerSize = 6;
  const directorySize = entries.length * 16;
  let imageOffset = headerSize + directorySize;
  const buffers = [Buffer.alloc(headerSize), Buffer.alloc(directorySize)];

  buffers[0].writeUInt16LE(0, 0);
  buffers[0].writeUInt16LE(1, 2);
  buffers[0].writeUInt16LE(entries.length, 4);

  entries.forEach((entry, index) => {
    const dimensions = pngDimensions(entry.buffer);
    const offset = index * 16;
    buffers[1].writeUInt8(dimensions.width >= 256 ? 0 : dimensions.width, offset);
    buffers[1].writeUInt8(dimensions.height >= 256 ? 0 : dimensions.height, offset + 1);
    buffers[1].writeUInt8(0, offset + 2);
    buffers[1].writeUInt8(0, offset + 3);
    buffers[1].writeUInt16LE(1, offset + 4);
    buffers[1].writeUInt16LE(32, offset + 6);
    buffers[1].writeUInt32LE(entry.buffer.length, offset + 8);
    buffers[1].writeUInt32LE(imageOffset, offset + 12);
    imageOffset += entry.buffer.length;
    buffers.push(entry.buffer);
  });

  return Buffer.concat(buffers);
}

function resizePng(size, outputPath) {
  execFileSync("sips", ["-z", String(size), String(size), pngPath, "--out", outputPath], {
    stdio: "ignore",
  });
}

async function renderSourcePng() {
  fs.writeFileSync(
    htmlPath,
    `<!doctype html><html><body style="margin:0;background:transparent">${fs.readFileSync(svgPath, "utf8")}</body></html>`,
  );

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1024, height: 1024 }, deviceScaleFactor: 1 });
    await page.goto(`file://${htmlPath}`);
    await page.screenshot({ path: pngPath, omitBackground: true });
  } finally {
    await browser.close();
    fs.rmSync(htmlPath, { force: true });
  }
}

async function main() {
  await renderSourcePng();

  const icoEntries = icoSizes.map((size) => {
    const outputPath = path.join(buildDir, `icon-${size}.png`);
    resizePng(size, outputPath);
    return { buffer: fs.readFileSync(outputPath) };
  });
  fs.writeFileSync(icoPath, makeIco(icoEntries));

  fs.rmSync(iconsetDir, { recursive: true, force: true });
  fs.mkdirSync(iconsetDir, { recursive: true });
  for (const [fileName, size] of icnsFiles) {
    resizePng(size, path.join(iconsetDir, fileName));
  }
  execFileSync("iconutil", ["-c", "icns", iconsetDir, "-o", icnsPath], { stdio: "ignore" });

  for (const size of icoSizes) {
    fs.rmSync(path.join(buildDir, `icon-${size}.png`), { force: true });
  }
  fs.rmSync(iconsetDir, { recursive: true, force: true });
  fs.rmSync(pngPath, { force: true });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
