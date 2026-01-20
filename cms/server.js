/**
 * JZJN CMS Server
 * Express server providing REST API and admin interface
 */

const express = require('express');
const path = require('path');
const multer = require('multer');

const dataManager = require('./lib/dataManager');
const imageProcessor = require('./lib/imageProcessor');
const generator = require('./lib/generator');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve admin interface
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// Serve website files (for preview)
app.use(express.static(path.join(__dirname, '..')));

// File upload configuration
const upload = multer({
  dest: path.join(__dirname, 'temp'),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = path.extname(file.originalname).toLowerCase().slice(1);
    const mime = file.mimetype.split('/')[1];
    if (allowed.test(ext) && allowed.test(mime)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// ============================================
// API Routes
// ============================================

// Homepage API
app.get('/api/homepage', (req, res) => {
  try {
    const data = dataManager.getHomepage();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/homepage', (req, res) => {
  try {
    dataManager.saveHomepage(req.body);
    generator.generateHomepage();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sidebar API
app.get('/api/sidebar', (req, res) => {
  try {
    const data = dataManager.getSidebar();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/sidebar', (req, res) => {
  try {
    dataManager.saveSidebar(req.body);
    generator.generateHomepage();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Projects Index API
app.get('/api/projects', (req, res) => {
  try {
    const data = dataManager.getProjectsIndex();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/projects', (req, res) => {
  try {
    dataManager.saveProjectsIndex(req.body);
    generator.generateProjectsIndex();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/projects', (req, res) => {
  try {
    const { title, subtitle } = req.body;
    const slug = dataManager.slugify(title);

    // Add to index
    const index = dataManager.getProjectsIndex();
    index.projects.push({
      slug,
      thumbnail: 'images/placeholder.jpg',
      title,
      subtitle: subtitle || null
    });
    dataManager.saveProjectsIndex(index);

    // Create project data file
    dataManager.saveProject(slug, {
      slug,
      title,
      images: [],
      info: []
    });

    generator.generateProjectsIndex();
    generator.generateProjectPage(slug);

    res.json({ success: true, slug });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Individual Project API
app.get('/api/projects/:slug', (req, res) => {
  try {
    const data = dataManager.getProject(req.params.slug);
    if (!data) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/projects/:slug', (req, res) => {
  try {
    dataManager.saveProject(req.params.slug, req.body);
    generator.generateProjectPage(req.params.slug);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/projects/:slug', (req, res) => {
  try {
    const slug = req.params.slug;

    // Remove from index
    const index = dataManager.getProjectsIndex();
    index.projects = index.projects.filter(p => p.slug !== slug);
    dataManager.saveProjectsIndex(index);

    // Delete project data
    dataManager.deleteProject(slug);

    generator.generateProjectsIndex();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Image Upload API
app.post('/api/upload/slideshow', upload.single('image'), async (req, res) => {
  try {
    const imagePath = await imageProcessor.uploadSlideshowImage(req.file);
    res.json({ success: true, path: imagePath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/upload/thumbnail', upload.single('image'), async (req, res) => {
  try {
    const imagePath = await imageProcessor.uploadThumbnail(req.file);
    res.json({ success: true, path: imagePath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/upload/project/:slug', upload.single('image'), async (req, res) => {
  try {
    const imagePath = await imageProcessor.uploadProjectImage(req.file, req.params.slug);
    res.json({ success: true, path: imagePath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate API
app.post('/api/generate', (req, res) => {
  try {
    generator.generateAll();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/generate/homepage', (req, res) => {
  try {
    generator.generateHomepage();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/generate/projects', (req, res) => {
  try {
    generator.generateProjectsIndex();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/generate/project/:slug', (req, res) => {
  try {
    generator.generateProjectPage(req.params.slug);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Redirect root to admin
app.get('/', (req, res) => {
  res.redirect('/admin/');
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║          JZJN CMS Server                 ║
╠══════════════════════════════════════════╣
║  Admin:   http://localhost:${PORT}/admin   ║
║  Website: http://localhost:${PORT}/        ║
╚══════════════════════════════════════════╝
  `);
});
