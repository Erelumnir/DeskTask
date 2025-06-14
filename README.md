# 🗂️ DeskTask

**DeskTask** is a sleek, local-first to-do list app built with Electron and React. Designed for speed, simplicity, and customization, DeskTask helps you stay productive and organized — without cloud dependencies or bloat.

---

## ✨ Features

- ✅ Clean and minimal interface  
- 🌓 Dark/Light mode toggle  
- 🧩 Custom title bar with logo and shortcuts  
- 📌 Priority indicators (Low/Med/High)  
- 🔁 Drag-and-drop task reordering  
- 🎯 Smooth task interactions (fade, swipe, animations)  
- 💾 File-based task storage (no localStorage)  
- 🗃️ Import/export task lists via `.json`  
- 🧼 Bulk actions (select, delete, clear completed)  
- ⌨️ Hotkeys & command shortcuts  
- ⚙️ Settings modal with manual tools  
- 🔔 Update notifications (auto-updater)  
- 💻 100% offline-capable  

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Erelumnir/DeskTask.git
cd DeskTask
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run the app
```bash
npm start
```

### 💡 For packaged builds, see the Releases page.


## 📁 File Structure
```php
DeskTask/
├── public/             # Static assets (logo, icons)
├── src/
│   ├── components/     # UI components
│   ├── data/           # Local task storage (tasks.json)
│   ├── main.js         # Electron main process
│   ├── App.jsx         # Root React app
├── package.json
├── electron-builder.yml
```

## 🧰 Development
### Build for production
```bash
npm run build
```
### Package app (Electron Builder)
```bash
npm run dist
```

## 🛠️ Hotkeys (Default)
| Action                 | Shortcut        |
|------------------------|-----------------|
| Add new task           | `Enter`         |
| Toggle theme           | `Ctrl/Cmd + D`  |
| Select all             | `Ctrl/Cmd + A`  |
| Delete selected tasks  | `Delete`        |
| Open settings modal    | `Ctrl/Cmd + ,`  |
| Open inspector         | `Ctrl/Cmd + I`  |

## 📷 Screenshots

## 🛡️ License
Copyright CodeLore 2025

Got feedback, ideas, or feature requests? Open an issue or reach out.

## 💬 About
Created by @Erelumnir as a fast, offline to-do companion for the desktop. No accounts, no sync, just focus.

“Productivity is remembering what to do and enjoying doing it.”
