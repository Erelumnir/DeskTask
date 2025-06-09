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
    webPreferences: {
      preload: path.join(__dirname, "app/preload.js"),
      nodeIntegration: false, // Ensure security by disabling nodeIntegration
      contextIsolation: true, // Isolate context for security
    },
  });

  mainWindow.loadFile("index.html");

  // Load tasks from file
  const tasksFilePath = path.join(app.getPath("userData"), "tasks.json");
  try {
    tasks = JSON.parse(fs.readFileSync(tasksFilePath));
  } catch (error) {
    console.error("Error reading tasks file:", error);
  }

  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow.webContents.send("tasks", tasks);
  });
}

app.on("ready", () => {
  createWindow();

  // Automatically launch the app on startup
  const appLaunch = new AutoLaunch({
    name: "Desktop Todo List", // Name of your app
    isHidden: false,
  });

  appLaunch
    .isEnabled()
    .then((isEnabled) => {
      if (!isEnabled) {
        return appLaunch.enable(); // Enable auto-launch if not already enabled
      }
    })
    .catch((err) => console.error("Auto-launch failed:", err));
});

// Save tasks to file on app quit
app.on("before-quit", () => {
  const tasksFilePath = path.join(app.getPath("userData"), "tasks.json");
  fs.writeFileSync(tasksFilePath, JSON.stringify(tasks));
});

ipcMain.on("add-task", (event, taskName, priority) => {
  const newTask = {
    id: Date.now().toString(),
    name: taskName,
    completed: false,
    priority: priority || "low-priority", // Default to low priority if not provided
  };
  tasks.push(newTask);
  mainWindow.webContents.send("tasks", tasks);
});

ipcMain.on("delete-task", (event, taskId) => {
  tasks = tasks.filter((task) => task.id !== taskId);
  mainWindow.webContents.send("tasks", tasks);
});

ipcMain.on("edit-task", (event, { id, name }) => {
  const task = tasks.find((task) => task.id === id);
  if (task) {
    task.name = name;
    mainWindow.webContents.send("tasks", tasks);
  }
});

ipcMain.on("toggle-task", (event, taskId) => {
  const task = tasks.find((task) => task.id === taskId);
  if (task) {
    task.completed = !task.completed;
    mainWindow.webContents.send("tasks", tasks);
  }
});
