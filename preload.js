const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectImages: () => ipcRenderer.invoke('select-images'),
  selectOutputFolder: () => ipcRenderer.invoke('select-output-folder'),
  getImageInfo: (imagePath) => ipcRenderer.invoke('get-image-info', imagePath),
  sliceSprite: (options) => ipcRenderer.invoke('slice-sprite', options),
  batchSlice: (options) => ipcRenderer.invoke('batch-slice', options),
  generatePreview: (options) => ipcRenderer.invoke('generate-preview', options),
  openFolder: (folderPath) => ipcRenderer.invoke('open-folder', folderPath)
});
