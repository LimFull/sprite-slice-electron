// State
const state = {
  images: [],
  selectedImageIndex: -1,
  outputFolder: null,
  zoom: {
    scale: 1,
    minScale: 0.5,
    maxScale: 5,
    step: 0.25,
    panX: 0,
    panY: 0,
    isDragging: false,
    startX: 0,
    startY: 0
  },
  // Tilemap feature
  mode: 'slice', // 'slice' | 'tilemap'
  slicedTiles: [], // { id, name, dataUrl, width, height, index }
  paletteViewMode: 'grid', // 'grid' | 'list'
  tilemap: {
    canvasWidth: 16,
    canvasHeight: 16,
    tileWidth: 32,
    tileHeight: 32,
    grid: [], // 2D array: grid[y][x] = tileId | null
    selectedTileId: null,
    isErasing: false,
    zoom: {
      scale: 1,
      minScale: 0.25,
      maxScale: 4,
      step: 0.25,
      panX: 0,
      panY: 0,
      isDragging: false,
      startX: 0,
      startY: 0
    },
    isPanMode: false,
    backgroundImage: null // { dataUrl, width, height }
  },
  // Frame Preview feature
  framePreview: {
    active: false,
    currentFrameIndex: 0,
    totalFrames: 0,
    columns: 0,
    rows: 0,
    frameWidth: 0,
    frameHeight: 0,
    sourceImage: null,
    sourceImagePath: null
  },
  // Per-image frame offsets: { [imagePath]: { [frameIndex]: { dx, dy } } }
  frameOffsets: {},
  // Image padding (signed): positive extends canvas, negative crops it
  padding: { top: 0, right: 0, bottom: 0, left: 0 },
  // Image position offset on the padded canvas (set via arrow keys in Preview Grid)
  imageOffset: { x: 0, y: 0 },
  // Cache of full-resolution HTMLImageElement for the currently-shown image
  previewImageCache: null, // { path, image }
  // Resize feature
  resize: {
    mode: 'ratio', // 'ratio' | 'fixedWidth' | 'fixedHeight'
    ratioNum: 1,
    ratioDen: 2,
    fixedWidth: 128,
    fixedHeight: 128,
    outputFolder: null
  }
};

// DOM Elements
const elements = {
  dropZone: document.getElementById('dropZone'),
  selectImagesBtn: document.getElementById('selectImagesBtn'),
  imageList: document.getElementById('imageList'),
  columns: document.getElementById('columns'),
  rows: document.getElementById('rows'),
  totalFrames: document.getElementById('totalFrames'),
  padTop: document.getElementById('padTop'),
  padRight: document.getElementById('padRight'),
  padBottom: document.getElementById('padBottom'),
  padLeft: document.getElementById('padLeft'),
  baseName: document.getElementById('baseName'),
  baseNameGroup: document.getElementById('baseNameGroup'),
  perFileNumbering: document.getElementById('perFileNumbering'),
  sequentialNumbering: document.getElementById('sequentialNumbering'),
  selectOutputBtn: document.getElementById('selectOutputBtn'),
  outputPath: document.getElementById('outputPath'),
  previewBtn: document.getElementById('previewBtn'),
  framePreviewBtn: document.getElementById('framePreviewBtn'),
  sliceBtn: document.getElementById('sliceBtn'),
  previewContainer: document.getElementById('previewContainer'),
  previewInfo: document.getElementById('previewInfo'),
  progressModal: document.getElementById('progressModal'),
  progressFill: document.getElementById('progressFill'),
  progressText: document.getElementById('progressText'),
  resultModal: document.getElementById('resultModal'),
  resultTitle: document.getElementById('resultTitle'),
  resultSummary: document.getElementById('resultSummary'),
  openFolderBtn: document.getElementById('openFolderBtn'),
  closeResultBtn: document.getElementById('closeResultBtn'),
  zoomControls: document.getElementById('zoomControls'),
  zoomInBtn: document.getElementById('zoomInBtn'),
  zoomOutBtn: document.getElementById('zoomOutBtn'),
  zoomResetBtn: document.getElementById('zoomResetBtn'),
  zoomLevel: document.getElementById('zoomLevel'),
  // Mode tabs
  modeSlice: document.getElementById('modeSlice'),
  modeTilemap: document.getElementById('modeTilemap'),
  modeResize: document.getElementById('modeResize'),
  mainContent: document.querySelector('.main-content'),
  sliceSettings: document.getElementById('sliceSettings'),
  resizeSettings: document.getElementById('resizeSettings'),
  // Resize mode controls
  resizeModeContent: document.getElementById('resizeModeContent'),
  resizePreviewContainer: document.getElementById('resizePreviewContainer'),
  resizePreviewInfo: document.getElementById('resizePreviewInfo'),
  resizeBatchSummary: document.getElementById('resizeBatchSummary'),
  resizeModeRatio: document.getElementById('resizeModeRatio'),
  resizeModeFixedWidth: document.getElementById('resizeModeFixedWidth'),
  resizeModeFixedHeight: document.getElementById('resizeModeFixedHeight'),
  resizeRatioGroup: document.getElementById('resizeRatioGroup'),
  resizeFixedWidthGroup: document.getElementById('resizeFixedWidthGroup'),
  resizeFixedHeightGroup: document.getElementById('resizeFixedHeightGroup'),
  ratioPresets: document.getElementById('ratioPresets'),
  ratioNum: document.getElementById('ratioNum'),
  ratioDen: document.getElementById('ratioDen'),
  resizeFixedWidth: document.getElementById('resizeFixedWidth'),
  resizeFixedHeight: document.getElementById('resizeFixedHeight'),
  resizeOutputFolderBtn: document.getElementById('resizeOutputFolderBtn'),
  resizeOutputPath: document.getElementById('resizeOutputPath'),
  resizeBtn: document.getElementById('resizeBtn'),
  // Slice mode content
  sliceModeContent: document.getElementById('sliceModeContent'),
  sliceToPaletteBtn: document.getElementById('sliceToPaletteBtn'),
  // Tilemap mode content
  tilemapModeContent: document.getElementById('tilemapModeContent'),
  palettePanel: document.getElementById('palettePanel'),
  tilePalette: document.getElementById('tilePalette'),
  paletteCount: document.getElementById('paletteCount'),
  tileSizeInfo: document.getElementById('tileSizeInfo'),
  loadTilesBtn: document.getElementById('loadTilesBtn'),
  eraserBtn: document.getElementById('eraserBtn'),
  paletteViewToggle: document.getElementById('paletteViewToggle'),
  // Tilemap canvas
  tilemapCanvas: document.getElementById('tilemapCanvas'),
  tilemapCanvasContainer: document.getElementById('tilemapCanvasContainer'),
  tilemapCanvasWrapper: document.getElementById('tilemapCanvasWrapper'),
  canvasColumns: document.getElementById('canvasColumns'),
  canvasRows: document.getElementById('canvasRows'),
  resizeCanvasBtn: document.getElementById('resizeCanvasBtn'),
  clearCanvasBtn: document.getElementById('clearCanvasBtn'),
  exportTilemapBtn: document.getElementById('exportTilemapBtn'),
  tilemapInfo: document.getElementById('tilemapInfo'),
  // Tilemap zoom
  tilemapZoomInBtn: document.getElementById('tilemapZoomInBtn'),
  tilemapZoomOutBtn: document.getElementById('tilemapZoomOutBtn'),
  tilemapZoomResetBtn: document.getElementById('tilemapZoomResetBtn'),
  tilemapZoomLevel: document.getElementById('tilemapZoomLevel'),
  tilemapPanBtn: document.getElementById('tilemapPanBtn'),
  loadBgBtn: document.getElementById('loadBgBtn'),
  clearBgBtn: document.getElementById('clearBgBtn')
};

// Initialize
function init() {
  setupEventListeners();
  updateUI();
  syncRatioPresetActive();
}

