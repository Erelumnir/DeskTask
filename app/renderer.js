const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const prioritySelect = document.getElementById("prioritySelect");
const taskList = document.getElementById("taskList");
const clearCompletedBtn = document.getElementById("clearCompleted");

let tasks = [];

// Load from localStorage
function loadTasks() {
  const saved = localStorage.getItem("tasks");
  tasks = saved ? JSON.parse(saved) : [];
  renderTasks();
}

// Save to localStorage
function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

// Add new task
taskForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = taskInput.value.trim();
  const priority = prioritySelect.value;

  if (!name) return;

  tasks.push({
    id: Date.now().toString(),
    name,
    priority,
    completed: false,
  });

  taskInput.value = "";
  renderTasks();
  saveTasks();
});

// Render all tasks
function renderTasks() {
  taskList.innerHTML = "";
  tasks.forEach((task) => {
    const div = document.createElement("div");
    div.className = `task ${task.completed ? "completed" : ""} ${
      task.priority
    }-priority`;

    const marker = document.createElement("div");
    marker.className = "marker";

    const name = document.createElement("div");
    name.className = "task-name";
    name.textContent = task.name;
    name.contentEditable = true;
    name.addEventListener("blur", () => {
      task.name = name.textContent.trim();
      saveTasks();
    });
    name.addEventListener("click", (e) => e.stopPropagation()); // allow editing without completing

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";

    const trashIcon = document.createElement("img");
    trashIcon.src = "src/trash.svg";
    trashIcon.alt = "Delete Task";

    deleteBtn.appendChild(trashIcon);
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();

      // Animate fade-out before removing
      div.classList.add("fade-out");

      setTimeout(() => {
        tasks = tasks.filter((t) => t.id !== task.id);
        saveTasks();
        renderTasks();
      }, 200); // matches the CSS transition
    });

    // Full task click toggles complete
    div.addEventListener("click", () => {
      task.completed = !task.completed;
      saveTasks();
      renderTasks();
    });

    div.appendChild(marker);
    div.appendChild(name);
    div.appendChild(deleteBtn);
    taskList.appendChild(div);
  });
}

// Clear completed
clearCompletedBtn.addEventListener("click", () => {
  tasks = tasks.filter((t) => !t.completed);
  saveTasks();
  renderTasks();
});

// Initialize
loadTasks();

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

applyTheme();
