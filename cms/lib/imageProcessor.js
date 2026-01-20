/**
 * Image Processor - Handle image uploads with Sharp for resizing/optimization
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const websiteRoot = path.join(__dirname, '..', '..');
const imagesDir = path.join(websiteRoot, 'images');

// Image size presets
const SIZES = {
  slideshow: { width: 1920, height: 1080, fit: 'inside' },
  thumbnail: { width: 800, height: 600, fit: 'inside' },
  gallery: { width: 1600, height: 1200, fit: 'inside' }
};

async function processImage(inputPath, outputPath, preset = 'gallery') {
  const size = SIZES[preset] || SIZES.gallery;

  await sharp(inputPath)
    .resize(size.width, size.height, {
      fit: size.fit,
      withoutEnlargement: true
    })
    .jpeg({ quality: 85 })
    .toFile(outputPath);

  return outputPath;
}

async function uploadSlideshowImage(file) {
  const outputDir = path.join(imagesDir, 'slideshow');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const ext = path.extname(file.originalname);
  const baseName = path.basename(file.originalname, ext);
  const outputName = `${Date.now()}-${baseName}-web.jpg`;
  const outputPath = path.join(outputDir, outputName);

  await processImage(file.path, outputPath, 'slideshow');

  // Clean up temp file
  fs.unlinkSync(file.path);

  return `images/slideshow/${outputName}`;
}

async function uploadThumbnail(file) {
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  const ext = path.extname(file.originalname);
  const baseName = path.basename(file.originalname, ext);
  const outputName = `${baseName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.jpg`;
  const outputPath = path.join(imagesDir, outputName);

  await processImage(file.path, outputPath, 'thumbnail');

  // Clean up temp file
  fs.unlinkSync(file.path);

  return `images/${outputName}`;
}

async function uploadProjectImage(file, projectSlug) {
  const outputDir = path.join(imagesDir, projectSlug);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const ext = path.extname(file.originalname);
  const baseName = path.basename(file.originalname, ext);
  const outputName = `${baseName}-web.jpg`;
  const outputPath = path.join(outputDir, outputName);

  await processImage(file.path, outputPath, 'gallery');

  // Clean up temp file
  fs.unlinkSync(file.path);

  return `../images/${projectSlug}/${outputName}`;
}

module.exports = {
  processImage,
  uploadSlideshowImage,
  uploadThumbnail,
  uploadProjectImage
};