// Event Listeners
function setupEventListeners() {
  elements.selectImagesBtn.addEventListener('click', handleSelectImages);
  elements.selectOutputBtn.addEventListener('click', handleSelectOutput);
  elements.previewBtn.addEventListener('click', handlePreview);
  elements.framePreviewBtn.addEventListener('click', handleFramePreview);
  elements.sliceBtn.addEventListener('click', handleSlice);
  elements.columns.addEventListener('input', handleGridInputChange);
  elements.rows.addEventListener('input', handleGridInputChange);
  elements.padTop.addEventListener('input', handlePaddingInputChange);
  elements.padRight.addEventListener('input', handlePaddingInputChange);
  elements.padBottom.addEventListener('input', handlePaddingInputChange);
  elements.padLeft.addEventListener('input', handlePaddingInputChange);
  elements.openFolderBtn.addEventListener('click', handleOpenFolder);
  elements.closeResultBtn.addEventListener('click', () => {
    elements.resultModal.classList.add('hidden');
  });

  // Numbering mode change
  elements.perFileNumbering.addEventListener('change', handleNumberingModeChange);
  elements.sequentialNumbering.addEventListener('change', handleNumberingModeChange);
  handleNumberingModeChange(); // Initialize

  // Drag and drop support
  setupDragAndDrop();

  // Zoom controls
  elements.zoomInBtn.addEventListener('click', handleZoomIn);
  elements.zoomOutBtn.addEventListener('click', handleZoomOut);
  elements.zoomResetBtn.addEventListener('click', handleZoomReset);

  // Preview container drag/pan
  elements.previewContainer.addEventListener('mousedown', handlePanStart);
  elements.previewContainer.addEventListener('mousemove', handlePanMove);
  elements.previewContainer.addEventListener('mouseup', handlePanEnd);
  elements.previewContainer.addEventListener('mouseleave', handlePanEnd);

  // Frame preview navigation by click
  elements.previewContainer.addEventListener('click', handlePreviewContainerClick);
  window.addEventListener('resize', () => {
    if (state.framePreview.active) updateFramePreviewSize();
    else if (elements.previewContainer.classList.contains('zoomable')) renderGridPreview();
  });

  // Mouse wheel zoom
  elements.previewContainer.addEventListener('wheel', handleWheelZoom);

  // Mode tabs
  elements.modeSlice.addEventListener('click', () => handleModeChange('slice'));
  elements.modeTilemap.addEventListener('click', () => handleModeChange('tilemap'));
  elements.modeResize.addEventListener('click', () => handleModeChange('resize'));

  // Resize feature
  elements.resizeModeRatio.addEventListener('change', () => handleResizeModeChange('ratio'));
  elements.resizeModeFixedWidth.addEventListener('change', () => handleResizeModeChange('fixedWidth'));
  elements.resizeModeFixedHeight.addEventListener('change', () => handleResizeModeChange('fixedHeight'));
  elements.ratioPresets.addEventListener('click', handleRatioPresetClick);
  elements.ratioNum.addEventListener('input', () => {
    state.resize.ratioNum = Math.max(1, parseInt(elements.ratioNum.value) || 1);
    syncRatioPresetActive();
    refreshResizePreview();
  });
  elements.ratioDen.addEventListener('input', () => {
    state.resize.ratioDen = Math.max(1, parseInt(elements.ratioDen.value) || 1);
    syncRatioPresetActive();
    refreshResizePreview();
  });
  elements.resizeFixedWidth.addEventListener('input', () => {
    state.resize.fixedWidth = Math.max(1, parseInt(elements.resizeFixedWidth.value) || 1);
    refreshResizePreview();
  });
  elements.resizeFixedHeight.addEventListener('input', () => {
    state.resize.fixedHeight = Math.max(1, parseInt(elements.resizeFixedHeight.value) || 1);
    refreshResizePreview();
  });
  elements.resizeOutputFolderBtn.addEventListener('click', handleResizeOutputFolder);
  elements.resizeBtn.addEventListener('click', handleResize);

  // Tilemap feature
  elements.sliceToPaletteBtn.addEventListener('click', handleSliceToPalette);
  elements.loadTilesBtn.addEventListener('click', handleLoadTilesFromFolder);
  elements.eraserBtn.addEventListener('click', handleEraserToggle);
  elements.paletteViewToggle.addEventListener('click', handlePaletteViewToggle);
  elements.resizeCanvasBtn.addEventListener('click', handleResizeCanvas);
  elements.clearCanvasBtn.addEventListener('click', handleClearCanvas);
  elements.exportTilemapBtn.addEventListener('click', handleExportTilemap);
  elements.loadBgBtn.addEventListener('click', handleLoadBackground);
  elements.clearBgBtn.addEventListener('click', handleClearBackground);

  // Tilemap zoom controls
  elements.tilemapZoomInBtn.addEventListener('click', handleTilemapZoomIn);
  elements.tilemapZoomOutBtn.addEventListener('click', handleTilemapZoomOut);
  elements.tilemapZoomResetBtn.addEventListener('click', handleTilemapZoomReset);
  elements.tilemapPanBtn.addEventListener('click', handleTilemapPanToggle);

  // Tilemap canvas events
  setupTilemapCanvasEvents();

  // Keyboard shortcuts
  document.addEventListener('keydown', handleKeyDown);
}

// Drag and drop setup
function setupDragAndDrop() {
  const dropZone = elements.dropZone;
  let dragCounter = 0;

  // Prevent default behavior for the entire document
  document.body.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });

  document.body.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });

  // Drop zone specific events
  dropZone.addEventListener('dragenter', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter++;
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter--;
    if (dragCounter === 0) {
      dropZone.classList.remove('drag-over');
    }
  });

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter = 0;
    dropZone.classList.remove('drag-over');
    handleDrop(e);
  });

  // Click on drop zone (outside button) also opens file dialog
  dropZone.addEventListener('click', (e) => {
    if (e.target === dropZone || e.target.closest('.drop-zone-content') && !e.target.closest('.btn')) {
      handleSelectImages();
    }
  });
}

// Handlers
async function handleSelectImages() {
  const filePaths = await window.electronAPI.selectImages();
  if (filePaths.length > 0) {
    await addImages(filePaths);
  }
}

async function handleDrop(e) {
  e.preventDefault();
  e.stopPropagation();

  const files = Array.from(e.dataTransfer.files);
  const imagePaths = files
    .filter(f => /\.(png|jpe?g|webp|gif|bmp)$/i.test(f.name))
    .map(f => f.path);

  if (imagePaths.length > 0) {
    await addImages(imagePaths);
  }
}

async function addImages(filePaths) {
  for (const filePath of filePaths) {
    if (!state.images.find(img => img.path === filePath)) {
      try {
        const info = await window.electronAPI.getImageInfo(filePath);
        state.images.push({
          path: filePath,
          name: filePath.split('/').pop().split('\\').pop(),
          ...info
        });
      } catch (error) {
        console.error(`Failed to load ${filePath}:`, error);
      }
    }
  }

  if (state.images.length > 0 && state.selectedImageIndex === -1) {
    state.selectedImageIndex = 0;
  }

  updateUI();
  showSelectedImagePreview();
}

async function handleSelectOutput() {
  const folderPath = await window.electronAPI.selectOutputFolder();
  if (folderPath) {
    state.outputFolder = folderPath;
    elements.outputPath.textContent = folderPath;
    updateUI();
  }
}

function handleGridChange() {
  const cols = parseInt(elements.columns.value) || 1;
  const rows = parseInt(elements.rows.value) || 1;
  elements.totalFrames.textContent = cols * rows;
}

function handleGridInputChange() {
  handleGridChange();
  invalidateFrameOffsets();
}

function invalidateFrameOffsets() {
  if (Object.keys(state.frameOffsets).length > 0) {
    state.frameOffsets = {};
  }
  if (state.framePreview.active) {
    // Re-init frame preview so columns/rows changes are picked up.
    handleFramePreview();
  } else if (elements.previewContainer.classList.contains('zoomable')) {
    renderGridPreview();
  }
}

function handlePaddingInputChange() {
  state.padding.top = parseInt(elements.padTop.value) || 0;
  state.padding.right = parseInt(elements.padRight.value) || 0;
  state.padding.bottom = parseInt(elements.padBottom.value) || 0;
  state.padding.left = parseInt(elements.padLeft.value) || 0;
  applyPaddingChange();
}

function syncPaddingInputs() {
  elements.padTop.value = state.padding.top;
  elements.padRight.value = state.padding.right;
  elements.padBottom.value = state.padding.bottom;
  elements.padLeft.value = state.padding.left;
}

function applyPaddingChange() {
  // Padding changes shift frame boundaries — drop per-frame offsets so they don't misalign.
  if (Object.keys(state.frameOffsets).length > 0) {
    state.frameOffsets = {};
  }
  refreshActivePreview();
}

function refreshActivePreview() {
  if (state.framePreview.active) {
    refreshFramePreviewDims();
  } else if (elements.previewContainer.classList.contains('zoomable')) {
    renderGridPreview();
  }
}

function refreshFramePreviewDims() {
  const fp = state.framePreview;
  if (!fp.active || !fp.sourceImage) return;

  const imgW = fp.sourceImage.naturalWidth;
  const imgH = fp.sourceImage.naturalHeight;
  const padTop = state.padding.top;
  const padRight = state.padding.right;
  const padBottom = state.padding.bottom;
  const padLeft = state.padding.left;
  const offsetX = state.imageOffset.x;
  const offsetY = state.imageOffset.y;

  const canvasW = Math.max(0, imgW + padLeft + padRight);
  const canvasH = Math.max(0, imgH + padTop + padBottom);
  fp.imageX = padLeft + offsetX;
  fp.imageY = padTop + offsetY;
  fp.frameWidth = fp.columns > 0 ? Math.floor(canvasW / fp.columns) : 0;
  fp.frameHeight = fp.rows > 0 ? Math.floor(canvasH / fp.rows) : 0;

  const canvas = elements.previewContainer.querySelector('.frame-preview-canvas');
  if (canvas) {
    canvas.width = Math.max(1, fp.frameWidth);
    canvas.height = Math.max(1, fp.frameHeight);
    updateFramePreviewSize();
  }
  renderCurrentFrame();
  updateFramePreviewInfo();
}

