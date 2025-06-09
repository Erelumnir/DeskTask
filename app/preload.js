const { contextBridge, ipcRenderer } = require("electron");
const { Titlebar } = require("custom-electron-titlebar");
const path = require("path");

window.addEventListener("DOMContentLoaded", () => {
  // Initialize custom titlebar
  const titlebar = new Titlebar({
    backgroundColor: "#1a1a24",
    icon: path.join(__dirname, "icon.png"),
    menu: null,
  });

  const container = document.querySelector(".cet-title-buttons");

  if (container) {
    // 🌙 Dark mode toggle
    const themeBtn = document.createElement("button");
    themeBtn.textContent =
      localStorage.getItem("darkMode") === "true" ? "☀️" : "🌙";
    themeBtn.title = "Toggle Dark Mode";
    themeBtn.style.cssText = `
      margin-right: 8px;
      background: transparent;
      border: none;
      color: #fff;
      cursor: pointer;
      font-size: 16px;
    `;
    themeBtn.onclick = () => {
      const isDark = document.body.classList.toggle("dark-mode");
      localStorage.setItem("darkMode", isDark);
      themeBtn.textContent = isDark ? "☀️" : "🌙";
    };

    // ☰ Options button
    const optionsBtn = document.createElement("button");
    optionsBtn.textContent = "☰ Options";
    optionsBtn.title = "App Options";
    optionsBtn.style.cssText = themeBtn.style.cssText;
    optionsBtn.onclick = () => alert("Options coming soon!");

    // ⌨️ Hotkeys button
    const hotkeysBtn = document.createElement("button");
    hotkeysBtn.textContent = "⌨️ Hotkeys";
    hotkeysBtn.title = "Show Keyboard Shortcuts";
    hotkeysBtn.style.cssText = themeBtn.style.cssText;
    hotkeysBtn.onclick = () =>
      alert(
        [
          "Hotkeys:",
          "Ctrl + N: Focus task input",
          "Ctrl + D: Delete selected task",
          "Ctrl + M: Toggle dark mode",
          "Ctrl + Shift + I: Open dev tools",
        ].join("\n")
      );

    container.prepend(themeBtn);
    container.prepend(hotkeysBtn);
    container.prepend(optionsBtn);
  }

  // Auto-apply dark mode on load
  if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark-mode");
  }
});

// Expose IPC safely
contextBridge.exposeInMainWorld("electron", {
  send: (channel, ...args) => {
    const validChannels = [
      "add-task",
      "toggle-task",
      "delete-task",
      "edit-task",
      "open-devtools",
      "delete-completed-tasks",
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, ...args);
    }
  },
  on: (channel, callback) => {
    const validChannels = ["tasks"];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => callback(event, ...args));
    }
  },
});
