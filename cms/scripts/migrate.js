/**
 * Migration Script - Extract content from existing HTML into JSON data files
 */

const fs = require('fs');
const path = require('path');

const websiteRoot = path.join(__dirname, '..', '..');
const dataDir = path.join(__dirname, '..', 'data');
const projectsDataDir = path.join(dataDir, 'projects');

// Ensure directories exist
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(projectsDataDir)) fs.mkdirSync(projectsDataDir, { recursive: true });

// Simple HTML parser helpers
function extractAttribute(html, tag, attr) {
  const regex = new RegExp(`<${tag}[^>]*${attr}="([^"]*)"`, 'gi');
  const matches = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    matches.push(match[1]);
  }
  return matches;
}

function extractInnerText(html, selector) {
  // Basic extraction - works for simple cases
  const regex = new RegExp(`<${selector}[^>]*>([^<]*)</${selector}>`, 'gi');
  const matches = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    matches.push(match[1].trim());
  }
  return matches;
}

// Migrate homepage data
function migrateHomepage() {
  console.log('Migrating homepage...');
  const indexPath = path.join(websiteRoot, 'index.html');
  const html = fs.readFileSync(indexPath, 'utf-8');

  // Extract slides
  const slideRegex = /<div class="slide[^"]*"(?:\s+data-project="([^"]*)")?\s*>\s*<img src="([^"]*)" alt="([^"]*)">/g;
  const slides = [];
  let match;

  while ((match = slideRegex.exec(html)) !== null) {
    slides.push({
      id: slides.length + 1,
      image: match[2],
      name: match[3],
      projectLink: match[1] || null
    });
  }

  // Extract sidebar content
  const sidebarContent = {};

  // Company name
  const h1Match = html.match(/<div class="sidebar-header">\s*<h1>([^<]*)<\/h1>/);
  sidebarContent.companyName = h1Match ? h1Match[1] : 'Jarzyniecki Johnson Architecture';

  // Extract paragraphs from sidebar-content
  const sidebarContentMatch = html.match(/<div class="sidebar-content">([\s\S]*?)<p class="copyright">/);
  if (sidebarContentMatch) {
    const contentHtml = sidebarContentMatch[1];

    // Extract main paragraphs
    const paragraphs = [];
    const pRegex = /<p(?:\s+class="[^"]*")?>([\s\S]*?)<\/p>/g;
    let pMatch;
    while ((pMatch = pRegex.exec(contentHtml)) !== null) {
      const text = pMatch[1].trim();
      const className = pMatch[0].match(/class="([^"]*)"/);
      if (!className || (!className[1].includes('contact') && !className[1].includes('copyright'))) {
        // Replace <a> tags with markdown-style links for storage
        const cleanText = text.replace(/<a href="([^"]*)"[^>]*>([^<]*)<\/a>/g, '[$2]($1)');
        if (cleanText && !cleanText.includes('iframe')) {
          paragraphs.push(cleanText);
        }
      }
    }
    sidebarContent.paragraphs = paragraphs;

    // Extract email
    const emailMatch = contentHtml.match(/href="mailto:([^"]*)"/);
    sidebarContent.email = emailMatch ? emailMatch[1] : 'info@jzjn.us';

    // Extract address
    const addressMatch = contentHtml.match(/<p class="contact-address">([\s\S]*?)<\/p>/);
    if (addressMatch) {
      sidebarContent.address = addressMatch[1].replace(/<br\s*\/?>/g, '\n').trim();
    }

    // Extract map URL
    const mapMatch = contentHtml.match(/src="([^"]*maps[^"]*)"/);
    sidebarContent.mapUrl = mapMatch ? mapMatch[1] : '';
  }

  const homepageData = {
    slides,
    sidebar: sidebarContent
  };

  fs.writeFileSync(
    path.join(dataDir, 'homepage.json'),
    JSON.stringify(homepageData, null, 2)
  );
  console.log(`  Extracted ${slides.length} slides`);
}

// Migrate projects index
function migrateProjectsIndex() {
  console.log('Migrating projects index...');
  const projectsPath = path.join(websiteRoot, 'projects.html');
  const html = fs.readFileSync(projectsPath, 'utf-8');

  const projects = [];
  const cardRegex = /<a href="projects\/([^"]+)\.html" class="project-card">\s*<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>\s*<div class="project-info">\s*<h3>([^<]*)<\/h3>(?:\s*<p>([^<]*)<\/p>)?/g;

  let match;
  while ((match = cardRegex.exec(html)) !== null) {
    projects.push({
      slug: match[1],
      thumbnail: match[2],
      title: match[4],
      subtitle: match[5] || null
    });
  }

  fs.writeFileSync(
    path.join(dataDir, 'projects-index.json'),
    JSON.stringify({ projects }, null, 2)
  );
  console.log(`  Extracted ${projects.length} projects`);
}

// Migrate individual project pages
function migrateProjectPages() {
  console.log('Migrating project pages...');
  const projectsDir = path.join(websiteRoot, 'projects');

  if (!fs.existsSync(projectsDir)) {
    console.log('  No projects directory found');
    return;
  }

  const files = fs.readdirSync(projectsDir).filter(f => f.endsWith('.html'));

  for (const file of files) {
    const slug = file.replace('.html', '');
    const html = fs.readFileSync(path.join(projectsDir, file), 'utf-8');

    // Extract project title
    const titleMatch = html.match(/<span class="project-name">([^<]*)<\/span>/);
    const title = titleMatch ? titleMatch[1] : slug;

    // Extract gallery images
    const images = [];
    const imgRegex = /<div class="slide[^"]*">\s*<img src="([^"]*)" alt="([^"]*)">/g;
    let match;
    while ((match = imgRegex.exec(html)) !== null) {
      images.push({
        src: match[1],
        alt: match[2]
      });
    }

    // Extract info slide text
    const infoSlideMatch = html.match(/<div class="slide-text">([\s\S]*?)<\/div>\s*<\/div>/);
    let infoLines = [];
    if (infoSlideMatch) {
      const spanRegex = /<span>([^<]*(?:<em>[^<]*<\/em>[^<]*)?)<\/span>/g;
      let spanMatch;
      while ((spanMatch = spanRegex.exec(infoSlideMatch[1])) !== null) {
        const text = spanMatch[1].replace(/<\/?em>/g, '');
        if (text.trim()) {
          infoLines.push(text.trim());
        }
      }
    }

    const projectData = {
      slug,
      title,
      images,
      info: infoLines
    };

    fs.writeFileSync(
      path.join(projectsDataDir, `${slug}.json`),
      JSON.stringify(projectData, null, 2)
    );
  }
  console.log(`  Migrated ${files.length} project pages`);
}

// Run migration
console.log('Starting JZJN content migration...\n');
migrateHomepage();
migrateProjectsIndex();
migrateProjectPages();
console.log('\nMigration complete!');
