const { app, BrowserWindow, ipcMain, dialog, protocol } = require("electron");
const path = require("path");

let mainWindow  = null;
let videoWindow = null;
let currentVideoPath = null;

// Must be called before app.whenReady()
protocol.registerSchemesAsPrivileged([
  { scheme: "local-video", privileges: { secure: true, standard: true, stream: true, bypassCSP: true } },
]);

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.maximize();

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  mainWindow.on("closed", () => { mainWindow = null; });
}

function createVideoWindow() {
  if (videoWindow && !videoWindow.isDestroyed()) {
    videoWindow.focus();
    if (currentVideoPath) {
      videoWindow.webContents.send("video-path-changed", currentVideoPath);
    }
    return;
  }

  videoWindow = new BrowserWindow({
    width: 960,
    height: 620,
    minWidth: 400,
    minHeight: 300,
    title: "Maestro — Vídeo",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    videoWindow.loadURL(process.env.VITE_DEV_SERVER_URL + "#video-popup");
  } else {
    videoWindow.loadFile(path.join(__dirname, "../dist/index.html"), { hash: "video-popup" });
  }

  videoWindow.on("closed", () => { videoWindow = null; });
}

app.whenReady().then(() => {
  // Serve local files via local-video:///absolute/path
  protocol.registerFileProtocol("local-video", (req, callback) => {
    const filePath = decodeURIComponent(req.url.slice("local-video:///".length));
    callback({ path: filePath });
  });

  createWindow();

  // ── IPC handlers ──────────────────────────────────────────
  ipcMain.handle("open-video-dialog", async () => {
    const win = mainWindow || BrowserWindow.getFocusedWindow();
    const result = await dialog.showOpenDialog(win, {
      properties: ["openFile"],
      filters: [{ name: "Vídeo", extensions: ["mp4", "mov", "avi", "mkv", "webm", "m4v"] }],
    });
    if (result.canceled || !result.filePaths.length) return null;
    currentVideoPath = result.filePaths[0];
    if (videoWindow && !videoWindow.isDestroyed()) {
      videoWindow.webContents.send("video-path-changed", currentVideoPath);
    }
    return currentVideoPath;
  });

  ipcMain.handle("open-video-window", () => {
    createVideoWindow();
    return true;
  });

  ipcMain.handle("get-video-path", () => currentVideoPath);

  ipcMain.handle("get-imagens-dir", () => path.join(__dirname, "../imagens"));

  // Lê a planilha 2026_Dados_Cadastrais_Base.xlsx em tempo real e retorna os elencos
  ipcMain.handle("load-squads-xlsx", () => {
    try {
      const XLSX   = require("xlsx");
      const fs     = require("fs");
      const xlPath = path.join(__dirname, "../2026_Dados_Cadastrais_Base.xlsx");
      if (!fs.existsSync(xlPath)) return null;

      const wb   = XLSX.readFile(xlPath);
      const ws   = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws);

      function normPos(raw) {
        if (!raw) return "Volante";
        const p = raw.trim().toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
        if (p.includes("GOLEIRO"))                         return "Goleiro";
        if (p.includes("ZAGUEIRO"))                        return "Zagueiro";
        if (p.includes("LATERAL") && p.includes("DIR"))   return "Lateral Direito";
        if (p.includes("LATERAL") && p.includes("ESQ"))   return "Lateral Esquerdo";
        if (p === "LATERAL")                               return "Lateral Direito";
        if (p.includes("VOLANTE") || p === "FIXO")        return "Volante";
        if (p.includes("MEIA"))                            return "Meia";
        if (p.includes("PONTA") || p === "ALA")           return "Ponta";
        if (p.includes("ATACANTE") || p === "PIVO" || p === "PIVÔ") return "Atacante";
        return "Volante";
      }

      function normCat(raw) {
        if (!raw) return null;
        const c = String(raw).trim().toLowerCase().replace(/\s+/g, "");
        const m = c.match(/sub(\d+)/);
        if (m) return `Sub ${String(parseInt(m[1])).padStart(2, "0")}`;
        if (c === "profissional") return "Profissional";
        if (c === "feminino")     return "Feminino";
        return null;
      }

      const grouped = {};
      rows.forEach(row => {
        const cat = normCat(row["Categoria"]);
        if (!cat) return;
        const athleteId = String(row["ID do Atleta"] || "").trim();
        const name      = String(row["Nome"]         || "").trim();
        const nickname  = String(row["Apelido"]      || "").trim() || name.split(" ")[0];
        const pos       = normPos(row["Posição"]);
        if (!name && !athleteId) return;
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push({ athleteId, name, nickname, pos });
      });

      return grouped;
    } catch (e) {
      console.error("load-squads-xlsx:", e.message);
      return null;
    }
  });

  ipcMain.handle("toggle-fullscreen", () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) win.setFullScreen(!win.isFullScreen());
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
