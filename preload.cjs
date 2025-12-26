const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // Dialog APIs
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),
  
  // File system APIs
  readDirectory: (dirPath) => ipcRenderer.invoke('read-directory', dirPath),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath, data) => ipcRenderer.invoke('write-file', filePath, data),
  deleteFile: (filePath) => ipcRenderer.invoke('delete-file', filePath),
  createDirectory: (dirPath) => ipcRenderer.invoke('create-directory', dirPath),
  deleteDirectory: (dirPath) => ipcRenderer.invoke('delete-directory', dirPath),
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  
  // Check if running in Electron
  isElectron: true,
  
  // Listen for menu events
  onMenuOpenFolder: (callback) => {
    ipcRenderer.on('menu-open-folder', callback);
  }
});
