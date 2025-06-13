const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const prioritySelect = document.getElementById("prioritySelect");
const taskList = document.getElementById("taskList");
const clearCompletedBtn = document.getElementById("clearCompleted");

let tasks = [];

// Load
async function loadTasks() {
  let saved = await window.electron.getTasks();

  // Fallback: migrate from localStorage if file is empty
  if (!saved || saved.length === 0) {
    const legacy = localStorage.getItem("tasks");
    if (legacy) {
      saved = JSON.parse(legacy);
      window.electron.saveTasks(saved); // persist to file
      localStorage.removeItem("tasks"); // optional cleanup
    }
  }

  tasks = Array.isArray(saved) ? saved : [];
  renderTasks();
}

// Save
function saveTasks() {
  window.electron.saveTasks(tasks);
}

// Add new task
taskForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = taskInput.value.trim();
  const priority = prioritySelect.value;
  if (!name) return;

  const newTask = {
    id: Date.now().toString(),
    name,
    priority,
    completed: false,
  };

  tasks.push(newTask);
  taskInput.value = "";
  taskList.appendChild(createTaskElement(newTask));
  saveTasks();
});

// Render all tasks (initial load or reorder)
function renderTasks() {
  taskList.innerHTML = "";
  tasks.forEach((task) => {
    const el = createTaskElement(task);
    taskList.appendChild(el);
  });
}

// Create a single task element
function createTaskElement(task) {
  const div = document.createElement("div");
  div.className = `task ${task.completed ? "completed" : ""} ${
    task.priority
  }-priority`;
  div.dataset.dragId = task.id;

  // Marker for visual indication
  const marker = document.createElement("div");
  marker.className = "marker";

  // Drag handle for reordering
  const handle = document.createElement("div");
  handle.className = "drag-handle";
  handle.innerHTML = "☰";
  handle.title = "Drag to reorder";
  handle.setAttribute("aria-label", "Drag task");
  handle.addEventListener("mousedown", () =>
    div.setAttribute("draggable", "true")
  );
  handle.addEventListener("mouseup", () =>
    div.setAttribute("draggable", "false")
  );

  // Task name with editable feature
  const name = document.createElement("div");
  name.className = "task-name";
  name.textContent = task.name;
  name.contentEditable = true;
  name.addEventListener("blur", () => {
    task.name = name.textContent.trim();
    saveTasks();
  });
  name.addEventListener("click", (e) => e.stopPropagation());

  // Spacer for layout
  const spacer = document.createElement("div");
  spacer.className = "task-spacer";

  // Edit priority helpers
  marker.addEventListener("click", (e) => {
    e.stopPropagation();
    showPriorityMenu(task, div, marker);
  });

  // Delete button + icon
  const deleteBtn = document.createElement("button");
  deleteBtn.className = "delete-btn";
  const trashIcon = document.createElement("img");
  trashIcon.src = "src/trash.svg";
  trashIcon.alt = "Delete Task";
  deleteBtn.appendChild(trashIcon);

  deleteBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    div.classList.add("fade-out");
    div.addEventListener(
      "transitionend",
      () => {
        tasks = tasks.filter((t) => t.id !== task.id);
        saveTasks();
        div.remove();
      },
      { once: true }
    );
  });

  div.addEventListener("click", () => {
    task.completed = !task.completed;
    div.classList.toggle("completed");
    saveTasks();
  });

  div.addEventListener("dragstart", () => div.classList.add("dragging"));
  div.addEventListener("dragend", () => div.classList.remove("dragging"));

  // Insert in DOM
  div.appendChild(marker);
  div.appendChild(handle);
  div.appendChild(name);
  div.appendChild(spacer);
  div.appendChild(deleteBtn);

  return div;
}

// Clear completed tasks
function clearCompletedTasks() {
  tasks = tasks.filter((t) => !t.completed);
  saveTasks();
  document.querySelectorAll(".task.completed").forEach((el) => el.remove());
}

clearCompletedBtn.addEventListener("click", () => {
  clearCompletedTasks();
});

// Reorder helpers
function getDragAfterElement(container, y) {
  const elements = [...container.querySelectorAll(".task:not(.dragging)")];
  return elements.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset, element: child };
      } else {
        return closest;
      }
    },
    { offset: Number.NEGATIVE_INFINITY }
  ).element;
}

taskList.addEventListener("dragover", (e) => {
  e.preventDefault();
  const afterElement = getDragAfterElement(taskList, e.clientY);
  const dragging = document.querySelector(".dragging");
  if (!dragging) return;
  if (afterElement == null) {
    taskList.appendChild(dragging);
  } else {
    taskList.insertBefore(dragging, afterElement);
  }
});

taskList.addEventListener("drop", () => {
  const newOrder = Array.from(taskList.children).map((el) => el.dataset.dragId);
  tasks.sort((a, b) => newOrder.indexOf(a.id) - newOrder.indexOf(b.id));
  saveTasks();
  renderTasks();
});

