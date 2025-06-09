const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const {
  setupTitlebar,
  attachTitlebarToWindow,
} = require("custom-electron-titlebar/main");

setupTitlebar();

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    titleBarStyle: "hidden",
    titleBarOverlay: true,
    webPreferences: {
      sandbox: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.loadURL("file://" + path.join(__dirname, "index.html"));
  attachTitlebarToWindow(mainWindow);

  // Optional: open devtools by default
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// =================== Task Management ===================

const tasksFile = path.join(app.getPath("userData"), "tasks.json");

function loadTasks() {
  try {
    return JSON.parse(fs.readFileSync(tasksFile, "utf8"));
  } catch {
    return [];
  }
}

function saveTasks(tasks) {
  fs.writeFileSync(tasksFile, JSON.stringify(tasks, null, 2));
}

// Send tasks back to renderer
function refreshTasks(sender) {
  const tasks = loadTasks();
  sender.send("tasks", tasks);
}

ipcMain.on("add-task", (event, name, priority) => {
  const tasks = loadTasks();
  tasks.push({
    id: Date.now().toString(),
    name,
    completed: false,
    priority,
  });
  saveTasks(tasks);
  refreshTasks(event.sender);
});

ipcMain.on("toggle-task", (event, id) => {
  const tasks = loadTasks();
  const task = tasks.find((t) => t.id === id);
  if (task) task.completed = !task.completed;
  saveTasks(tasks);
  refreshTasks(event.sender);
});

ipcMain.on("delete-task", (event, id) => {
  const tasks = loadTasks().filter((t) => t.id !== id);
  saveTasks(tasks);
  refreshTasks(event.sender);
});

ipcMain.on("edit-task", (event, { id, name, priority }) => {
  const tasks = loadTasks();
  const task = tasks.find((t) => t.id === id);
  if (task) {
    task.name = name;
    if (priority) task.priority = priority;
  }
  saveTasks(tasks);
  refreshTasks(event.sender);
});

// Placeholder for bulk deletion (planned enhancement)
ipcMain.on("delete-completed-tasks", (event) => {
  const tasks = loadTasks().filter((t) => !t.completed);
  saveTasks(tasks);
  refreshTasks(event.sender);
});

// Optional: open devtools via shortcut
ipcMain.on("open-devtools", () => {
  if (mainWindow) mainWindow.webContents.openDevTools();
});
