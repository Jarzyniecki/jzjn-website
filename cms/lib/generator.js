/**
 * Generator - Compile Handlebars templates with JSON data to produce static HTML
 */

const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');

const templatesDir = path.join(__dirname, '..', 'templates');
const websiteRoot = path.join(__dirname, '..', '..');
const dataManager = require('./dataManager');

// Register Handlebars helpers
Handlebars.registerHelper('eq', (a, b) => a === b);
Handlebars.registerHelper('if_eq', function(a, b, opts) {
  return a === b ? opts.fn(this) : opts.inverse(this);
});
Handlebars.registerHelper('inc', (value) => parseInt(value) + 1);
Handlebars.registerHelper('json', (obj) => JSON.stringify(obj));
Handlebars.registerHelper('markdown_links', function(text) {
  if (!text) return '';
  // Convert [text](url) to <a href="url" target="_blank">text</a>
  return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
});
Handlebars.registerHelper('newline_to_br', function(text) {
  if (!text) return '';
  return text.replace(/\n/g, '<br>');
});

function loadTemplate(name) {
  const templatePath = path.join(templatesDir, `${name}.hbs`);
  const templateContent = fs.readFileSync(templatePath, 'utf-8');
  return Handlebars.compile(templateContent);
}

function generateHomepage() {
  const data = dataManager.getHomepage();
  const template = loadTemplate('index');

  // Prepare project names array for JavaScript
  const projectNames = data.slides.map(s => s.name);

  const html = template({
    slides: data.slides,
    sidebar: data.sidebar,
    projectNamesJSON: JSON.stringify(projectNames)
  });

  fs.writeFileSync(path.join(websiteRoot, 'index.html'), html);
  console.log('Generated: index.html');
}

function generateProjectsIndex() {
  const data = dataManager.getProjectsIndex();
  const template = loadTemplate('projects');

  const html = template({
    projects: data.projects
  });

  fs.writeFileSync(path.join(websiteRoot, 'projects.html'), html);
  console.log('Generated: projects.html');
}

function generateProjectPage(slug) {
  const data = dataManager.getProject(slug);
  if (!data) {
    console.error(`Project not found: ${slug}`);
    return;
  }

  const template = loadTemplate('project-detail');

  // Count only image slides (not info slide) for display
  const imageCount = data.images.length;
  const totalSlides = data.info && data.info.length > 0 ? imageCount + 1 : imageCount;

  const html = template({
    ...data,
    imageCount,
    totalSlides,
    hasInfo: data.info && data.info.length > 0
  });

  const projectsDir = path.join(websiteRoot, 'projects');
  if (!fs.existsSync(projectsDir)) {
    fs.mkdirSync(projectsDir, { recursive: true });
  }

  fs.writeFileSync(path.join(projectsDir, `${slug}.html`), html);
  console.log(`Generated: projects/${slug}.html`);
}

function generateAllProjectPages() {
  const index = dataManager.getProjectsIndex();
  for (const project of index.projects) {
    try {
      generateProjectPage(project.slug);
    } catch (err) {
      console.error(`Error generating ${project.slug}:`, err.message);
    }
  }
}

function generateAll() {
  console.log('Regenerating all HTML files...');
  generateHomepage();
  generateProjectsIndex();
  generateAllProjectPages();
  console.log('Generation complete!');
}

module.exports = {
  generateHomepage,
  generateProjectsIndex,
  generateProjectPage,
  generateAllProjectPages,
  generateAll
};
