const { app, BrowserWindow, ipcMain } = require("electron");
const fs = require("fs/promises");
const path = require("path");

const EMPTY_STATE = {
  schemaVersion: 1,
  workTypes: [],
  workItems: [],
  records: [],
};

function getDataDirectory() {
  if (process.env.PORTABLE_EXECUTABLE_DIR) {
    return process.env.PORTABLE_EXECUTABLE_DIR;
  }
  if (!app.isPackaged) return __dirname;
  if (process.platform === "darwin") {
    return path.dirname(path.dirname(path.dirname(path.dirname(process.execPath))));
  }
  return path.dirname(process.execPath);
}

function getDataFile() {
  if (process.env.DATA_FILE) {
    return path.resolve(getDataDirectory(), process.env.DATA_FILE);
  }
  return path.join(getDataDirectory(), "daily-data.json");
}

function normalizeState(value) {
  return {
    schemaVersion: 1,
    workTypes: Array.isArray(value?.workTypes) ? value.workTypes : [],
    workItems: Array.isArray(value?.workItems) ? value.workItems : [],
    records: Array.isArray(value?.records) ? value.records : [],
  };
}

async function writeState(nextState) {
  const normalized = normalizeState(nextState);
  const dataFile = getDataFile();
  const tempFile = `${dataFile}.tmp`;
  await fs.writeFile(tempFile, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
  await fs.rename(tempFile, dataFile);
  return normalized;
}

async function readState() {
  try {
    const content = await fs.readFile(getDataFile(), "utf8");
    return normalizeState(JSON.parse(content));
  } catch (error) {
    if (error.code === "ENOENT") {
      return writeState(EMPTY_STATE);
    }
    throw error;
  }
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 980,
    minHeight: 680,
    title: "每日工作记录",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  window.loadFile(path.join(__dirname, "index.html"));
}

ipcMain.handle("state:load", readState);
ipcMain.handle("state:save", (_event, nextState) => writeState(nextState));
ipcMain.handle("state:data-file", () => getDataFile());

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  app.quit();
});
