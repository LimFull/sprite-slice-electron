const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Existing APIs
  selectImages: () => ipcRenderer.invoke('select-images'),
  selectOutputFolder: () => ipcRenderer.invoke('select-output-folder'),
  getImageInfo: (imagePath) => ipcRenderer.invoke('get-image-info', imagePath),
  getImageDataUrl: (imagePath) => ipcRenderer.invoke('get-image-data-url', imagePath),
  sliceSprite: (options) => ipcRenderer.invoke('slice-sprite', options),
  batchSlice: (options) => ipcRenderer.invoke('batch-slice', options),
  generatePreview: (options) => ipcRenderer.invoke('generate-preview', options),
  openFolder: (folderPath) => ipcRenderer.invoke('open-folder', folderPath),

  // Tilemap APIs
  sliceForPalette: (options) => ipcRenderer.invoke('slice-for-palette', options),
  loadTilesFromFolder: () => ipcRenderer.invoke('load-tiles-from-folder'),
  exportTilemap: (options) => ipcRenderer.invoke('export-tilemap', options),
  loadBackgroundImage: () => ipcRenderer.invoke('load-background-image')
});