async function ensureImageCache(imagePath) {
  if (state.previewImageCache && state.previewImageCache.path === imagePath) {
    return state.previewImageCache.image;
  }
  const result = await window.electronAPI.getImageDataUrl(imagePath);
  return await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      state.previewImageCache = { path: imagePath, image: img };
      resolve(img);
    };
    img.onerror = () => reject(new Error('Failed to load image data'));
    img.src = result.dataUrl;
  });
}

function handleNumberingModeChange() {
  const isSequential = elements.sequentialNumbering.checked;
  if (isSequential) {
    elements.baseNameGroup.classList.add('required');
    elements.baseName.placeholder = 'sprite (required)';
  } else {
    elements.baseNameGroup.classList.remove('required');
    elements.baseName.placeholder = 'sprite';
  }
}

// Zoom handlers
function handleZoomIn() {
  const newScale = Math.min(state.zoom.scale + state.zoom.step, state.zoom.maxScale);
  setZoom(newScale);
}

function handleZoomOut() {
  const newScale = Math.max(state.zoom.scale - state.zoom.step, state.zoom.minScale);
  setZoom(newScale);
}

function handleZoomReset() {
  state.zoom.scale = 1;
  state.zoom.panX = 0;
  state.zoom.panY = 0;
  updatePreviewTransform();
  updateZoomLevel();
}

function handleWheelZoom(e) {
  if (!elements.previewContainer.classList.contains('zoomable')) return;

  e.preventDefault();
  const delta = e.deltaY > 0 ? -state.zoom.step : state.zoom.step;
  const newScale = Math.max(state.zoom.minScale, Math.min(state.zoom.maxScale, state.zoom.scale + delta));
  setZoom(newScale);
}

function setZoom(newScale) {
  state.zoom.scale = newScale;

  // Reset pan if zooming out to 1x or less
  if (newScale <= 1) {
    state.zoom.panX = 0;
    state.zoom.panY = 0;
  }

  updatePreviewTransform();
  updateZoomLevel();
}

function updateZoomLevel() {
  elements.zoomLevel.textContent = `${Math.round(state.zoom.scale * 100)}%`;
}

function updatePreviewTransform() {
  const wrapper = elements.previewContainer.querySelector('.preview-wrapper');
  if (wrapper) {
    wrapper.style.transform = `translate(${state.zoom.panX}px, ${state.zoom.panY}px) scale(${state.zoom.scale})`;
  }
}

// Pan handlers
function handlePanStart(e) {
  if (!elements.previewContainer.classList.contains('zoomable')) return;
  if (state.zoom.scale <= 1) return;

  state.zoom.isDragging = true;
  state.zoom.startX = e.clientX - state.zoom.panX;
  state.zoom.startY = e.clientY - state.zoom.panY;
  elements.previewContainer.classList.add('dragging');
}

function handlePanMove(e) {
  if (!state.zoom.isDragging) return;

  e.preventDefault();
  state.zoom.panX = e.clientX - state.zoom.startX;
  state.zoom.panY = e.clientY - state.zoom.startY;
  updatePreviewTransform();
}

function handlePanEnd() {
  state.zoom.isDragging = false;
  elements.previewContainer.classList.remove('dragging');
}

async function handlePreview(opts = {}) {
  const { preserveZoom = false } = opts;
  if (state.selectedImageIndex < 0) return;

  exitFramePreview();

  const image = state.images[state.selectedImageIndex];

  try {
    await ensureImageCache(image.path);

    if (!preserveZoom) {
      state.zoom.scale = 1;
      state.zoom.panX = 0;
      state.zoom.panY = 0;
    }

    let canvas = elements.previewContainer.querySelector('.grid-preview-canvas');
    if (!canvas) {
      elements.previewContainer.innerHTML = `
        <div class="preview-wrapper">
          <canvas class="grid-preview-canvas"></canvas>
        </div>
      `;
    }
    elements.previewContainer.classList.add('zoomable');
    elements.zoomControls.classList.remove('hidden');
    updateZoomLevel();
    if (!preserveZoom) updatePreviewTransform();

    renderGridPreview();
  } catch (error) {
    console.error('Preview failed:', error);
  }
}

function renderGridPreview() {
  const cache = state.previewImageCache;
  if (!cache) return;
  const canvas = elements.previewContainer.querySelector('.grid-preview-canvas');
  if (!canvas) return;

  const sourceImg = cache.image;
  const imgW = sourceImg.naturalWidth;
  const imgH = sourceImg.naturalHeight;

  const cols = parseInt(elements.columns.value) || 1;
  const rows = parseInt(elements.rows.value) || 1;
  const { top: padTop, right: padRight, bottom: padBottom, left: padLeft } = state.padding;
  const { x: offsetX, y: offsetY } = state.imageOffset;

  const canvasW = Math.max(1, imgW + padLeft + padRight);
  const canvasH = Math.max(1, imgH + padTop + padBottom);
  const imageX = padLeft + offsetX;
  const imageY = padTop + offsetY;

  canvas.width = canvasW;
  canvas.height = canvasH;

  // Display size: fit container while preserving aspect ratio (transform handles further zoom).
  const containerRect = elements.previewContainer.getBoundingClientRect();
  const maxW = Math.max(containerRect.width - 40, 100);
  const maxH = Math.max(containerRect.height - 40, 100);
  const fitScale = Math.min(maxW / canvasW, maxH / canvasH, 1);
  canvas.style.width = `${canvasW * fitScale}px`;
  canvas.style.height = `${canvasH * fitScale}px`;

  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvasW, canvasH);
  ctx.drawImage(sourceImg, imageX, imageY);

  const frameW = canvasW / cols;
  const frameH = canvasH / rows;
  // Use canvas-pixel line widths; CSS scaling will preserve apparent width.
  const lineW = Math.max(1, Math.round(2 / Math.max(fitScale, 0.05)));

  ctx.strokeStyle = 'rgba(255, 0, 100, 0.85)';
  ctx.lineWidth = lineW;
  for (let i = 1; i < cols; i++) {
    const x = Math.round(i * frameW) + 0.5;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvasH);
    ctx.stroke();
  }
  for (let i = 1; i < rows; i++) {
    const y = Math.round(i * frameH) + 0.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvasW, y);
    ctx.stroke();
  }
  // Outer canvas bounds (green).
  ctx.strokeStyle = 'rgba(74, 222, 128, 0.95)';
  ctx.lineWidth = lineW;
  ctx.strokeRect(0.5, 0.5, canvasW - 1, canvasH - 1);

  const p = state.padding;
  const o = state.imageOffset;
  elements.previewInfo.innerHTML = `
    Canvas: <span>${canvasW} x ${canvasH}</span> px |
    Frame size: <span>${Math.floor(canvasW / cols)} x ${Math.floor(canvasH / rows)}</span> px |
    Total frames: <span>${cols * rows}</span> |
    Padding: <span>T${p.top} R${p.right} B${p.bottom} L${p.left}</span> |
    Image offset: <span>(${o.x}, ${o.y})</span>
    <div class="frame-preview-hint">Arrow keys nudge image position (Shift = 10px). Padding inputs accept negative values.</div>
  `;
}

async function handleSlice() {
  if (state.images.length === 0 || !state.outputFolder) return;

  const columns = parseInt(elements.columns.value) || 1;
  const rows = parseInt(elements.rows.value) || 1;
  const baseName = elements.baseName.value.trim();
  const useSequentialNumbering = elements.sequentialNumbering.checked;

  // Validate: sequential mode requires baseName
  if (useSequentialNumbering && !baseName) {
    alert('Base Name is required for sequential numbering mode.');
    elements.baseName.focus();
    return;
  }

  // Show progress modal
  elements.progressModal.classList.remove('hidden');
  elements.progressFill.style.width = '0%';
  elements.progressText.textContent = 'Starting...';

  try {
    const results = await window.electronAPI.batchSlice({
      imagePaths: state.images.map(img => img.path),
      columns,
      rows,
      outputFolder: state.outputFolder,
      baseName: baseName || null,
      useSequentialNumbering,
      frameOffsetsByPath: state.frameOffsets,
      padding: state.padding,
      imageOffset: state.imageOffset
    });

    // Hide progress modal
    elements.progressModal.classList.add('hidden');

    // Show results
    showResults(results);

  } catch (error) {
    elements.progressModal.classList.add('hidden');
    alert(`Error: ${error.message}`);
  }
}

function showResults(results) {
  let totalFrames = 0;
  let successCount = 0;

  const summaryHTML = results.map(result => {
    if (result.success) {
      totalFrames += result.totalFrames;
      successCount++;
      return `
        <div class="result-item success">
          <span class="result-item-icon">✓</span>
          <div class="result-item-text">
            <div class="result-item-name">${result.fileName}</div>
            <div class="result-item-detail">${result.totalFrames} frames (${result.frameWidth}x${result.frameHeight})</div>
          </div>
        </div>
      `;
    } else {
      return `
        <div class="result-item error">
          <span class="result-item-icon">✗</span>
          <div class="result-item-text">
            <div class="result-item-name">${result.fileName}</div>
            <div class="result-item-detail">${result.error}</div>
          </div>
        </div>
      `;
    }
  }).join('');

  elements.resultTitle.textContent = `Complete! ${totalFrames} frames extracted`;
  elements.resultSummary.innerHTML = summaryHTML;
  elements.resultModal.classList.remove('hidden');
}

