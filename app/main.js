// app/main.js
const { app, BrowserWindow, ipcMain } = require("electron");
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
}

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    title: "DeskTask",
    icon: path.join(__dirname, "src/favicon_dark.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      sandbox: false,
    },
  });

  win.loadFile(path.join(__dirname, "index.html"));
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// IPC
ipcMain.on("get-tasks", (event) => {
  event.reply("tasks", loadTasks());
});

ipcMain.on("add-task", (event, task) => {
  const tasks = loadTasks();
  tasks.push({ ...task, id: Date.now().toString(), completed: false });
  saveTasks(tasks);
  event.reply("tasks", tasks);
});

ipcMain.on("toggle-task", (event, id) => {
  const tasks = loadTasks();
  const task = tasks.find((t) => t.id === id);
  if (task) task.completed = !task.completed;
  saveTasks(tasks);
  event.reply("tasks", tasks);
});

ipcMain.on("delete-task", (event, id) => {
  const tasks = loadTasks().filter((t) => t.id !== id);
  saveTasks(tasks);
  event.reply("tasks", tasks);
});

ipcMain.on("edit-task", (event, updatedTask) => {
  const tasks = loadTasks();
  const task = tasks.find((t) => t.id === updatedTask.id);
  if (task) {
    task.name = updatedTask.name;
    task.priority = updatedTask.priority;
  }
  saveTasks(tasks);
  event.reply("tasks", tasks);
});
