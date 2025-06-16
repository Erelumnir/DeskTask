const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const prioritySelect = document.getElementById("prioritySelect");
const taskList = document.getElementById("taskList");
const clearCompletedBtn = document.getElementById("clearCompleted");

let tasksByTab = {};
let activeTab = localStorage.getItem("activeTab") || "Tasks";

const tabBar = document.getElementById("tab-bar");
const addTabBtn = document.getElementById("add-tab");

function renderTabs() {
  const oldTabs = [...tabBar.querySelectorAll(".tab")];
  oldTabs.forEach((tab) => tab.remove());

  Object.keys(tasksByTab).forEach((tabName) => {
    const tabBtn = document.createElement("button");
    tabBtn.classList.add("tab");
    if (tabName === activeTab) tabBtn.classList.add("active");

    const span = document.createElement("span");
    span.textContent = tabName;
    span.className = "tab-label";
    span.onclick = () => startTabEdit(tabName, span);

    tabBtn.onclick = (e) => {
      if (e.target.classList.contains("tab-label")) return;
      activeTab = tabName;
      localStorage.setItem("activeTab", activeTab);
      renderTabs();
      renderTasks();
    };

    tabBtn.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      showTabContextMenu(tabName, tabBtn);
    });

    tabBtn.appendChild(span);
    tabBar.insertBefore(tabBtn, addTabBtn);
  });
}

function startTabEdit(oldName, spanElement) {
  const input = document.createElement("input");
  input.type = "text";
  input.value = oldName;
  input.className = "tab-edit";

  // Match width of existing label
  const labelWidth = spanElement.offsetWidth + 12; // add padding
  input.style.width = `${labelWidth}px`;

  input.onblur = finish;
  input.onkeydown = (e) => {
    if (e.key === "Enter") finish();
    if (e.key === "Escape") cancel();
  };

  spanElement.replaceWith(input);
  input.focus();
  input.select();

  function finish() {
    const newName = input.value.trim();
    if (!newName || newName === oldName || tasksByTab[newName]) {
      cancel();
      return;
    }
    tasksByTab[newName] = tasksByTab[oldName];
    delete tasksByTab[oldName];
    if (activeTab === oldName) activeTab = newName;
    localStorage.setItem("activeTab", activeTab);
    saveTasks();
    renderTabs();
    renderTasks();
  }

  function cancel() {
    input.replaceWith(spanElement);
  }
}

function showTabContextMenu(tabName, anchor) {
  document.querySelectorAll(".tab-context-menu").forEach((m) => m.remove());

  const menu = document.createElement("div");
  menu.className = "tab-context-menu popup";
  menu.style.position = "fixed";

  const del = document.createElement("button");
  del.textContent = "Delete";
  del.onclick = () => {
    const confirmDelete = confirm(`Delete tab "${tabName}" and its tasks?`);
    if (!confirmDelete) return;

    delete tasksByTab[tabName];

    const remainingTabs = Object.keys(tasksByTab);
    if (remainingTabs.length === 0) {
      tasksByTab["Tasks"] = [];
      activeTab = "Tasks";
    } else if (activeTab === tabName) {
      activeTab = remainingTabs[0];
    }

    localStorage.setItem("activeTab", activeTab);
    saveTasks();
    renderTabs();
    renderTasks();

    taskInput.disabled = false;
    taskInput.placeholder = "Add a new task...";
    taskInput.focus();

    menu.remove();
  };

  menu.appendChild(del);

  const rect = anchor.getBoundingClientRect();
  menu.style.left = `${rect.left}px`;
  menu.style.top = `${rect.bottom + 5}px`;
  menu.style.zIndex = "9999";

  document.body.appendChild(menu);
  document.addEventListener("click", () => menu.remove(), { once: true });
}

addTabBtn.onclick = () => {
  document.getElementById("newTabModal").classList.remove("hidden");
  document.getElementById("newTabName").value = "";
  document.getElementById("newTabName").focus();
};

document.getElementById("confirmNewTab").onclick = () => {
  const name = document.getElementById("newTabName").value.trim();
  if (!name || tasksByTab[name]) return;

  tasksByTab[name] = [];
  activeTab = name;
  localStorage.setItem("activeTab", name);
  renderTabs();
  renderTasks();
  saveTasks();

  // Hide modal & restore state
  const modal = document.getElementById("newTabModal");
  modal.classList.add("hidden");
  document.body.style.overflow = ""; // restore scroll if disabled
  taskInput.disabled = false;
  taskInput.focus();
};

document.getElementById("cancelNewTab").onclick = () => {
  document.getElementById("newTabModal").classList.add("hidden");
  document.body.style.overflow = "";
  taskInput.disabled = false;
};

// Load
async function loadTasks() {
  let saved = await window.electron.getTasks();

  if (!saved || Object.keys(saved).length === 0) {
    const legacy = localStorage.getItem("tasks");
    if (legacy) {
      const migrated = JSON.parse(legacy);
      saved = { [activeTab]: migrated };
      window.electron.saveTasks(saved);
      localStorage.removeItem("tasks");
    }
  }

  tasksByTab =
    typeof saved === "object" && !Array.isArray(saved)
      ? saved
      : { [activeTab]: saved || [] };
  if (!tasksByTab[activeTab]) tasksByTab[activeTab] = [];

  renderTabs();
  renderTasks();
}

