const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#1a1a2e'
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers

// Select image files
ipcMain.handle('select-images', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'] }
    ]
  });
  return result.filePaths;
});

// Select output folder
ipcMain.handle('select-output-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory']
  });
  return result.filePaths[0];
});

// Get image info
ipcMain.handle('get-image-info', async (event, imagePath) => {
  try {
    const metadata = await sharp(imagePath).metadata();
    const buffer = await sharp(imagePath)
      .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
      .toBuffer();

    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      preview: `data:image/${metadata.format};base64,${buffer.toString('base64')}`
    };
  } catch (error) {
    throw new Error(`Failed to load image: ${error.message}`);
  }
});

// Slice sprite sheet
ipcMain.handle('slice-sprite', async (event, options) => {
  const { imagePath, columns, rows, outputFolder, baseName, startNumber = 0 } = options;

  try {
    const image = sharp(imagePath);
    const metadata = await image.metadata();

    const frameWidth = Math.floor(metadata.width / columns);
    const frameHeight = Math.floor(metadata.height / rows);

    const results = [];
    let frameNumber = startNumber;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const outputName = `${baseName}_${String(frameNumber).padStart(3, '0')}.png`;
        const outputPath = path.join(outputFolder, outputName);

        await sharp(imagePath)
          .extract({
            left: col * frameWidth,
            top: row * frameHeight,
            width: frameWidth,
            height: frameHeight
          })
          .toFile(outputPath);

        results.push({
          frameNumber,
          outputPath,
          outputName
        });

        frameNumber++;
      }
    }

    return {
      success: true,
      totalFrames: results.length,
      frameWidth,
      frameHeight,
      results,
      nextStartNumber: frameNumber
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

// Batch slice multiple sprites
ipcMain.handle('batch-slice', async (event, options) => {
  const { imagePaths, columns, rows, outputFolder, baseName, useSequentialNumbering } = options;

  const allResults = [];
  let currentNumber = 0;

  for (const imagePath of imagePaths) {
    const fileName = path.basename(imagePath, path.extname(imagePath));
    const name = baseName || fileName;

    const result = await sliceSingleSprite({
      imagePath,
      columns,
      rows,
      outputFolder,
      baseName: useSequentialNumbering ? baseName : name,
      startNumber: useSequentialNumbering ? currentNumber : 0
    });

    if (result.success) {
      currentNumber = result.nextStartNumber;
      allResults.push({
        imagePath,
        fileName,
        ...result
      });
    } else {
      allResults.push({
        imagePath,
        fileName,
        success: false,
        error: result.error
      });
    }
  }

  return allResults;
});

async function sliceSingleSprite(options) {
  const { imagePath, columns, rows, outputFolder, baseName, startNumber = 0 } = options;

  try {
    const image = sharp(imagePath);
    const metadata = await image.metadata();

    const frameWidth = Math.floor(metadata.width / columns);
    const frameHeight = Math.floor(metadata.height / rows);

    const results = [];
    let frameNumber = startNumber;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const outputName = `${baseName}_${String(frameNumber).padStart(3, '0')}.png`;
        const outputPath = path.join(outputFolder, outputName);

        await sharp(imagePath)
          .extract({
            left: col * frameWidth,
            top: row * frameHeight,
            width: frameWidth,
            height: frameHeight
          })
          .toFile(outputPath);

        results.push({
          frameNumber,
          outputPath,
          outputName
        });

        frameNumber++;
      }
    }

    return {
      success: true,
      totalFrames: results.length,
      frameWidth,
      frameHeight,
      results,
      nextStartNumber: frameNumber
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Generate preview with grid overlay
ipcMain.handle('generate-preview', async (event, options) => {
  const { imagePath, columns, rows } = options;

  try {
    const metadata = await sharp(imagePath).metadata();
    const frameWidth = Math.floor(metadata.width / columns);
    const frameHeight = Math.floor(metadata.height / rows);

    // Resize image first to get exact dimensions for the SVG overlay
    const maxSize = 600;
    const scale = Math.min(maxSize / metadata.width, maxSize / metadata.height, 1);
    const previewWidth = Math.round(metadata.width * scale);
    const previewHeight = Math.round(metadata.height * scale);

    const resizedImage = await sharp(imagePath)
      .resize(previewWidth, previewHeight, { fit: 'fill' })
      .toBuffer();

    // Create SVG overlay with grid lines at the preview size
    const svgLines = [];
    const scaledFrameWidth = previewWidth / columns;
    const scaledFrameHeight = previewHeight / rows;

    // Vertical lines
    for (let i = 1; i < columns; i++) {
      const x = Math.round(i * scaledFrameWidth);
      svgLines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${previewHeight}" stroke="rgba(255,0,100,0.8)" stroke-width="2"/>`);
    }

    // Horizontal lines
    for (let i = 1; i < rows; i++) {
      const y = Math.round(i * scaledFrameHeight);
      svgLines.push(`<line x1="0" y1="${y}" x2="${previewWidth}" y2="${y}" stroke="rgba(255,0,100,0.8)" stroke-width="2"/>`);
    }

    const svgOverlay = Buffer.from(
      `<svg width="${previewWidth}" height="${previewHeight}">${svgLines.join('')}</svg>`
    );

    const composited = await sharp(resizedImage)
      .composite([{
        input: svgOverlay,
        top: 0,
        left: 0
      }])
      .toBuffer();

    return {
      preview: `data:image/png;base64,${composited.toString('base64')}`,
      frameWidth,
      frameHeight,
      totalFrames: columns * rows
    };
  } catch (error) {
    throw new Error(`Failed to generate preview: ${error.message}`);
  }
});

// Open folder in file explorer
ipcMain.handle('open-folder', async (event, folderPath) => {
  const { shell } = require('electron');
  shell.openPath(folderPath);
});

// =============================================
// Tilemap Feature - IPC Handlers
// =============================================

// Slice sprite to palette (returns data URLs, no file saving)
ipcMain.handle('slice-for-palette', async (event, options) => {
  const { imagePath, columns, rows } = options;

  try {
    const metadata = await sharp(imagePath).metadata();
    const tileWidth = Math.floor(metadata.width / columns);
    const tileHeight = Math.floor(metadata.height / rows);

    const tiles = [];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const buffer = await sharp(imagePath)
          .extract({
            left: col * tileWidth,
            top: row * tileHeight,
            width: tileWidth,
            height: tileHeight
          })
          .png()
          .toBuffer();

        tiles.push({
          dataUrl: `data:image/png;base64,${buffer.toString('base64')}`,
          col,
          row,
          index: row * columns + col
        });
      }
    }

    return {
      success: true,
      tiles,
      tileWidth,
      tileHeight,
      totalTiles: tiles.length
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Load tiles from folder
ipcMain.handle('load-tiles-from-folder', async (event) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { success: false, error: 'No folder selected' };
  }

  const folderPath = result.filePaths[0];

  try {
    const files = fs.readdirSync(folderPath)
      .filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f))
      .sort((a, b) => {
        // Sort by number in filename if present
        const numA = parseInt(a.match(/\d+/)?.[0] || '0');
        const numB = parseInt(b.match(/\d+/)?.[0] || '0');
        return numA - numB;
      });

    if (files.length === 0) {
      return { success: false, error: 'No image files found in folder' };
    }

    const tiles = [];
    let tileWidth = 0;
    let tileHeight = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const filePath = path.join(folderPath, file);
      const metadata = await sharp(filePath).metadata();
      const buffer = await sharp(filePath).png().toBuffer();

      if (i === 0) {
        tileWidth = metadata.width;
        tileHeight = metadata.height;
      }

      tiles.push({
        name: file,
        dataUrl: `data:image/png;base64,${buffer.toString('base64')}`,
        width: metadata.width,
        height: metadata.height,
        sourcePath: filePath,
        index: i
      });
    }

    return {
      success: true,
      tiles,
      tileWidth,
      tileHeight,
      totalTiles: tiles.length
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Export tilemap as PNG
ipcMain.handle('export-tilemap', async (event, options) => {
  const { grid, tiles, tileWidth, tileHeight, canvasWidth, canvasHeight } = options;

  try {
    // Show save dialog
    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Export Tilemap',
      defaultPath: 'tilemap.png',
      filters: [{ name: 'PNG Image', extensions: ['png'] }]
    });

    if (!filePath) {
      return { success: false, error: 'No file selected' };
    }

    // Calculate output dimensions
    const width = canvasWidth * tileWidth;
    const height = canvasHeight * tileHeight;

    // Build composite operations
    const compositeOperations = [];

    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        const tileId = grid[y][x];
        if (tileId !== null && tileId !== undefined) {
          const tile = tiles.find(t => t.id === tileId);
          if (tile && tile.dataUrl) {
            // Extract base64 data from data URL
            const base64Data = tile.dataUrl.replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');

            compositeOperations.push({
              input: buffer,
              left: x * tileWidth,
              top: y * tileHeight
            });
          }
        }
      }
    }

    // Create transparent background and composite tiles
    await sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
      .composite(compositeOperations)
      .png()
      .toFile(filePath);

    return { success: true, outputPath: filePath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
