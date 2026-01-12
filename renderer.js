// State
const state = {
  images: [],
  selectedImageIndex: -1,
  outputFolder: null
};

// DOM Elements
const elements = {
  selectImagesBtn: document.getElementById('selectImagesBtn'),
  imageList: document.getElementById('imageList'),
  columns: document.getElementById('columns'),
  rows: document.getElementById('rows'),
  totalFrames: document.getElementById('totalFrames'),
  baseName: document.getElementById('baseName'),
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
  closeResultBtn: document.getElementById('closeResultBtn')
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

  // Drag and drop support
  document.body.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });

  document.body.addEventListener('drop', handleDrop);
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

    elements.previewContainer.innerHTML = `<img src="${result.preview}" alt="Preview">`;
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
  const useSequentialNumbering = elements.sequentialNumbering.checked && baseName;

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

  // Update total frames
  handleGridChange();
}

function showImagePreview(image) {
  elements.previewContainer.innerHTML = `<img src="${image.preview}" alt="${image.name}">`;
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
  elements.previewInfo.innerHTML = '';
}

// Start
init();