function handleOpenFolder() {
  const folder = state.mode === 'resize' ? state.resize.outputFolder : state.outputFolder;
  if (folder) {
    window.electronAPI.openFolder(folder);
  }
}

// UI Updates
function updateUI() {
  // Update image list
  elements.imageList.innerHTML = state.images.map((img, index) => `
    <div class="image-item ${index === state.selectedImageIndex ? 'selected' : ''}"
         data-index="${index}">
      <span class="image-item-name">${img.name}</span>
      <button class="image-item-remove" data-index="${index}">×</button>
    </div>
  `).join('');

  // Add click handlers to image items
  elements.imageList.querySelectorAll('.image-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (!e.target.classList.contains('image-item-remove')) {
        const index = parseInt(item.dataset.index);
        state.selectedImageIndex = index;
        updateUI();
        showSelectedImagePreview();
      }
    });
  });

  // Add click handlers to remove buttons
  elements.imageList.querySelectorAll('.image-item-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const index = parseInt(btn.dataset.index);
      const removedPath = state.images[index].path;
      delete state.frameOffsets[removedPath];
      if (state.previewImageCache && state.previewImageCache.path === removedPath) {
        state.previewImageCache = null;
      }
      state.images.splice(index, 1);
      if (state.selectedImageIndex >= state.images.length) {
        state.selectedImageIndex = state.images.length - 1;
      }
      updateUI();
      showSelectedImagePreview();
    });
  });

  // Update button states
  const hasImages = state.images.length > 0;
  const hasOutput = state.outputFolder !== null;

  elements.previewBtn.disabled = !hasImages;
  elements.framePreviewBtn.disabled = !hasImages;
  elements.sliceBtn.disabled = !hasImages || !hasOutput;
  elements.sliceToPaletteBtn.disabled = !hasImages;
  elements.resizeBtn.disabled = !hasImages || !state.resize.outputFolder;

  // Update total frames
  handleGridChange();
}

function showImagePreview(image) {
  exitFramePreview();
  elements.previewContainer.innerHTML = `<img src="${image.preview}" alt="${image.name}">`;
  elements.previewContainer.classList.remove('zoomable');
  elements.zoomControls.classList.add('hidden');
  elements.previewInfo.innerHTML = `
    <strong>${image.name}</strong><br>
    Size: <span>${image.width} x ${image.height}</span> pixels |
    Format: <span>${image.format.toUpperCase()}</span>
  `;
}

function resetPreview() {
  exitFramePreview();
  elements.previewContainer.innerHTML = `
    <div class="preview-placeholder">
      <div class="placeholder-icon">🖼️</div>
      <p>Select an image to preview</p>
    </div>
  `;
  elements.previewContainer.classList.remove('zoomable');
  elements.zoomControls.classList.add('hidden');
  elements.previewInfo.innerHTML = '';
}

function showSelectedImagePreview() {
  if (state.mode === 'resize') {
    refreshResizePreview();
    return;
  }
  if (state.mode === 'tilemap') return;
  if (state.selectedImageIndex < 0) {
    resetPreview();
    return;
  }
  showImagePreview(state.images[state.selectedImageIndex]);
}

// =============================================
// Resize Feature
// =============================================

function handleResizeModeChange(mode) {
  state.resize.mode = mode;
  elements.resizeRatioGroup.classList.toggle('hidden', mode !== 'ratio');
  elements.resizeFixedWidthGroup.classList.toggle('hidden', mode !== 'fixedWidth');
  elements.resizeFixedHeightGroup.classList.toggle('hidden', mode !== 'fixedHeight');
  refreshResizePreview();
}

function handleRatioPresetClick(e) {
  const btn = e.target.closest('.ratio-preset-btn');
  if (!btn) return;
  const num = parseInt(btn.dataset.num, 10);
  const den = parseInt(btn.dataset.den, 10);
  if (!num || !den) return;
  state.resize.ratioNum = num;
  state.resize.ratioDen = den;
  elements.ratioNum.value = num;
  elements.ratioDen.value = den;
  syncRatioPresetActive();
  refreshResizePreview();
}

function syncRatioPresetActive() {
  const { ratioNum, ratioDen } = state.resize;
  elements.ratioPresets.querySelectorAll('.ratio-preset-btn').forEach(btn => {
    const matches = parseInt(btn.dataset.num, 10) === ratioNum && parseInt(btn.dataset.den, 10) === ratioDen;
    btn.classList.toggle('active', matches);
  });
}

async function handleResizeOutputFolder() {
  const folderPath = await window.electronAPI.selectOutputFolder();
  if (folderPath) {
    state.resize.outputFolder = folderPath;
    elements.resizeOutputPath.textContent = folderPath;
    updateUI();
  }
}

function computeResizeDimensions(origW, origH) {
  const r = state.resize;
  if (r.mode === 'ratio') {
    const num = Math.max(1, r.ratioNum);
    const den = Math.max(1, r.ratioDen);
    return {
      w: Math.max(1, Math.round((origW * num) / den)),
      h: Math.max(1, Math.round((origH * num) / den))
    };
  }
  if (r.mode === 'fixedWidth') {
    const targetW = Math.max(1, r.fixedWidth);
    return {
      w: targetW,
      h: Math.max(1, Math.round((origH * targetW) / origW))
    };
  }
  // fixedHeight
  const targetH = Math.max(1, r.fixedHeight);
  return {
    w: Math.max(1, Math.round((origW * targetH) / origH)),
    h: targetH
  };
}

function refreshResizePreview() {
  if (state.mode !== 'resize') return;

  if (state.images.length === 0) {
    resetResizePreview();
    return;
  }

  const idx = state.selectedImageIndex >= 0 ? state.selectedImageIndex : 0;
  const image = state.images[idx];
  if (!image) {
    resetResizePreview();
    return;
  }

  elements.resizePreviewContainer.innerHTML = `<img src="${image.preview}" alt="${image.name}">`;

  const out = computeResizeDimensions(image.width, image.height);
  const ratioLabel = describeResizeMode();
  elements.resizePreviewInfo.innerHTML = `
    <strong>${image.name}</strong><br>
    Original: <span>${image.width} x ${image.height}</span> px |
    Output: <span>${out.w} x ${out.h}</span> px |
    Mode: <span>${ratioLabel}</span>
  `;

  updateResizeBatchSummary();
}

function resetResizePreview() {
  elements.resizePreviewContainer.innerHTML = `
    <div class="preview-placeholder">
      <div class="placeholder-icon">📐</div>
      <p>Select an image to preview</p>
    </div>
  `;
  elements.resizePreviewInfo.innerHTML = '';
  elements.resizeBatchSummary.innerHTML = '';
}

function describeResizeMode() {
  const r = state.resize;
  if (r.mode === 'ratio') return `Ratio ${r.ratioNum}/${r.ratioDen}`;
  if (r.mode === 'fixedWidth') return `Fixed width ${r.fixedWidth}px`;
  return `Fixed height ${r.fixedHeight}px`;
}

function updateResizeBatchSummary() {
  if (state.images.length === 0) {
    elements.resizeBatchSummary.innerHTML = '';
    return;
  }
  const rowsHtml = state.images.map((img, idx) => {
    const out = computeResizeDimensions(img.width, img.height);
    const sel = idx === state.selectedImageIndex ? 'selected' : '';
    return `
      <div class="resize-row ${sel}" data-index="${idx}" title="${img.name}">
        <span class="resize-row-name">${img.name}</span>
        <span class="resize-row-dims">${img.width}x${img.height} → <strong>${out.w}x${out.h}</strong></span>
      </div>
    `;
  }).join('');
  elements.resizeBatchSummary.innerHTML = rowsHtml;
  elements.resizeBatchSummary.querySelectorAll('.resize-row').forEach(row => {
    row.addEventListener('click', () => {
      state.selectedImageIndex = parseInt(row.dataset.index, 10);
      updateUI();
      refreshResizePreview();
    });
  });
}

