const { app, BrowserWindow, ipcMain, dialog, protocol } = require("electron");
const path = require("path");
const fs   = require("fs");
const { Readable } = require("stream");

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
    icon: path.join(__dirname, "../imagens/maestro_logo.png"),
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
  // Serve local video files with full range-request support (required for <video> seeking)
  protocol.handle("local-video", async (request) => {
    let filePath = "";
    try {
      filePath = decodeURIComponent(request.url.slice("local-video:///".length));
      if (process.platform === "win32") filePath = filePath.replace(/\//g, "\\");

      const stat = fs.statSync(filePath);
      const fileSize = stat.size;

      const mimeMap = {
        ".mp4": "video/mp4", ".mov": "video/quicktime",
        ".avi": "video/x-msvideo", ".mkv": "video/x-matroska",
        ".webm": "video/webm", ".m4v": "video/x-m4v",
      };
      const contentType = mimeMap[path.extname(filePath).toLowerCase()] || "video/mp4";

      const range = request.headers.get("Range");
      if (range) {
        const [, s, e] = range.match(/bytes=(\d*)-(\d*)/) || [];
        const start = s ? parseInt(s, 10) : 0;
        const end   = e ? parseInt(e, 10) : fileSize - 1;
        return new Response(Readable.toWeb(fs.createReadStream(filePath, { start, end })), {
          status: 206,
          headers: {
            "Content-Type":   contentType,
            "Content-Range":  `bytes ${start}-${end}/${fileSize}`,
            "Accept-Ranges":  "bytes",
            "Content-Length": String(end - start + 1),
          },
        });
      }

      return new Response(Readable.toWeb(fs.createReadStream(filePath)), {
        status: 200,
        headers: {
          "Content-Type":   contentType,
          "Accept-Ranges":  "bytes",
          "Content-Length": String(fileSize),
        },
      });
    } catch (e) {
      console.error("local-video error:", filePath, e.message);
      return new Response("Not found", { status: 404 });
    }
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

  ipcMain.handle("export-pdf", async () => {
    const win = mainWindow || BrowserWindow.getFocusedWindow();
    try {
      const data = await win.webContents.printToPDF({ printBackground: true, landscape: true, pageSize: "A4" });
      const result = await dialog.showSaveDialog(win, {
        defaultPath: "maestro_relatorio.pdf",
        filters: [{ name: "PDF", extensions: ["pdf"] }],
      });
      if (!result.canceled && result.filePath) {
        fs.writeFileSync(result.filePath, data);
        return { success: true };
      }
      return { success: false };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

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
