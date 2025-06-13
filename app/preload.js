// app/preload.js
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
});