async function handleResize() {
  if (state.images.length === 0 || !state.resize.outputFolder) return;

  // Validate inputs
  if (state.resize.mode === 'ratio' && (state.resize.ratioNum < 1 || state.resize.ratioDen < 1)) {
    alert('Ratio numerator and denominator must be at least 1.');
    return;
  }
  if (state.resize.mode === 'fixedWidth' && state.resize.fixedWidth < 1) {
    alert('Target width must be at least 1.');
    return;
  }
  if (state.resize.mode === 'fixedHeight' && state.resize.fixedHeight < 1) {
    alert('Target height must be at least 1.');
    return;
  }

  elements.progressModal.classList.remove('hidden');
  elements.progressFill.style.width = '0%';
  elements.progressText.textContent = `Resizing 0 / ${state.images.length}...`;

  try {
    const results = await window.electronAPI.batchResize({
      images: state.images.map(img => ({ path: img.path, name: img.name })),
      mode: state.resize.mode,
      ratioNumerator: state.resize.ratioNum,
      ratioDenominator: state.resize.ratioDen,
      fixedWidth: state.resize.fixedWidth,
      fixedHeight: state.resize.fixedHeight,
      outputFolder: state.resize.outputFolder
    });

    elements.progressModal.classList.add('hidden');
    showResizeResults(results);
  } catch (error) {
    elements.progressModal.classList.add('hidden');
    alert(`Resize failed: ${error.message}`);
  }
}

function showResizeResults(results) {
  let successCount = 0;
  const summaryHTML = results.map(result => {
    if (result.success) {
      successCount++;
      return `
        <div class="result-item success">
          <span class="result-item-icon">✓</span>
          <div class="result-item-text">
            <div class="result-item-name">${result.fileName}</div>
            <div class="result-item-detail">${result.originalWidth}x${result.originalHeight} → ${result.outputWidth}x${result.outputHeight}</div>
          </div>
        </div>
      `;
    }
    return `
      <div class="result-item error">
        <span class="result-item-icon">✗</span>
        <div class="result-item-text">
          <div class="result-item-name">${result.fileName}</div>
          <div class="result-item-detail">${result.error}</div>
        </div>
      </div>
    `;
  }).join('');

  elements.resultTitle.textContent = `Resized ${successCount} / ${results.length} images`;
  elements.resultSummary.innerHTML = summaryHTML;
  elements.resultModal.classList.remove('hidden');
}

// =============================================
// Frame Preview Feature
// =============================================

async function handleFramePreview() {
  if (state.selectedImageIndex < 0) return;

  const image = state.images[state.selectedImageIndex];
  const columns = parseInt(elements.columns.value) || 1;
  const rows = parseInt(elements.rows.value) || 1;

  if (columns < 1 || rows < 1) return;

  try {
    const sourceImg = await ensureImageCache(image.path);

    const padTop = state.padding.top;
    const padRight = state.padding.right;
    const padBottom = state.padding.bottom;
    const padLeft = state.padding.left;
    const offsetX = state.imageOffset.x;
    const offsetY = state.imageOffset.y;

    const imgW = sourceImg.naturalWidth;
    const imgH = sourceImg.naturalHeight;
    const canvasW = Math.max(0, imgW + padLeft + padRight);
    const canvasH = Math.max(0, imgH + padTop + padBottom);
    const imageX = padLeft + offsetX;
    const imageY = padTop + offsetY;
    const frameWidth = Math.floor(canvasW / columns);
    const frameHeight = Math.floor(canvasH / rows);

    const prevIndex = state.framePreview.active && state.framePreview.sourceImagePath === image.path
      ? Math.min(state.framePreview.currentFrameIndex, columns * rows - 1)
      : 0;

    state.framePreview = {
      active: true,
      currentFrameIndex: Math.max(0, prevIndex),
      totalFrames: columns * rows,
      columns,
      rows,
      frameWidth,
      frameHeight,
      imageX,
      imageY,
      sourceImage: sourceImg,
      sourceImagePath: image.path
    };

    showFramePreview();
  } catch (error) {
    console.error('Frame preview failed:', error);
    alert(`Frame preview failed: ${error.message}`);
  }
}

function showFramePreview() {
  state.zoom.scale = 1;
  state.zoom.panX = 0;
  state.zoom.panY = 0;

  elements.previewContainer.innerHTML = `
    <div class="frame-preview-wrapper">
      <button class="frame-nav-arrow frame-nav-prev" type="button" title="Previous frame">‹</button>
      <canvas class="frame-preview-canvas"></canvas>
      <button class="frame-nav-arrow frame-nav-next" type="button" title="Next frame">›</button>
    </div>
  `;
  elements.previewContainer.classList.remove('zoomable');
  elements.previewContainer.classList.add('frame-mode');
  elements.zoomControls.classList.add('hidden');

  const canvas = elements.previewContainer.querySelector('.frame-preview-canvas');
  canvas.width = state.framePreview.frameWidth;
  canvas.height = state.framePreview.frameHeight;

  updateFramePreviewSize();

  elements.previewContainer.querySelector('.frame-nav-prev').addEventListener('click', (e) => {
    e.stopPropagation();
    navigateFrame(-1);
  });
  elements.previewContainer.querySelector('.frame-nav-next').addEventListener('click', (e) => {
    e.stopPropagation();
    navigateFrame(1);
  });

  renderCurrentFrame();
  updateFramePreviewInfo();
}

function exitFramePreview() {
  if (!state.framePreview.active) return;
  state.framePreview.active = false;
  state.framePreview.sourceImage = null;
  elements.previewContainer.classList.remove('frame-mode');
}

function updateFramePreviewSize() {
  const canvas = elements.previewContainer.querySelector('.frame-preview-canvas');
  if (!canvas) return;

  const containerRect = elements.previewContainer.getBoundingClientRect();
  const maxW = Math.max(containerRect.width - 120, 64);
  const maxH = Math.max(containerRect.height - 40, 64);
  const { frameWidth, frameHeight } = state.framePreview;
  if (frameWidth <= 0 || frameHeight <= 0) return;

  const fitScale = Math.min(maxW / frameWidth, maxH / frameHeight);
  const scale = fitScale >= 1 ? Math.max(1, Math.floor(fitScale)) : fitScale;
  canvas.style.width = `${frameWidth * scale}px`;
  canvas.style.height = `${frameHeight * scale}px`;
}

