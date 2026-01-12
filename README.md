# Sprite Slicer

A desktop app for slicing sprite sheets into individual frames with visual grid preview.

![Electron](https://img.shields.io/badge/Electron-28.0.0-47848F?logo=electron&logoColor=white)
![Sharp](https://img.shields.io/badge/Sharp-0.33.2-99CC00?logo=sharp&logoColor=white)

## Features

- **Visual Grid Preview** - See exactly how your sprite sheet will be sliced before processing
- **Drag & Drop** - Simply drag images into the app to add them
- **Batch Processing** - Process multiple sprite sheets at once
- **Sequential Numbering** - Option to number frames continuously across multiple images
- **Custom Naming** - Set custom base names for output files
- **Multiple Formats** - Supports PNG, JPG, WebP, GIF, and BMP

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/sprite-slicer-electron.git
cd sprite-slicer-electron

# Install dependencies
npm install

# Run the app
npm start
```

## Usage

1. **Select Images** - Click "Select Images" or drag & drop sprite sheets into the app
2. **Configure Grid** - Set the number of columns and rows
3. **Preview** - Click "Preview Grid" to see the slice lines overlaid on your image
4. **Set Output** - Choose an output folder and optionally set a custom base name
5. **Slice** - Click "Slice Sprites" to extract all frames

## Output

Frames are saved as PNG files with 3-digit numbering:
```
sprite-001.png
sprite-002.png
sprite-003.png
...
```

## Build

```bash
# Build for current platform
npm run build
```

## Tech Stack

- **Electron** - Cross-platform desktop app framework
- **Sharp** - High-performance image processing
- **Node.js** - Runtime environment

## License

MIT
