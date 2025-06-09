const { contextBridge, ipcRenderer } = require("electron");

// Expose safe functionality to the renderer process
contextBridge.exposeInMainWorld("electron", {
  send: (channel, data) => ipcRenderer.send(channel, data),
  on: (channel, func) => ipcRenderer.on(channel, func),
});
