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

// Get full-resolution image data URL (for frame preview canvas)
ipcMain.handle('get-image-data-url', async (event, imagePath) => {
  try {
    const metadata = await sharp(imagePath).metadata();
    const buffer = await sharp(imagePath).png().toBuffer();
    return {
      dataUrl: `data:image/png;base64,${buffer.toString('base64')}`,
      width: metadata.width,
      height: metadata.height
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
  const {
    imagePaths,
    columns,
    rows,
    outputFolder,
    baseName,
    useSequentialNumbering,
    frameOffsetsByPath = {},
    padding = { top: 0, right: 0, bottom: 0, left: 0 },
    imageOffset = { x: 0, y: 0 }
  } = options;

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
      startNumber: useSequentialNumbering ? currentNumber : 0,
      frameOffsets: frameOffsetsByPath[imagePath] || {},
      padding,
      imageOffset
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
  const {
    imagePath, columns, rows, outputFolder, baseName, startNumber = 0,
    frameOffsets = {},
    padding = { top: 0, right: 0, bottom: 0, left: 0 },
    imageOffset = { x: 0, y: 0 }
  } = options;

  try {
    const metadata = await sharp(imagePath).metadata();
    const imgW = metadata.width;
    const imgH = metadata.height;

    const padTop = padding.top || 0;
    const padRight = padding.right || 0;
    const padBottom = padding.bottom || 0;
    const padLeft = padding.left || 0;
    const offsetX = imageOffset.x || 0;
    const offsetY = imageOffset.y || 0;

    // Virtual canvas: positive padding extends, negative crops.
    const canvasW = Math.max(0, imgW + padLeft + padRight);
    const canvasH = Math.max(0, imgH + padTop + padBottom);
    // Where the original image is drawn on the canvas (image offset shifts further).
    const imageX = padLeft + offsetX;
    const imageY = padTop + offsetY;

    const frameWidth = columns > 0 ? Math.floor(canvasW / columns) : 0;
    const frameHeight = rows > 0 ? Math.floor(canvasH / rows) : 0;

    const results = [];
    let frameNumber = startNumber;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const frameIndex = row * columns + col;
        const offset = frameOffsets[frameIndex] || frameOffsets[String(frameIndex)];
        const dx = (offset && offset.dx) || 0;
        const dy = (offset && offset.dy) || 0;

        const outputName = `${baseName}_${String(frameNumber).padStart(3, '0')}.png`;
        const outputPath = path.join(outputFolder, outputName);

        if (frameWidth <= 0 || frameHeight <= 0) {
          await sharp({
            create: { width: 1, height: 1, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
          }).png().toFile(outputPath);
        } else {
          // Frame's region on virtual canvas.
          const frameCanvasX = col * frameWidth;
          const frameCanvasY = row * frameHeight;
          // Map to image-relative coords (where on the original image this frame's content comes from).
          const imgRelX = frameCanvasX - imageX;
          const imgRelY = frameCanvasY - imageY;

          // Clip to the original image's bounds.
          const srcL = Math.max(0, imgRelX);
          const srcT = Math.max(0, imgRelY);
          const srcR = Math.min(imgW, imgRelX + frameWidth);
          const srcB = Math.min(imgH, imgRelY + frameHeight);
          const srcW = srcR - srcL;
          const srcH = srcB - srcT;

          // Where the clipped piece goes on the output frame, before per-frame offset.
          const baseDestX = srcL - imgRelX;
          const baseDestY = srcT - imgRelY;
          // Apply per-frame offset (shifts image content within the frame).
          const finalDestX = baseDestX + dx;
          const finalDestY = baseDestY + dy;

          // Clip the placement to the frame's [0, frameW) × [0, frameH).
          const placeL = Math.max(0, finalDestX);
          const placeT = Math.max(0, finalDestY);
          const placeR = Math.min(frameWidth, finalDestX + srcW);
          const placeB = Math.min(frameHeight, finalDestY + srcH);

          const blank = sharp({
            create: { width: frameWidth, height: frameHeight, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
          });

          if (srcW > 0 && srcH > 0 && placeR > placeL && placeB > placeT) {
            const finalSrcL = srcL + (placeL - finalDestX);
            const finalSrcT = srcT + (placeT - finalDestY);
            const finalSrcW = placeR - placeL;
            const finalSrcH = placeB - placeT;

            const piece = await sharp(imagePath)
              .extract({ left: finalSrcL, top: finalSrcT, width: finalSrcW, height: finalSrcH })
              .png()
              .toBuffer();

            await blank
              .composite([{ input: piece, left: placeL, top: placeT }])
              .png()
              .toFile(outputPath);
          } else {
            await blank.png().toFile(outputPath);
          }
        }

        results.push({ frameNumber, outputPath, outputName });
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
  const { imagePath, columns, rows, padding = { top: 0, right: 0, bottom: 0, left: 0 } } = options;

  try {
    const metadata = await sharp(imagePath).metadata();

    const padTop = Math.max(0, padding.top || 0);
    const padRight = Math.max(0, padding.right || 0);
    const padBottom = Math.max(0, padding.bottom || 0);
    const padLeft = Math.max(0, padding.left || 0);

    const effectiveWidth = Math.max(0, metadata.width - padLeft - padRight);
    const effectiveHeight = Math.max(0, metadata.height - padTop - padBottom);
    const frameWidth = effectiveWidth > 0 ? Math.floor(effectiveWidth / columns) : 0;
    const frameHeight = effectiveHeight > 0 ? Math.floor(effectiveHeight / rows) : 0;

    // Resize image first to get exact dimensions for the SVG overlay
    const maxSize = 600;
    const scale = Math.min(maxSize / metadata.width, maxSize / metadata.height, 1);
    const previewWidth = Math.round(metadata.width * scale);
    const previewHeight = Math.round(metadata.height * scale);

    const resizedImage = await sharp(imagePath)
      .resize(previewWidth, previewHeight, { fit: 'fill' })
      .toBuffer();

    // Calculate scaled padding and effective grid area in preview coordinates
    const padTopS = padTop * scale;
    const padLeftS = padLeft * scale;
    const effectiveWidthS = effectiveWidth * scale;
    const effectiveHeightS = effectiveHeight * scale;
    const scaledFrameWidth = columns > 0 ? effectiveWidthS / columns : 0;
    const scaledFrameHeight = rows > 0 ? effectiveHeightS / rows : 0;

    const svgLines = [];

    // Padding overlay (semi-transparent dim area outside grid)
    if (padTop || padRight || padBottom || padLeft) {
      const dim = 'rgba(0, 0, 0, 0.45)';
      // top
      if (padTopS > 0) svgLines.push(`<rect x="0" y="0" width="${previewWidth}" height="${padTopS}" fill="${dim}"/>`);
      // bottom
      const bottomY = padTopS + effectiveHeightS;
      if (padBottom > 0) svgLines.push(`<rect x="0" y="${bottomY}" width="${previewWidth}" height="${previewHeight - bottomY}" fill="${dim}"/>`);
      // left
      if (padLeftS > 0) svgLines.push(`<rect x="0" y="${padTopS}" width="${padLeftS}" height="${effectiveHeightS}" fill="${dim}"/>`);
      // right
      const rightX = padLeftS + effectiveWidthS;
      if (padRight > 0) svgLines.push(`<rect x="${rightX}" y="${padTopS}" width="${previewWidth - rightX}" height="${effectiveHeightS}" fill="${dim}"/>`);
      // grid bounds outline
      svgLines.push(`<rect x="${padLeftS}" y="${padTopS}" width="${effectiveWidthS}" height="${effectiveHeightS}" fill="none" stroke="rgba(74, 222, 128, 0.9)" stroke-width="2"/>`);
    }

    if (effectiveWidthS > 0 && effectiveHeightS > 0) {
      const gridRight = padLeftS + effectiveWidthS;
      const gridBottom = padTopS + effectiveHeightS;
      // Vertical lines
      for (let i = 1; i < columns; i++) {
        const x = padLeftS + i * scaledFrameWidth;
        svgLines.push(`<line x1="${x}" y1="${padTopS}" x2="${x}" y2="${gridBottom}" stroke="rgba(255,0,100,0.8)" stroke-width="2"/>`);
      }
      // Horizontal lines
      for (let i = 1; i < rows; i++) {
        const y = padTopS + i * scaledFrameHeight;
        svgLines.push(`<line x1="${padLeftS}" y1="${y}" x2="${gridRight}" y2="${y}" stroke="rgba(255,0,100,0.8)" stroke-width="2"/>`);
      }
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
      totalFrames: columns * rows,
      effectiveWidth,
      effectiveHeight
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

// Batch resize images
ipcMain.handle('batch-resize', async (event, options) => {
  const { images, mode, ratioNumerator, ratioDenominator, fixedWidth, fixedHeight, outputFolder } = options;
  const results = [];

  for (const image of images) {
    try {
      const metadata = await sharp(image.path).metadata();
      const origW = metadata.width;
      const origH = metadata.height;
      let outW;
      let outH;

      if (mode === 'ratio') {
        const num = Math.max(1, ratioNumerator || 1);
        const den = Math.max(1, ratioDenominator || 1);
        outW = Math.max(1, Math.round((origW * num) / den));
        outH = Math.max(1, Math.round((origH * num) / den));
      } else if (mode === 'fixedWidth') {
        const targetW = Math.max(1, fixedWidth || 1);
        outW = targetW;
        outH = Math.max(1, Math.round((origH * targetW) / origW));
      } else if (mode === 'fixedHeight') {
        const targetH = Math.max(1, fixedHeight || 1);
        outH = targetH;
        outW = Math.max(1, Math.round((origW * targetH) / origH));
      } else {
        throw new Error(`Unknown resize mode: ${mode}`);
      }

      const outputPath = path.join(outputFolder, image.name);

      // Buffer first so output can safely overwrite input.
      const buffer = await sharp(image.path)
        .resize(outW, outH, { fit: 'fill', kernel: sharp.kernel.lanczos3 })
        .toBuffer();
      await fs.promises.writeFile(outputPath, buffer);

      results.push({
        fileName: image.name,
        success: true,
        originalWidth: origW,
        originalHeight: origH,
        outputWidth: outW,
        outputHeight: outH,
        outputPath
      });
    } catch (error) {
      results.push({
        fileName: image.name,
        success: false,
        error: error.message
      });
    }
  }

  return results;
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

// Load background image for tilemap
ipcMain.handle('load-background-image', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'bmp'] }
    ]
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { success: false, error: 'No file selected' };
  }

  const filePath = result.filePaths[0];
  try {
    const metadata = await sharp(filePath).metadata();
    const buffer = await sharp(filePath).png().toBuffer();
    return {
      success: true,
      dataUrl: `data:image/png;base64,${buffer.toString('base64')}`,
      width: metadata.width,
      height: metadata.height
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Export tilemap as PNG
ipcMain.handle('export-tilemap', async (event, options) => {
  const { grid, tiles, tileWidth, tileHeight, canvasWidth, canvasHeight, backgroundDataUrl } = options;

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

    // Build composite operations and create tile ID to index map
    const compositeOperations = [];
    const tileIdToIndex = new Map();
    tiles.forEach((tile, index) => {
      tileIdToIndex.set(tile.id, index);
    });

    // Build CSV data
    const csvRows = [];

    for (let y = 0; y < grid.length; y++) {
      const csvRow = [];
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
          // Add tile index to CSV row
          const tileIndex = tileIdToIndex.get(tileId);
          csvRow.push(tileIndex !== undefined ? tileIndex : 'x');
        } else {
          // Empty cell
          csvRow.push('x');
        }
      }
      csvRows.push(csvRow.join(','));
    }

    // Create base image (background or transparent)
    let baseImage;
    if (backgroundDataUrl) {
      const bgBase64 = backgroundDataUrl.replace(/^data:image\/\w+;base64,/, '');
      const bgBuffer = Buffer.from(bgBase64, 'base64');
      baseImage = sharp(bgBuffer).resize(width, height, { fit: 'fill' }).png();
    } else {
      baseImage = sharp({
        create: {
          width,
          height,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
      });
    }

    // Composite tiles on top
    if (compositeOperations.length > 0) {
      await baseImage
        .composite(compositeOperations)
        .png()
        .toFile(filePath);
    } else {
      await baseImage
        .png()
        .toFile(filePath);
    }

    // Save CSV file with the same name but .csv extension
    const csvFilePath = filePath.replace(/\.png$/i, '.csv');
    const csvContent = csvRows.join('\n');
    fs.writeFileSync(csvFilePath, csvContent, 'utf8');

    return { success: true, outputPath: filePath, csvPath: csvFilePath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
