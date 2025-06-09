const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const AutoLaunch = require("auto-launch");

let mainWindow;
let tasks = [];

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 500,
    minHeight: 400,
    frame: false, // Hide system bar
    resizable: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.webContents.on('before-input-event', (event, input) => {
    const isDevShortcut = input.control && input.shift && input.key.toLowerCase() === 'i';
    if (isDevShortcut) {
      event.preventDefault();
      mainWindow.webContents.toggleDevTools();
    }
  });

  mainWindow.loadURL("file://" + path.join(__dirname, "index.html"));


  const taskFile = path.join(app.getPath("userData"), "tasks.json");
  if (fs.existsSync(taskFile)) {
    tasks = JSON.parse(fs.readFileSync(taskFile));
  }

  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow.webContents.send("tasks", tasks);
  });
}

app.whenReady().then(() => {
  createWindow();

  const launcher = new AutoLaunch({
    name: "DeskTask",
    isHidden: false,
  });

  launcher
    .isEnabled()
    .then((enabled) => {
      if (!enabled) launcher.enable();
    })
    .catch(console.error);
});

app.on("before-quit", () => {
  const taskFile = path.join(app.getPath("userData"), "tasks.json");
  fs.writeFileSync(taskFile, JSON.stringify(tasks));
});

ipcMain.on("window-control", (event, action) => {
  if (!mainWindow) return;
  switch (action) {
    case "minimize":
      mainWindow.minimize();
      break;
    case "maximize":
      mainWindow.isMaximized()
        ? mainWindow.unmaximize()
        : mainWindow.maximize();
      break;
    case "close":
      mainWindow.close();
      break;
  }
});

ipcMain.on("add-task", (e, name, priority) => {
  tasks.push({ id: Date.now().toString(), name, completed: false, priority });
  mainWindow.webContents.send("tasks", tasks);
});

ipcMain.on("delete-task", (e, id) => {
  tasks = tasks.filter((task) => task.id !== id);
  mainWindow.webContents.send("tasks", tasks);
});

ipcMain.on("edit-task", (e, { id, name }) => {
  const task = tasks.find((t) => t.id === id);
  if (task) task.name = name;
  mainWindow.webContents.send("tasks", tasks);
});

ipcMain.on("toggle-task", (e, id) => {
  const task = tasks.find((t) => t.id === id);
  if (task) task.completed = !task.completed;
  mainWindow.webContents.send("tasks", tasks);
});
