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
  baseName: document.getElementById('baseName'),
  baseNameGroup: document.getElementById('baseNameGroup'),
  perFileNumbering: document.getElementById('perFileNumbering'),
  sequentialNumbering: document.getElementById('sequentialNumbering'),
  selectOutputBtn: document.getElementById('selectOutputBtn'),
  outputPath: document.getElementById('outputPath'),
  previewBtn: document.getElementById('previewBtn'),
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
  mainContent: document.querySelector('.main-content'),
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
}

// Event Listeners
function setupEventListeners() {
  elements.selectImagesBtn.addEventListener('click', handleSelectImages);
  elements.selectOutputBtn.addEventListener('click', handleSelectOutput);
  elements.previewBtn.addEventListener('click', handlePreview);
  elements.sliceBtn.addEventListener('click', handleSlice);
  elements.columns.addEventListener('input', handleGridChange);
  elements.rows.addEventListener('input', handleGridChange);
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

  // Mouse wheel zoom
  elements.previewContainer.addEventListener('wheel', handleWheelZoom);

  // Mode tabs
  elements.modeSlice.addEventListener('click', () => handleModeChange('slice'));
  elements.modeTilemap.addEventListener('click', () => handleModeChange('tilemap'));

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
  if (state.selectedImageIndex >= 0) {
    showImagePreview(state.images[state.selectedImageIndex]);
  }
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

async function handlePreview() {
  if (state.selectedImageIndex < 0) return;

  const image = state.images[state.selectedImageIndex];
  const columns = parseInt(elements.columns.value) || 1;
  const rows = parseInt(elements.rows.value) || 1;

  try {
    const result = await window.electronAPI.generatePreview({
      imagePath: image.path,
      columns,
      rows
    });

    // Reset zoom state
    state.zoom.scale = 1;
    state.zoom.panX = 0;
    state.zoom.panY = 0;

    elements.previewContainer.innerHTML = `
      <div class="preview-wrapper">
        <img src="${result.preview}" alt="Preview">
      </div>
    `;
    elements.previewContainer.classList.add('zoomable');
    elements.zoomControls.classList.remove('hidden');
    updateZoomLevel();

    elements.previewInfo.innerHTML = `
      Frame size: <span>${result.frameWidth} x ${result.frameHeight}</span> pixels |
      Total frames: <span>${result.totalFrames}</span>
    `;
  } catch (error) {
    console.error('Preview failed:', error);
  }
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
      useSequentialNumbering
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
  if (state.outputFolder) {
    window.electronAPI.openFolder(state.outputFolder);
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
        showImagePreview(state.images[index]);
      }
    });
  });

  // Add click handlers to remove buttons
  elements.imageList.querySelectorAll('.image-item-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const index = parseInt(btn.dataset.index);
      state.images.splice(index, 1);
      if (state.selectedImageIndex >= state.images.length) {
        state.selectedImageIndex = state.images.length - 1;
      }
      updateUI();
      if (state.selectedImageIndex >= 0) {
        showImagePreview(state.images[state.selectedImageIndex]);
      } else {
        resetPreview();
      }
    });
  });

  // Update button states
  const hasImages = state.images.length > 0;
  const hasOutput = state.outputFolder !== null;

  elements.previewBtn.disabled = !hasImages;
  elements.sliceBtn.disabled = !hasImages || !hasOutput;
  elements.sliceToPaletteBtn.disabled = !hasImages;

  // Update total frames
  handleGridChange();
}

function showImagePreview(image) {
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

// =============================================
// Tilemap Feature Functions
// =============================================

// Mode Change
function handleModeChange(mode) {
  state.mode = mode;

  // Update tab active state
  elements.modeSlice.classList.toggle('active', mode === 'slice');
  elements.modeTilemap.classList.toggle('active', mode === 'tilemap');

  // Toggle panel visibility
  elements.sliceModeContent.classList.toggle('hidden', mode !== 'slice');
  elements.tilemapModeContent.classList.toggle('hidden', mode !== 'tilemap');
  elements.palettePanel.classList.toggle('hidden', mode !== 'tilemap');
  elements.mainContent.classList.toggle('tilemap-mode', mode === 'tilemap');

  if (mode === 'tilemap') {
    initTilemapCanvas();
    renderTilePalette();
    updateTilemapInfo();
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
  }
}

// Start
init();