function renderCurrentFrame() {
  const fp = state.framePreview;
  if (!fp.active || !fp.sourceImage) return;

  const canvas = elements.previewContainer.querySelector('.frame-preview-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const { columns, frameWidth, frameHeight, currentFrameIndex, imageX = 0, imageY = 0 } = fp;
  if (frameWidth <= 0 || frameHeight <= 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return;
  }
  const col = currentFrameIndex % columns;
  const row = Math.floor(currentFrameIndex / columns);
  const offset = getFrameOffset(fp.sourceImagePath, currentFrameIndex);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Frame's region on the virtual canvas.
  const frameCanvasX = col * frameWidth;
  const frameCanvasY = row * frameHeight;
  // Map to image-relative coords.
  const imgRelX = frameCanvasX - imageX;
  const imgRelY = frameCanvasY - imageY;

  const imgW = fp.sourceImage.naturalWidth;
  const imgH = fp.sourceImage.naturalHeight;
  const srcL = Math.max(0, imgRelX);
  const srcT = Math.max(0, imgRelY);
  const srcR = Math.min(imgW, imgRelX + frameWidth);
  const srcB = Math.min(imgH, imgRelY + frameHeight);
  const srcW = srcR - srcL;
  const srcH = srcB - srcT;

  const baseDestX = srcL - imgRelX;
  const baseDestY = srcT - imgRelY;
  const finalDestX = baseDestX + offset.dx;
  const finalDestY = baseDestY + offset.dy;

  const placeL = Math.max(0, finalDestX);
  const placeT = Math.max(0, finalDestY);
  const placeR = Math.min(frameWidth, finalDestX + srcW);
  const placeB = Math.min(frameHeight, finalDestY + srcH);

  if (srcW > 0 && srcH > 0 && placeR > placeL && placeB > placeT) {
    const finalSrcL = srcL + (placeL - finalDestX);
    const finalSrcT = srcT + (placeT - finalDestY);
    const finalSrcW = placeR - placeL;
    const finalSrcH = placeB - placeT;
    ctx.drawImage(
      fp.sourceImage,
      finalSrcL, finalSrcT, finalSrcW, finalSrcH,
      placeL, placeT, finalSrcW, finalSrcH
    );
  }
}

function navigateFrame(delta) {
  const fp = state.framePreview;
  if (!fp.active) return;
  fp.currentFrameIndex = (fp.currentFrameIndex + delta + fp.totalFrames) % fp.totalFrames;
  renderCurrentFrame();
  updateFramePreviewInfo();
}

function getFrameOffset(imagePath, frameIndex) {
  const offsets = state.frameOffsets[imagePath];
  if (!offsets) return { dx: 0, dy: 0 };
  const offset = offsets[frameIndex];
  if (!offset) return { dx: 0, dy: 0 };
  return { dx: offset.dx || 0, dy: offset.dy || 0 };
}

function setFrameOffset(imagePath, frameIndex, dx, dy) {
  if (dx === 0 && dy === 0) {
    if (state.frameOffsets[imagePath]) {
      delete state.frameOffsets[imagePath][frameIndex];
      if (Object.keys(state.frameOffsets[imagePath]).length === 0) {
        delete state.frameOffsets[imagePath];
      }
    }
    return;
  }
  if (!state.frameOffsets[imagePath]) {
    state.frameOffsets[imagePath] = {};
  }
  state.frameOffsets[imagePath][frameIndex] = { dx, dy };
}

function nudgeFrameOffset(dx, dy) {
  const fp = state.framePreview;
  if (!fp.active) return;
  const current = getFrameOffset(fp.sourceImagePath, fp.currentFrameIndex);
  setFrameOffset(fp.sourceImagePath, fp.currentFrameIndex, current.dx + dx, current.dy + dy);
  renderCurrentFrame();
  updateFramePreviewInfo();
}

function resetCurrentFrameOffset() {
  const fp = state.framePreview;
  if (!fp.active) return;
  setFrameOffset(fp.sourceImagePath, fp.currentFrameIndex, 0, 0);
  renderCurrentFrame();
  updateFramePreviewInfo();
}

function resetAllFrameOffsetsForCurrentImage() {
  const fp = state.framePreview;
  if (!fp.active) return;
  delete state.frameOffsets[fp.sourceImagePath];
  renderCurrentFrame();
  updateFramePreviewInfo();
}

function countModifiedFrames(imagePath) {
  const offsets = state.frameOffsets[imagePath];
  if (!offsets) return 0;
  return Object.keys(offsets).length;
}

// Render a single frame's base content (no per-frame offset) to an offscreen
// canvas and return its ImageData. Used by centering to inspect alpha.
function renderFrameBaseImageData(frameIndex) {
  const fp = state.framePreview;
  if (!fp.active || !fp.sourceImage) return null;
  const { columns, frameWidth, frameHeight, imageX = 0, imageY = 0, sourceImage } = fp;
  if (frameWidth <= 0 || frameHeight <= 0) return null;

  const col = frameIndex % columns;
  const row = Math.floor(frameIndex / columns);
  const frameCanvasX = col * frameWidth;
  const frameCanvasY = row * frameHeight;
  const imgRelX = frameCanvasX - imageX;
  const imgRelY = frameCanvasY - imageY;

  const imgW = sourceImage.naturalWidth;
  const imgH = sourceImage.naturalHeight;
  const srcL = Math.max(0, imgRelX);
  const srcT = Math.max(0, imgRelY);
  const srcR = Math.min(imgW, imgRelX + frameWidth);
  const srcB = Math.min(imgH, imgRelY + frameHeight);
  const srcW = srcR - srcL;
  const srcH = srcB - srcT;

  const off = document.createElement('canvas');
  off.width = frameWidth;
  off.height = frameHeight;
  const ctx = off.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  if (srcW > 0 && srcH > 0) {
    const destX = srcL - imgRelX;
    const destY = srcT - imgRelY;
    ctx.drawImage(sourceImage, srcL, srcT, srcW, srcH, destX, destY, srcW, srcH);
  }
  return ctx.getImageData(0, 0, frameWidth, frameHeight);
}

function findOpaqueBounds(imageData) {
  const { width, height, data } = imageData;
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y++) {
    const rowBase = y * width * 4;
    for (let x = 0; x < width; x++) {
      if (data[rowBase + x * 4 + 3] > 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null;
  return { minX, minY, maxX, maxY };
}

function centerAllFrames() {
  const fp = state.framePreview;
  if (!fp.active) return;

  const { totalFrames, frameWidth, frameHeight, sourceImagePath } = fp;
  let centered = 0;
  for (let i = 0; i < totalFrames; i++) {
    const data = renderFrameBaseImageData(i);
    if (!data) continue;
    const bounds = findOpaqueBounds(data);
    if (!bounds) {
      setFrameOffset(sourceImagePath, i, 0, 0);
      continue;
    }
    // Center the opaque bounding box on the frame center. Inclusive bounds
    // span [min, max], so the half-open extent is max + 1.
    const bboxCenterX = (bounds.minX + bounds.maxX + 1) / 2;
    const bboxCenterY = (bounds.minY + bounds.maxY + 1) / 2;
    const dx = Math.round(frameWidth / 2 - bboxCenterX);
    const dy = Math.round(frameHeight / 2 - bboxCenterY);
    setFrameOffset(sourceImagePath, i, dx, dy);
    centered++;
  }

  renderCurrentFrame();
  updateFramePreviewInfo();
  return centered;
}

function updateFramePreviewInfo() {
  const fp = state.framePreview;
  if (!fp.active) return;

  const offset = getFrameOffset(fp.sourceImagePath, fp.currentFrameIndex);
  const hasOffset = offset.dx !== 0 || offset.dy !== 0;
  const modifiedCount = countModifiedFrames(fp.sourceImagePath);
  const offsetClass = hasOffset ? 'frame-offset-modified' : '';

  elements.previewInfo.innerHTML = `
    Frame: <span>${fp.currentFrameIndex + 1} / ${fp.totalFrames}</span> |
    Offset: <span class="${offsetClass}">(${offset.dx}, ${offset.dy})</span> |
    Frame size: <span>${fp.frameWidth} x ${fp.frameHeight}</span> |
    Modified: <span>${modifiedCount}</span>
    <div class="frame-preview-hint">
      Click left/right half, ‹ ›, or A/D to navigate · Arrow keys to nudge (Shift = 10px)
      <button id="centerAllFramesBtn" class="frame-reset-btn">Center All</button>
      <button id="resetFrameOffsetBtn" class="frame-reset-btn" ${hasOffset ? '' : 'disabled'}>Reset Frame</button>
      <button id="resetAllOffsetsBtn" class="frame-reset-btn" ${modifiedCount > 0 ? '' : 'disabled'}>Reset All</button>
    </div>
  `;

  const centerAllBtn = document.getElementById('centerAllFramesBtn');
  if (centerAllBtn) centerAllBtn.addEventListener('click', centerAllFrames);
  const resetFrameBtn = document.getElementById('resetFrameOffsetBtn');
  if (resetFrameBtn) resetFrameBtn.addEventListener('click', resetCurrentFrameOffset);
  const resetAllBtn = document.getElementById('resetAllOffsetsBtn');
  if (resetAllBtn) resetAllBtn.addEventListener('click', resetAllFrameOffsetsForCurrentImage);
}

function handlePreviewContainerClick(e) {
  if (!state.framePreview.active) return;
  if (e.target.closest('.frame-nav-arrow')) return;

  const rect = elements.previewContainer.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  if (clickX < rect.width / 2) {
    navigateFrame(-1);
  } else {
    navigateFrame(1);
  }
}

// =============================================
// Tilemap Feature Functions
// =============================================

// Mode Change
function handleModeChange(mode) {
  state.mode = mode;

  // Update tab active state
  elements.modeSlice.classList.toggle('active', mode === 'slice');
  elements.modeTilemap.classList.toggle('active', mode === 'tilemap');
  elements.modeResize.classList.toggle('active', mode === 'resize');

  // Toggle right-side panels
  elements.sliceModeContent.classList.toggle('hidden', mode !== 'slice');
  elements.tilemapModeContent.classList.toggle('hidden', mode !== 'tilemap');
  elements.resizeModeContent.classList.toggle('hidden', mode !== 'resize');
  elements.palettePanel.classList.toggle('hidden', mode !== 'tilemap');
  elements.mainContent.classList.toggle('tilemap-mode', mode === 'tilemap');

  // Toggle settings-panel groups
  elements.sliceSettings.classList.toggle('hidden', mode === 'resize');
  elements.resizeSettings.classList.toggle('hidden', mode !== 'resize');

  if (mode === 'tilemap') {
    initTilemapCanvas();
    renderTilePalette();
    updateTilemapInfo();
  } else if (mode === 'resize') {
    refreshResizePreview();
  }
}

// Slice to Palette
async function handleSliceToPalette() {
  if (state.images.length === 0) return;

  const columns = parseInt(elements.columns.value) || 1;
  const rows = parseInt(elements.rows.value) || 1;

  // Show progress
  elements.progressModal.classList.remove('hidden');
  elements.progressFill.style.width = '0%';
  elements.progressText.textContent = 'Slicing to palette...';

  try {
    let totalProcessed = 0;
    const totalImages = state.images.length;

    for (const image of state.images) {
      const result = await window.electronAPI.sliceForPalette({
        imagePath: image.path,
        columns,
        rows
      });

      if (result.success) {
        result.tiles.forEach((tile, index) => {
          state.slicedTiles.push({
            id: `tile_${Date.now()}_${state.slicedTiles.length}`,
            name: `${image.name.replace(/\.[^.]+$/, '')}_${tile.index}`,
            dataUrl: tile.dataUrl,
            width: result.tileWidth,
            height: result.tileHeight,
            index: state.slicedTiles.length
          });
        });

        // Update tile size from first result
        if (state.tilemap.tileWidth === 32 && result.tileWidth) {
          state.tilemap.tileWidth = result.tileWidth;
          state.tilemap.tileHeight = result.tileHeight;
        }
      }

      totalProcessed++;
      const progress = (totalProcessed / totalImages) * 100;
      elements.progressFill.style.width = `${progress}%`;
      elements.progressText.textContent = `Processing ${totalProcessed} / ${totalImages}...`;
    }

    elements.progressModal.classList.add('hidden');

    // Switch to tilemap mode
    handleModeChange('tilemap');

  } catch (error) {
    elements.progressModal.classList.add('hidden');
    alert(`Error: ${error.message}`);
  }
}

// Load Tiles from Folder
async function handleLoadTilesFromFolder() {
  const result = await window.electronAPI.loadTilesFromFolder();

  if (result.success) {
    // Clear existing tiles and add new ones
    state.slicedTiles = result.tiles.map((tile, index) => ({
      id: `tile_${Date.now()}_${index}`,
      name: tile.name,
      dataUrl: tile.dataUrl,
      width: tile.width,
      height: tile.height,
      index
    }));

    // Update tile size
    if (result.tileWidth && result.tileHeight) {
      state.tilemap.tileWidth = result.tileWidth;
      state.tilemap.tileHeight = result.tileHeight;
    }

    renderTilePalette();
    initTilemapCanvas();
    updateTilemapInfo();
  } else if (result.error !== 'No folder selected') {
    alert(`Error: ${result.error}`);
  }
}

// Palette View Toggle
function handlePaletteViewToggle() {
  state.paletteViewMode = state.paletteViewMode === 'grid' ? 'list' : 'grid';

  // Update toggle button icons
  const gridIcon = elements.paletteViewToggle.querySelector('.grid-icon');
  const listIcon = elements.paletteViewToggle.querySelector('.list-icon');
  gridIcon.classList.toggle('hidden', state.paletteViewMode === 'list');
  listIcon.classList.toggle('hidden', state.paletteViewMode === 'grid');

  renderTilePalette();
}

// Render Tile Palette
function renderTilePalette() {
  const isListView = state.paletteViewMode === 'list';

  // Update palette class
  elements.tilePalette.classList.toggle('list-view', isListView);

  elements.tilePalette.innerHTML = state.slicedTiles.map((tile, index) => {
    if (isListView) {
      return `
        <div class="palette-tile ${tile.id === state.tilemap.selectedTileId ? 'selected' : ''}"
             data-tile-id="${tile.id}"
             draggable="true"
             title="${tile.name}">
          <div class="tile-img-wrapper">
            <img src="${tile.dataUrl}" alt="${tile.name}">
          </div>
          <span class="tile-index">${index}</span>
          <span class="tile-name">${tile.name}</span>
        </div>
      `;
    } else {
      return `
        <div class="palette-tile ${tile.id === state.tilemap.selectedTileId ? 'selected' : ''}"
             data-tile-id="${tile.id}"
             draggable="true"
             title="${tile.name}">
          <img src="${tile.dataUrl}" alt="${tile.name}">
          <span class="tile-index">${index}</span>
        </div>
      `;
    }
  }).join('');

  elements.paletteCount.textContent = state.slicedTiles.length;

  if (state.slicedTiles.length > 0) {
    elements.tileSizeInfo.textContent = `(${state.tilemap.tileWidth}x${state.tilemap.tileHeight}px)`;
  } else {
    elements.tileSizeInfo.textContent = '';
  }

  // Event binding
  elements.tilePalette.querySelectorAll('.palette-tile').forEach(tile => {
    tile.addEventListener('click', () => handleTileSelect(tile.dataset.tileId));
    tile.addEventListener('dragstart', (e) => handleTileDragStart(e, tile.dataset.tileId));
  });
}

// Tile Selection
function handleTileSelect(tileId) {
  state.tilemap.selectedTileId = tileId;
  state.tilemap.isErasing = false;
  elements.eraserBtn.classList.remove('active');
  renderTilePalette();
}

// Eraser Toggle
function handleEraserToggle() {
  state.tilemap.isErasing = !state.tilemap.isErasing;
  state.tilemap.selectedTileId = null;
  elements.eraserBtn.classList.toggle('active', state.tilemap.isErasing);
  renderTilePalette();
}

// Tile Drag Start
function handleTileDragStart(e, tileId) {
  e.dataTransfer.setData('text/plain', tileId);
  e.dataTransfer.effectAllowed = 'copy';
}

// Background Image
async function handleLoadBackground() {
  const result = await window.electronAPI.loadBackgroundImage();
  if (result.success) {
    state.tilemap.backgroundImage = {
      dataUrl: result.dataUrl,
      width: result.width,
      height: result.height
    };
    elements.clearBgBtn.classList.remove('hidden');

    // Resize canvas to match background image
    const { tileWidth, tileHeight } = state.tilemap;
    const newCanvasWidth = Math.ceil(result.width / tileWidth);
    const newCanvasHeight = Math.ceil(result.height / tileHeight);

    const oldGrid = state.tilemap.grid;
    state.tilemap.canvasWidth = newCanvasWidth;
    state.tilemap.canvasHeight = newCanvasHeight;

    initGrid();

    // Preserve existing tiles
    for (let y = 0; y < Math.min(oldGrid.length, newCanvasHeight); y++) {
      for (let x = 0; x < Math.min(oldGrid[y]?.length || 0, newCanvasWidth); x++) {
        state.tilemap.grid[y][x] = oldGrid[y][x];
      }
    }

    initTilemapCanvas();
    updateTilemapInfo();
  }
}

function handleClearBackground() {
  state.tilemap.backgroundImage = null;
  elements.clearBgBtn.classList.add('hidden');
  renderTilemapCanvas();
}

// =============================================
// Tilemap Canvas Functions
// =============================================

// Initialize Canvas
function initTilemapCanvas() {
  const { canvasWidth, canvasHeight, tileWidth, tileHeight } = state.tilemap;

  // Set canvas size
  elements.tilemapCanvas.width = canvasWidth * tileWidth;
  elements.tilemapCanvas.height = canvasHeight * tileHeight;

  // Initialize grid if empty
  if (state.tilemap.grid.length === 0) {
    initGrid();
  }

  renderTilemapCanvas();
}

// Initialize Grid
function initGrid() {
  const { canvasWidth, canvasHeight } = state.tilemap;
  state.tilemap.grid = Array(canvasHeight).fill(null)
    .map(() => Array(canvasWidth).fill(null));
}

// Resize Canvas
function handleResizeCanvas() {
  const newWidth = parseInt(elements.canvasColumns.value) || 16;
  const newHeight = parseInt(elements.canvasRows.value) || 16;

  const { canvasWidth, canvasHeight, tileWidth, tileHeight } = state.tilemap;
  const oldGrid = state.tilemap.grid;

  // Update dimensions
  state.tilemap.canvasWidth = newWidth;
  state.tilemap.canvasHeight = newHeight;

  // Resize canvas
  elements.tilemapCanvas.width = newWidth * tileWidth;
  elements.tilemapCanvas.height = newHeight * tileHeight;

  // Initialize new grid
  initGrid();

  // Copy old data
  for (let y = 0; y < Math.min(oldGrid.length, newHeight); y++) {
    for (let x = 0; x < Math.min(oldGrid[y]?.length || 0, newWidth); x++) {
      state.tilemap.grid[y][x] = oldGrid[y][x];
    }
  }

  renderTilemapCanvas();
  updateTilemapInfo();
}

// Clear Canvas
function handleClearCanvas() {
  initGrid();
  renderTilemapCanvas();
}

// Render Canvas
function renderTilemapCanvas() {
  const canvas = elements.tilemapCanvas;
  const ctx = canvas.getContext('2d');
  const { canvasWidth, canvasHeight, tileWidth, tileHeight, grid, backgroundImage } = state.tilemap;

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw background image if loaded
  if (backgroundImage) {
    const bgImg = new Image();
    bgImg.src = backgroundImage.dataUrl;
    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
  }

  // Preload images for rendering
  const tileImages = {};
  state.slicedTiles.forEach(tile => {
    const img = new Image();
    img.src = tile.dataUrl;
    tileImages[tile.id] = img;
  });

  // Render tiles
  for (let y = 0; y < canvasHeight; y++) {
    for (let x = 0; x < canvasWidth; x++) {
      const tileId = grid[y]?.[x];
      if (tileId && tileImages[tileId]) {
        ctx.drawImage(tileImages[tileId], x * tileWidth, y * tileHeight, tileWidth, tileHeight);
      }
    }
  }

  // Draw grid lines
  ctx.strokeStyle = backgroundImage ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1;

  for (let x = 0; x <= canvasWidth; x++) {
    ctx.beginPath();
    ctx.moveTo(x * tileWidth, 0);
    ctx.lineTo(x * tileWidth, canvas.height);
    ctx.stroke();
  }

  for (let y = 0; y <= canvasHeight; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * tileHeight);
    ctx.lineTo(canvas.width, y * tileHeight);
    ctx.stroke();
  }
}

// Setup Canvas Events
function setupTilemapCanvasEvents() {
  const canvas = elements.tilemapCanvas;
  const container = elements.tilemapCanvasContainer;
  let isDrawing = false;

  canvas.addEventListener('mousedown', (e) => {
    if (state.mode !== 'tilemap') return;
    // If pan mode is on, start panning instead of drawing
    if (state.tilemap.isPanMode) {
      e.preventDefault();
      state.tilemap.zoom.isDragging = true;
      state.tilemap.zoom.startX = e.clientX - state.tilemap.zoom.panX;
      state.tilemap.zoom.startY = e.clientY - state.tilemap.zoom.panY;
      return;
    }
    // Only draw with left click when not panning
    if (e.button === 0 && !e.shiftKey) {
      isDrawing = true;
      handleCanvasClick(e);
    }
  });

  canvas.addEventListener('mousemove', (e) => {
    if (state.mode !== 'tilemap') return;
    // Handle panning
    if (state.tilemap.zoom.isDragging) {
      e.preventDefault();
      state.tilemap.zoom.panX = e.clientX - state.tilemap.zoom.startX;
      state.tilemap.zoom.panY = e.clientY - state.tilemap.zoom.startY;
      updateTilemapTransform();
      return;
    }
    // Handle drawing
    if (isDrawing) {
      handleCanvasClick(e);
    }
  });

  canvas.addEventListener('mouseup', () => {
    isDrawing = false;
    state.tilemap.zoom.isDragging = false;
  });

  canvas.addEventListener('mouseleave', () => {
    isDrawing = false;
    state.tilemap.zoom.isDragging = false;
  });

  // Drag and drop support
  canvas.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  });

  canvas.addEventListener('drop', (e) => {
    e.preventDefault();
    const tileId = e.dataTransfer.getData('text/plain');
    if (tileId) {
      state.tilemap.selectedTileId = tileId;
      state.tilemap.isErasing = false;
      elements.eraserBtn.classList.remove('active');
      renderTilePalette();
      handleCanvasClick(e);
    }
  });

  // Pan with middle mouse or shift+left mouse (always available)
  container.addEventListener('mousedown', (e) => {
    if (state.mode !== 'tilemap') return;
    if (e.button === 1 || (e.button === 0 && e.shiftKey && !state.tilemap.isPanMode)) {
      e.preventDefault();
      state.tilemap.zoom.isDragging = true;
      state.tilemap.zoom.startX = e.clientX - state.tilemap.zoom.panX;
      state.tilemap.zoom.startY = e.clientY - state.tilemap.zoom.panY;
    }
  });

  container.addEventListener('mousemove', (e) => {
    if (!state.tilemap.zoom.isDragging) return;
    e.preventDefault();
    state.tilemap.zoom.panX = e.clientX - state.tilemap.zoom.startX;
    state.tilemap.zoom.panY = e.clientY - state.tilemap.zoom.startY;
    updateTilemapTransform();
  });

  container.addEventListener('mouseup', () => {
    state.tilemap.zoom.isDragging = false;
  });

  container.addEventListener('mouseleave', () => {
    state.tilemap.zoom.isDragging = false;
  });

  // Wheel zoom
  container.addEventListener('wheel', (e) => {
    if (state.mode !== 'tilemap') return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -state.tilemap.zoom.step : state.tilemap.zoom.step;
    const newScale = Math.max(
      state.tilemap.zoom.minScale,
      Math.min(state.tilemap.zoom.maxScale, state.tilemap.zoom.scale + delta)
    );
    setTilemapZoom(newScale);
  });
}

