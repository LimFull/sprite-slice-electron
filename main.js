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
        const outputName = `${baseName}${String(frameNumber).padStart(3, '0')}.png`;
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
        const outputName = `${baseName}${String(frameNumber).padStart(3, '0')}.png`;
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

    // Create SVG overlay with grid lines
    const svgLines = [];

    // Vertical lines
    for (let i = 1; i < columns; i++) {
      const x = i * frameWidth;
      svgLines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${metadata.height}" stroke="rgba(255,0,100,0.8)" stroke-width="2"/>`);
    }

    // Horizontal lines
    for (let i = 1; i < rows; i++) {
      const y = i * frameHeight;
      svgLines.push(`<line x1="0" y1="${y}" x2="${metadata.width}" y2="${y}" stroke="rgba(255,0,100,0.8)" stroke-width="2"/>`);
    }

    const svgOverlay = Buffer.from(`
      <svg width="${metadata.width}" height="${metadata.height}">
        ${svgLines.join('\n')}
      </svg>
    `);

    const composited = await sharp(imagePath)
      .composite([{
        input: svgOverlay,
        top: 0,
        left: 0
      }])
      .resize(600, 600, { fit: 'inside', withoutEnlargement: true })
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