// Save
function saveTasks() {
  window.electron.saveTasks(tasksByTab);
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

  tasksByTab[activeTab].push(newTask);
  taskInput.value = "";
  taskList.appendChild(createTaskElement(newTask));
  saveTasks();
});

// Render all tasks (initial load or reorder)
function renderTasks() {
  if (!tasksByTab[activeTab]) {
    const fallbackTab = Object.keys(tasksByTab)[0];
    if (fallbackTab) {
      activeTab = fallbackTab;
      localStorage.setItem("activeTab", activeTab);
    }
  }

  taskList.innerHTML = "";
  const currentTasks = tasksByTab[activeTab] || [];
  currentTasks.forEach((task) => {
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

  const marker = document.createElement("div");
  marker.className = "marker";

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

  const name = document.createElement("div");
  name.className = "task-name";
  name.textContent = task.name;
  name.contentEditable = true;
  name.addEventListener("blur", () => {
    task.name = name.textContent.trim();
    saveTasks();
  });
  name.addEventListener("click", (e) => e.stopPropagation());

  const spacer = document.createElement("div");
  spacer.className = "task-spacer";

  marker.addEventListener("click", (e) => {
    e.stopPropagation();
    showPriorityMenu(task, div, marker);
  });

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
        tasksByTab[activeTab] = tasksByTab[activeTab].filter(
          (t) => t.id !== task.id
        );
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

  div.appendChild(marker);
  div.appendChild(handle);
  div.appendChild(name);
  div.appendChild(spacer);
  div.appendChild(deleteBtn);

  return div;
}

// Clear completed tasks
function clearCompletedTasks() {
  tasksByTab[activeTab] = tasksByTab[activeTab].filter((t) => !t.completed);
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
  tasksByTab[activeTab].sort(
    (a, b) => newOrder.indexOf(a.id) - newOrder.indexOf(b.id)
  );
  saveTasks();
  renderTasks();
});

// Priority menu
function showPriorityMenu(task, container, anchor) {
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

  const rect = anchor.getBoundingClientRect();
  menu.style.position = "fixed";
  menu.style.left = `${rect.left + 16}px`;
  menu.style.top = `${rect.top}px`;
  menu.style.zIndex = "1000";

  document.body.appendChild(menu);
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

// Init
applyTheme();
loadTasks();

// Window controls
document
  .getElementById("minBtn")
  .addEventListener("click", () => window.electron.windowControl.minimize());
document
  .getElementById("maxBtn")
  .addEventListener("click", () => window.electron.windowControl.maximize());
document
  .getElementById("closeBtn")
  .addEventListener("click", () => window.electron.windowControl.close());

// Modal logic
const settingsToggle = document.getElementById("settingsToggle");
const settingsModal = document.getElementById("settingsModal");

settingsToggle.addEventListener("click", (e) => {
  e.stopPropagation();
  const isVisible = settingsModal.classList.contains("show");
  settingsModal.classList.toggle("show", !isVisible);
});

document.addEventListener("click", (e) => {
  const isInside =
    settingsModal.contains(e.target) || settingsToggle.contains(e.target);
  if (!isInside) {
    settingsModal.classList.remove("show");
    document
      .querySelectorAll("#settingsModal details")
      .forEach((d) => d.removeAttribute("open"));
  }
});

document.getElementById("exportTasks").addEventListener("click", () => {
  window.electronAPI.exportTasks(tasksByTab);
  showToast(`Exported tasks.`);
});

document.getElementById("importTasks").addEventListener("click", async () => {
  const imported = await window.electronAPI.importTasks();
  if (typeof imported === "object" && !Array.isArray(imported)) {
    const append = confirm(
      "Append imported tabs?\nClick Cancel to replace all."
    );
    tasksByTab = append ? { ...tasksByTab, ...imported } : imported;
    saveTasks();
    renderTabs();
    renderTasks();
    showToast(`Imported tabs.`);
  }
});

document.getElementById("clearAllTasks").addEventListener("click", () => {
  const confirmClear = confirm("Are you sure you want to clear all tasks?");
  if (confirmClear) {
    tasksByTab[activeTab] = [];
    saveTasks();
    renderTasks();
    showToast("All tasks cleared.");
  }
});

// Toast
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

// Update events
window.addEventListener("update-available", () =>
  showToast("🔄 Update available. Downloading...")
);
window.addEventListener("update-downloaded", () =>
  showToast("✅ Update downloaded. Restart to apply.")
);

// Version
document.addEventListener("DOMContentLoaded", () => {
  const versionDisplay = document.getElementById("appVersion");
  if (versionDisplay) {
    window.electronAPI.getAppVersion().then((version) => {
      versionDisplay.textContent = version;
    });
  }
});

// Apply update
const applyUpdateBtn = document.getElementById("applyUpdateBtn");

window.addEventListener("update-downloaded", () => {
  showToast("✅ Update downloaded. Restart to apply.");
  applyUpdateBtn.hidden = false;
});

applyUpdateBtn.addEventListener("click", () => {
  window.electronAPI?.quitAndInstall?.();
});

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
    toggleTheme();
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
