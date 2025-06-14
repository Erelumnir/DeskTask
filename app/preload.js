const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  getTasks: () => ipcRenderer.invoke("get-tasks"),
  saveTasks: (tasks) => ipcRenderer.send("save-tasks", tasks),
  windowControl: {
    minimize: () => ipcRenderer.send("window-minimize"),
    maximize: () => ipcRenderer.send("window-maximize"),
    close: () => ipcRenderer.send("window-close"),
  },
});

contextBridge.exposeInMainWorld("electronAPI", {
  openDevTools: () => ipcRenderer.send("open-devtools"),
  exportTasks: (tasks) => ipcRenderer.invoke("export-tasks", tasks),
  importTasks: () => ipcRenderer.invoke("import-tasks"),
  clearTasks: () => ipcRenderer.invoke("clear-tasks"),
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
  quitAndInstall: () => ipcRenderer.send("quit-and-install"),
});

ipcRenderer.on("update-available", () => {
  window.dispatchEvent(new CustomEvent("update-available"));
});

ipcRenderer.on("update-downloaded", () => {
  window.dispatchEvent(new CustomEvent("update-downloaded"));
});
