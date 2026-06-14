const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("dailyWorkStorage", {
  loadState: () => ipcRenderer.invoke("state:load"),
  saveState: (state) => ipcRenderer.invoke("state:save", state),
  getDataFile: () => ipcRenderer.invoke("state:data-file"),
});