// Priority menu
function showPriorityMenu(task, container, anchor) {
  // Remove any existing menu
  document.querySelectorAll(".priority-edit-menu").forEach((el) => el.remove());

  const menu = document.createElement("div");
  menu.className = "priority-edit-menu";

  ["low", "medium", "high"].forEach((level) => {
    const btn = document.createElement("button");
    btn.className = level;
    btn.title = `Set ${level}`;
    btn.addEventListener("click", () => {
      task.priority = level;
      saveTasks();

      const updated = createTaskElement(task);
      container.replaceWith(updated);
    });
    menu.appendChild(btn);
  });

  // Position the menu relative to marker
  const rect = anchor.getBoundingClientRect();
  menu.style.position = "fixed";
  menu.style.left = `${rect.left + 16}px`;
  menu.style.top = `${rect.top}px`;
  menu.style.zIndex = "1000";

  document.body.appendChild(menu);

  // Auto-remove on click outside
  document.addEventListener("click", () => menu.remove(), { once: true });
}

// Theme toggle
const themeToggleBtn = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");

function applyTheme() {
  const saved = localStorage.getItem("theme");
  if (saved === "light") {
    document.body.classList.add("light");
    themeIcon.src = "src/sun.svg";
  } else {
    document.body.classList.remove("light");
    themeIcon.src = "src/moon.svg";
  }
}

function toggleTheme() {
  const isLight = document.body.classList.toggle("light");
  localStorage.setItem("theme", isLight ? "light" : "dark");
  themeIcon.src = isLight ? "src/sun.svg" : "src/moon.svg";
}

themeToggleBtn.addEventListener("click", toggleTheme);

// Initialize
applyTheme();
loadTasks();

// Add event listeners for window controls
document.getElementById("minBtn").addEventListener("click", () => {
  window.electron.windowControl.minimize();
});
document.getElementById("maxBtn").addEventListener("click", () => {
  window.electron.windowControl.maximize();
});
document.getElementById("closeBtn").addEventListener("click", () => {
  window.electron.windowControl.close();
});

// Modal logic
const settingsToggle = document.getElementById("settingsToggle");
const settingsModal = document.getElementById("settingsModal");

settingsToggle.addEventListener("click", (e) => {
  e.stopPropagation();
  const isVisible = settingsModal.classList.contains("show");
  settingsModal.classList.toggle("show", !isVisible);
});

// Hide modal if clicking outside
document.addEventListener("click", (e) => {
  const isInside =
    settingsModal.contains(e.target) || settingsToggle.contains(e.target);
  if (!isInside) {
    settingsModal.classList.remove("show");

    // Collapse dropdowns inside the modal
    document
      .querySelectorAll("#settingsModal details")
      .forEach((d) => d.removeAttribute("open"));
  }
});

// Modal settings buttons
document.getElementById("exportTasks").addEventListener("click", () => {
  window.electronAPI.exportTasks(tasks);
  showToast(`Exported tasks.`);
});

document.getElementById("importTasks").addEventListener("click", async () => {
  const imported = await window.electronAPI.importTasks();
  if (Array.isArray(imported)) {
    const append = confirm(
      "Append to existing tasks?\nClick Cancel to replace."
    );
    tasks = append ? [...tasks, ...imported] : imported;
    saveTasks();
    renderTasks();
    showToast(`Imported ${imported.length} tasks.`);
  }
});

document.getElementById("clearAllTasks").addEventListener("click", () => {
  const confirmClear = confirm("Are you sure you want to clear all tasks?");
  if (confirmClear) {
    tasks = [];
    saveTasks();
    renderTasks();
    showToast("All tasks cleared.");
  }
});

// Toast notifications
function showToast(message, duration = 2500) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  toast.hidden = false;

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => (toast.hidden = true), 300);
  }, duration);
}

// Hotkeys
document.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();

  if (e.ctrlKey && !e.shiftKey && key === "n") {
    e.preventDefault();
    taskInput.focus();
  }

  if (e.ctrlKey && e.shiftKey && key === "c") {
    e.preventDefault();
    clearCompletedTasks();
    showToast("Completed tasks cleared.");
  }

  if (e.ctrlKey && !e.shiftKey && key === "e") {
    e.preventDefault();
    document.body.classList.toggle("light");
    const isLight = document.body.classList.contains("light");
    localStorage.setItem("theme", isLight ? "light" : "dark");
    themeIcon.src = isLight ? "src/sun.svg" : "src/moon.svg";
  }

  if (e.ctrlKey && !e.shiftKey && key === "i") {
    e.preventDefault();
    document.getElementById("importTasks").click();
  }

  if (e.ctrlKey && !e.shiftKey && key === "o") {
    e.preventDefault();
    document.getElementById("exportTasks").click();
  }

  if (e.ctrlKey && e.shiftKey && key === "i") {
    e.preventDefault();
    window.electronAPI?.openDevTools?.();
  }
});
