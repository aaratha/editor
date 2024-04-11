import { app, BrowserWindow, ipcMain, dialog, shell } from "electron";
import path from "node:path";
import fs from "node:fs";
import Store from "electron-store";


    
    
const store = new Store();

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.js
// │
process.env.DIST = path.join(__dirname, "../dist");
process.env.VITE_PUBLIC = app.isPackaged
  ? process.env.DIST
  : path.join(process.env.DIST, "../public");

let win: BrowserWindow | null;
// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];

function createWindow() {
  win = new BrowserWindow({
    autoHideMenuBar: true,
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
    ...(process.platform === "win32" && {
      backgroundMaterial: "acrylic",
    }),
    // Use vibrancy for macOS
    ...(process.platform === "darwin" && {
      vibrancy: "hud", // Choose the type of vibrancy effect. Example: 'sidebar', 'under-window', etc.
      visualEffectState: "active",
      titleBarStyle: "hidden",
    }),
  });

  win.webContents.openDevTools({ mode: "undocked" });

    win.webContents.on('zoom-changed', function(event, url){
    event.preventDefault();
    open(url);
  });

  // Test active push message to Renderer-process.
  win.webContents.on("did-finish-load", () => {
    win?.hide();
    win?.show();
    win?.webContents.send("main-process-message", new Date().toLocaleString());

  win?.webContents.setWindowOpenHandler((details) => {
  shell.openExternal(details.url); // Open URL in user's browser.
  return { action: "deny" }; // Prevent the app from opening the URL.
})

  function openDirectoryDialog(event) {
    dialog
      .showOpenDialog(win, {
        properties: ["openDirectory"],
      })
      .then((result) => {
        if (!result.canceled) {
          const selectedPath = result.filePaths[0];
          // Save the selected path
          store.set("lastOpenedDirectory", selectedPath);
          // Send the selected path back to the renderer process
          event.sender.send("selected-directory", selectedPath);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }
  ipcMain.on("get-org-file-content", (event, orgFilePath) => {
    fs.readFile(orgFilePath, "utf8", (err, data) => {
      if (err) {
        console.error("Failed to read .org file", err);
        return;
      }
      event.sender.send("org-file-content", data);
    });
  });

  ipcMain.on("open-directory-dialog", (event) => {
    openDirectoryDialog(event);
  });

  ipcMain.on("get-org-files", (event, directoryPath) => {
    fs.readdir(directoryPath, (err, files) => {
      if (err) {
        console.error(err);
        return;
      }
      const orgFiles = files
        .filter((file) => path.extname(file) === ".org")
        .map((file) => ({
          path: path.join(directoryPath, file),
          title: path.basename(file),
        })); // Include the full path and the title
      event.sender.send("org-files", orgFiles);
    });
  });

  if (VITE_DEV_SERVER_URL) {
    win?.loadURL(VITE_DEV_SERVER_URL);
  } else {
    // win.loadFile('dist/index.html')
    win?.loadFile(path.join(process.env.DIST, "index.html"));
  }
}}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(() => {
  const lastOpenedDirectory = store.get("lastOpenedDirectory");
  if (lastOpenedDirectory) {
    win?.webContents.send("selected-directory", lastOpenedDirectory);
  }
  createWindow();
});

win?.webContents.on("new-window", function(event, url) {
  event.preventDefault();
  shell.openExternal(url);
});