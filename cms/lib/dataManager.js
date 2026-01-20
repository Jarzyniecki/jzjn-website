/**
 * Data Manager - Read/write JSON data files with automatic backups
 */

const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
const projectsDataDir = path.join(dataDir, 'projects');
const backupDir = path.join(dataDir, 'backups');

// Ensure backup directory exists
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

function createBackup(filePath) {
  if (fs.existsSync(filePath)) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = path.basename(filePath);
    const backupPath = path.join(backupDir, `${timestamp}_${fileName}`);
    fs.copyFileSync(filePath, backupPath);

    // Keep only last 10 backups per file
    const backups = fs.readdirSync(backupDir)
      .filter(f => f.endsWith(fileName))
      .sort()
      .reverse();

    backups.slice(10).forEach(f => {
      fs.unlinkSync(path.join(backupDir, f));
    });
  }
}

function readJSON(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

function writeJSON(filePath, data) {
  createBackup(filePath);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Homepage data
function getHomepage() {
  return readJSON(path.join(dataDir, 'homepage.json')) || { slides: [], sidebar: {} };
}

function saveHomepage(data) {
  writeJSON(path.join(dataDir, 'homepage.json'), data);
}

// Sidebar data (part of homepage)
function getSidebar() {
  const homepage = getHomepage();
  return homepage.sidebar || {};
}

function saveSidebar(data) {
  const homepage = getHomepage();
  homepage.sidebar = data;
  saveHomepage(homepage);
}

// Projects index
function getProjectsIndex() {
  return readJSON(path.join(dataDir, 'projects-index.json')) || { projects: [] };
}

function saveProjectsIndex(data) {
  writeJSON(path.join(dataDir, 'projects-index.json'), data);
}

// Individual project
function getProject(slug) {
  return readJSON(path.join(projectsDataDir, `${slug}.json`));
}

function saveProject(slug, data) {
  writeJSON(path.join(projectsDataDir, `${slug}.json`), data);
}

function deleteProject(slug) {
  const filePath = path.join(projectsDataDir, `${slug}.json`);
  if (fs.existsSync(filePath)) {
    createBackup(filePath);
    fs.unlinkSync(filePath);
  }
}

function getAllProjects() {
  if (!fs.existsSync(projectsDataDir)) {
    return [];
  }
  return fs.readdirSync(projectsDataDir)
    .filter(f => f.endsWith('.json'))
    .map(f => readJSON(path.join(projectsDataDir, f)));
}

// Create slug from title
function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

module.exports = {
  getHomepage,
  saveHomepage,
  getSidebar,
  saveSidebar,
  getProjectsIndex,
  saveProjectsIndex,
  getProject,
  saveProject,
  deleteProject,
  getAllProjects,
  slugify
};
