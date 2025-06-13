const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const prioritySelect = document.getElementById("prioritySelect");
const taskList = document.getElementById("taskList");
const clearCompletedBtn = document.getElementById("clearCompleted");

let tasks = [];

// Load
async function loadTasks() {
  const saved = await window.electron.getTasks();
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

  div.appendChild(marker);
  div.appendChild(handle);
  div.appendChild(name);
  div.appendChild(spacer);
  div.appendChild(deleteBtn);

  return div;
}

// Clear completed tasks
clearCompletedBtn.addEventListener("click", () => {
  tasks = tasks.filter((t) => !t.completed);
  saveTasks();
  document.querySelectorAll(".task.completed").forEach((el) => el.remove());
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

themeToggleBtn.addEventListener("click", () => {
  const isLight = document.body.classList.toggle("light");
  localStorage.setItem("theme", isLight ? "light" : "dark");
  themeIcon.src = isLight ? "src/sun.svg" : "src/moon.svg";
});

// Initialize
applyTheme();
loadTasks();
