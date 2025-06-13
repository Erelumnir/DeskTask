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