// Canvas Click Handler
function handleCanvasClick(e) {
  const canvas = elements.tilemapCanvas;
  const rect = canvas.getBoundingClientRect();
  const { tileWidth, tileHeight, grid, selectedTileId, isErasing } = state.tilemap;

  // Convert click position to tile coordinates
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = Math.floor((e.clientX - rect.left) * scaleX / tileWidth);
  const y = Math.floor((e.clientY - rect.top) * scaleY / tileHeight);

  // Bounds check
  if (x < 0 || x >= grid[0]?.length || y < 0 || y >= grid.length) return;

  // Place or erase tile
  if (isErasing) {
    grid[y][x] = null;
  } else if (selectedTileId) {
    grid[y][x] = selectedTileId;
  }

  renderTilemapCanvas();
}

// Export Tilemap
async function handleExportTilemap() {
  if (state.slicedTiles.length === 0 && !state.tilemap.backgroundImage) {
    alert('No tiles or background loaded.');
    return;
  }

  const result = await window.electronAPI.exportTilemap({
    grid: state.tilemap.grid,
    tiles: state.slicedTiles,
    tileWidth: state.tilemap.tileWidth,
    tileHeight: state.tilemap.tileHeight,
    canvasWidth: state.tilemap.canvasWidth,
    canvasHeight: state.tilemap.canvasHeight,
    backgroundDataUrl: state.tilemap.backgroundImage?.dataUrl || null
  });

  if (result.success) {
    alert(`Tilemap exported to:\n${result.outputPath}\n\nCSV file saved to:\n${result.csvPath}`);
  } else if (result.error !== 'No file selected') {
    alert(`Export failed: ${result.error}`);
  }
}

