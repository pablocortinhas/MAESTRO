const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  openVideoFile:    ()  => ipcRenderer.invoke("open-video-dialog"),
  openVideoWindow:  ()  => ipcRenderer.invoke("open-video-window"),
  getVideoPath:     ()  => ipcRenderer.invoke("get-video-path"),
  toggleFullscreen: ()  => ipcRenderer.invoke("toggle-fullscreen"),
  getImagensDir:    ()  => ipcRenderer.invoke("get-imagens-dir"),
  loadSquadsXlsx:   ()  => ipcRenderer.invoke("load-squads-xlsx"),
  onVideoPathChanged: (cb) => {
    const handler = (_, p) => cb(p);
    ipcRenderer.on("video-path-changed", handler);
    return () => ipcRenderer.removeListener("video-path-changed", handler);
  },
});
