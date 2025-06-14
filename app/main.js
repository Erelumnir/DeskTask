const { app, BrowserWindow, ipcMain } = require("electron");
const { autoUpdater } = require("electron-updater");
const path = require("path");
const fs = require("fs");

const tasksPath = path.join(app.getPath("userData"), "tasks.json");

function loadTasks() {
  try {
    return JSON.parse(fs.readFileSync(tasksPath));
  } catch {
    return [];
  }
}

function saveTasks(tasks) {
  fs.writeFileSync(tasksPath, JSON.stringify(tasks));
  console.log("Writing to:", tasksPath);
}

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 700,
    title: "DeskTask",
    frame: false,
    resizable: true,
    icon: path.join(__dirname, "src/favicon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      sandbox: false,
    },
  });

  win.setMenu(null);
  win.loadFile(path.join(__dirname, "index.html"));
}

app.whenReady().then(() => {
  createWindow();
  autoUpdater.checkForUpdatesAndNotify();

  autoUpdater.on("update-available", () => {
    BrowserWindow.getFocusedWindow()?.webContents.send("update-available");
  });

  autoUpdater.on("update-downloaded", () => {
    BrowserWindow.getFocusedWindow()?.webContents.send("update-downloaded");
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// IPC
ipcMain.on("save-tasks", (event, tasks) => {
  console.log("Saving tasks");
  saveTasks(tasks);
});

ipcMain.handle("get-tasks", () => {
  console.log("Loading tasks");
  return loadTasks();
});

ipcMain.on("delete-task", (event, id) => {
  const tasks = loadTasks().filter((t) => t.id !== id);
  saveTasks(tasks);
  event.reply("tasks", tasks);
});

//<!-- Window Controls -->
ipcMain.on("window-minimize", () => {
  BrowserWindow.getFocusedWindow()?.minimize();
});

ipcMain.on("window-maximize", () => {
  const win = BrowserWindow.getFocusedWindow();
  if (!win) return;
  win.isMaximized() ? win.unmaximize() : win.maximize();
});

ipcMain.on("window-close", () => {
  BrowserWindow.getFocusedWindow()?.close();
});

// Menu handlers
const { dialog } = require("electron");

ipcMain.handle("export-tasks", async (event, tasks) => {
  const { filePath } = await dialog.showSaveDialog({
    defaultPath: "tasks.json",
    filters: [{ name: "JSON", extensions: ["json"] }],
  });
  if (filePath) fs.writeFileSync(filePath, JSON.stringify(tasks, null, 2));
});

ipcMain.handle("import-tasks", async () => {
  const { filePaths } = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "JSON", extensions: ["json"] }],
  });
  if (filePaths?.[0]) {
    const file = fs.readFileSync(filePaths[0]);
    return JSON.parse(file);
  }
  return null;
});

ipcMain.handle("clear-tasks", () => {
  saveTasks([]);
});

ipcMain.on("open-devtools", () => {
  BrowserWindow.getFocusedWindow()?.webContents.openDevTools({
    mode: "detach",
  });
});

// Versioning and updates
ipcMain.handle("get-app-version", () => {
  return app.getVersion();
});

ipcMain.on("quit-and-install", () => {
  autoUpdater.quitAndInstall();
});

autoUpdater.on("update-available", () => console.log("🔄 Update available"));
autoUpdater.on("update-downloaded", () => console.log("✅ Update downloaded"));
autoUpdater.on("error", (err) => console.error("❌ Auto-update error:", err));
