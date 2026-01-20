/**
 * JZJN CMS - Sidebar/About Editor
 */

let sidebarData = {};

// Load data
async function loadData() {
  try {
    sidebarData = await api('/api/sidebar');
    renderForm();
  } catch (err) {
    showToast('Failed to load data: ' + err.message, 'error');
  }
}

// Render form with data
function renderForm() {
  document.getElementById('companyName').value = sidebarData.companyName || '';
  document.getElementById('email').value = sidebarData.email || '';
  document.getElementById('address').value = sidebarData.address || '';
  document.getElementById('mapUrl').value = sidebarData.mapUrl || '';

  renderLinks();
  renderParagraphs();
}

// Render header links
function renderLinks() {
  const container = document.getElementById('linksContainer');
  container.innerHTML = '';

  (sidebarData.links || []).forEach((link, index) => {
    const div = document.createElement('div');
    div.className = 'link-input';
    div.innerHTML = `
      <input type="text" data-index="${index}" data-field="text" value="${link.text || ''}" placeholder="Link text">
      <input type="text" data-index="${index}" data-field="url" value="${link.url || ''}" placeholder="URL (e.g., projects.html)">
      <button type="button" class="btn btn-small btn-danger remove-link" data-index="${index}">&times;</button>
    `;
    container.appendChild(div);
  });

  // Add event listeners
  container.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', (e) => {
      const index = parseInt(e.target.dataset.index);
      const field = e.target.dataset.field;
      sidebarData.links[index][field] = e.target.value;
    });
  });

  container.querySelectorAll('.remove-link').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      sidebarData.links.splice(index, 1);
      renderLinks();
    });
  });
}

// Add link
document.getElementById('addLink').addEventListener('click', () => {
  if (!sidebarData.links) {
    sidebarData.links = [];
  }
  sidebarData.links.push({ text: '', url: '' });
  renderLinks();

  // Focus the new text input
  const inputs = document.querySelectorAll('#linksContainer input[data-field="text"]');
  inputs[inputs.length - 1].focus();
});

// Render paragraphs
function renderParagraphs() {
  const container = document.getElementById('paragraphsContainer');
  container.innerHTML = '';

  (sidebarData.paragraphs || []).forEach((text, index) => {
    const div = document.createElement('div');
    div.className = 'paragraph-input';
    div.innerHTML = `
      <textarea data-index="${index}" rows="3">${text}</textarea>
      <button type="button" class="btn btn-small btn-danger remove-paragraph" data-index="${index}">&times;</button>
    `;
    container.appendChild(div);
  });

  // Add event listeners
  container.querySelectorAll('textarea').forEach(textarea => {
    textarea.addEventListener('input', (e) => {
      const index = parseInt(e.target.dataset.index);
      sidebarData.paragraphs[index] = e.target.value;
    });
  });

  container.querySelectorAll('.remove-paragraph').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      sidebarData.paragraphs.splice(index, 1);
      renderParagraphs();
    });
  });
}

// Add paragraph
document.getElementById('addParagraph').addEventListener('click', () => {
  if (!sidebarData.paragraphs) {
    sidebarData.paragraphs = [];
  }
  sidebarData.paragraphs.push('');
  renderParagraphs();

  // Focus the new textarea
  const textareas = document.querySelectorAll('#paragraphsContainer textarea');
  textareas[textareas.length - 1].focus();
});

// Save changes
document.getElementById('saveBtn').addEventListener('click', async () => {
  const btn = document.getElementById('saveBtn');
  btn.disabled = true;
  btn.textContent = 'Saving...';

  // Collect form data
  sidebarData.companyName = document.getElementById('companyName').value;
  sidebarData.email = document.getElementById('email').value;
  sidebarData.address = document.getElementById('address').value;
  sidebarData.mapUrl = document.getElementById('mapUrl').value;

  try {
    await api('/api/sidebar', {
      method: 'PUT',
      body: JSON.stringify(sidebarData)
    });
    showToast('Changes saved and HTML regenerated!', 'success');
  } catch (err) {
    showToast('Failed to save: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save Changes';
  }
});

// Initialize
loadData();