// Update Tilemap Info
function updateTilemapInfo() {
  const { canvasWidth, canvasHeight, tileWidth, tileHeight } = state.tilemap;
  const pixelWidth = canvasWidth * tileWidth;
  const pixelHeight = canvasHeight * tileHeight;

  elements.tilemapInfo.innerHTML = `
    Canvas: <span>${canvasWidth} x ${canvasHeight}</span> tiles |
    Output size: <span>${pixelWidth} x ${pixelHeight}</span> pixels
  `;

  // Update input values
  elements.canvasColumns.value = canvasWidth;
  elements.canvasRows.value = canvasHeight;
}

// =============================================
// Tilemap Zoom Functions
// =============================================

function handleTilemapZoomIn() {
  const zoom = state.tilemap.zoom;
  const newScale = Math.min(zoom.scale + zoom.step, zoom.maxScale);
  setTilemapZoom(newScale);
}

function handleTilemapZoomOut() {
  const zoom = state.tilemap.zoom;
  const newScale = Math.max(zoom.scale - zoom.step, zoom.minScale);
  setTilemapZoom(newScale);
}

function handleTilemapZoomReset() {
  state.tilemap.zoom.scale = 1;
  state.tilemap.zoom.panX = 0;
  state.tilemap.zoom.panY = 0;
  updateTilemapTransform();
  updateTilemapZoomLevel();
}

function setTilemapZoom(newScale) {
  state.tilemap.zoom.scale = newScale;

  // Reset pan if zooming out to 1x or less
  if (newScale <= 1) {
    state.tilemap.zoom.panX = 0;
    state.tilemap.zoom.panY = 0;
  }

  updateTilemapTransform();
  updateTilemapZoomLevel();
}

function updateTilemapTransform() {
  const { scale, panX, panY } = state.tilemap.zoom;
  elements.tilemapCanvasWrapper.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
}

function updateTilemapZoomLevel() {
  elements.tilemapZoomLevel.textContent = `${Math.round(state.tilemap.zoom.scale * 100)}%`;
}

function handleTilemapPanToggle() {
  state.tilemap.isPanMode = !state.tilemap.isPanMode;
  elements.tilemapPanBtn.classList.toggle('active', state.tilemap.isPanMode);
  elements.tilemapCanvasContainer.classList.toggle('pan-mode', state.tilemap.isPanMode);
}

// Keyboard shortcuts
function handleKeyDown(e) {
  // Ignore if typing in input field
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

  // Spacebar: Toggle pan mode (tilemap only)
  if (e.code === 'Space' && state.mode === 'tilemap') {
    e.preventDefault();
    handleTilemapPanToggle();
    return;
  }

  // Frame preview keyboard controls
  if (state.mode === 'slice' && state.framePreview.active) {
    // A / D: navigate frames
    if (e.code === 'KeyA') {
      e.preventDefault();
      navigateFrame(-1);
      return;
    }
    if (e.code === 'KeyD') {
      e.preventDefault();
      navigateFrame(1);
      return;
    }

    // Arrow keys: nudge frame offset
    const step = e.shiftKey ? 10 : 1;
    let dx = 0;
    let dy = 0;
    if (e.code === 'ArrowLeft') dx = -step;
    else if (e.code === 'ArrowRight') dx = step;
    else if (e.code === 'ArrowUp') dy = -step;
    else if (e.code === 'ArrowDown') dy = step;
    else return;

    e.preventDefault();
    nudgeFrameOffset(dx, dy);
    return;
  }

  // Grid preview keyboard controls: nudge image position (not padding)
  if (state.mode === 'slice' && elements.previewContainer.classList.contains('zoomable')) {
    const step = e.shiftKey ? 10 : 1;
    let dx = 0;
    let dy = 0;
    if (e.code === 'ArrowLeft') dx = -step;
    else if (e.code === 'ArrowRight') dx = step;
    else if (e.code === 'ArrowUp') dy = -step;
    else if (e.code === 'ArrowDown') dy = step;
    else return;

    e.preventDefault();
    state.imageOffset.x += dx;
    state.imageOffset.y += dy;
    // Image moved → per-frame offsets no longer match their original frame contents.
    if (Object.keys(state.frameOffsets).length > 0) {
      state.frameOffsets = {};
    }
    refreshActivePreview();
  }
}

// Start
init();
