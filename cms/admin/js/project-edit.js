/**
 * JZJN CMS - Individual Project Editor
 */

let projectData = null;
let slug = null;

// Get slug from URL
const params = new URLSearchParams(window.location.search);
slug = params.get('slug');

if (!slug) {
  window.location.href = '/admin/projects.html';
}

// Load data
async function loadData() {
  try {
    projectData = await api(`/api/projects/${slug}`);
    document.getElementById('projectTitle').textContent = projectData.title;
    document.getElementById('previewLink').href = `/projects/${slug}.html`;
    renderGallery();
    renderInfo();
  } catch (err) {
    showToast('Failed to load project: ' + err.message, 'error');
    setTimeout(() => {
      window.location.href = '/admin/projects.html';
    }, 2000);
  }
}

// Render gallery grid
function renderGallery() {
  const grid = document.getElementById('galleryGrid');
  grid.innerHTML = '';

  projectData.images.forEach((image, index) => {
    const item = document.createElement('div');
    item.className = 'gallery-item';
    item.dataset.index = index;

    item.innerHTML = `
      <img src="${image.src}" alt="${image.alt}">
      <span class="gallery-index">${index + 1}</span>
    `;

    item.addEventListener('click', () => openImageModal(index));
    grid.appendChild(item);
  });

  // Initialize sortable
  if (window.Sortable) {
    new Sortable(grid, {
      animation: 150,
      ghostClass: 'sortable-ghost',
      onEnd: (evt) => {
        const moved = projectData.images.splice(evt.oldIndex, 1)[0];
        projectData.images.splice(evt.newIndex, 0, moved);
        renderGallery();
      }
    });
  }
}

// Render info lines
function renderInfo() {
  const container = document.getElementById('infoContainer');
  container.innerHTML = '';

  (projectData.info || []).forEach((line, index) => {
    const div = document.createElement('div');
    div.className = 'info-line';
    div.innerHTML = `
      <input type="text" value="${line}" data-index="${index}">
      <button type="button" class="btn btn-small btn-danger remove-info" data-index="${index}">&times;</button>
    `;
    container.appendChild(div);
  });

  // Add event listeners
  container.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', (e) => {
      const index = parseInt(e.target.dataset.index);
      projectData.info[index] = e.target.value;
    });
  });

  container.querySelectorAll('.remove-info').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      projectData.info.splice(index, 1);
      renderInfo();
    });
  });
}

// Add info line
document.getElementById('addInfoLine').addEventListener('click', () => {
  if (!projectData.info) {
    projectData.info = [];
  }
  projectData.info.push('');
  renderInfo();

  // Focus the new input
  const inputs = document.querySelectorAll('#infoContainer input');
  inputs[inputs.length - 1].focus();
});

// Open image edit modal
function openImageModal(index) {
  const image = projectData.images[index];

  document.getElementById('imageIndex').value = index;
  document.getElementById('modalImage').src = image.src;
  document.getElementById('imageAlt').value = image.alt;

  openModal('editImageModal');
}

// Close image modal
document.getElementById('closeImageModal').addEventListener('click', () => {
  closeModal('editImageModal');
});

// Update image
document.getElementById('editImageForm').addEventListener('submit', (e) => {
  e.preventDefault();

  const index = parseInt(document.getElementById('imageIndex').value);
  projectData.images[index].alt = document.getElementById('imageAlt').value;

  renderGallery();
  closeModal('editImageModal');
  showToast('Image updated');
});

// Delete image
document.getElementById('deleteImageBtn').addEventListener('click', () => {
  if (!confirmAction('Are you sure you want to remove this image from the gallery?')) return;

  const index = parseInt(document.getElementById('imageIndex').value);
  projectData.images.splice(index, 1);

  renderGallery();
  closeModal('editImageModal');
  showToast('Image removed');
});

// Image upload
const uploadArea = document.getElementById('uploadArea');
const imageUpload = document.getElementById('imageUpload');

uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
  uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('dragover');
  handleFiles(e.dataTransfer.files);
});

imageUpload.addEventListener('change', (e) => {
  handleFiles(e.target.files);
});

async function handleFiles(files) {
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;

    try {
      showToast('Uploading ' + file.name + '...', 'info');
      const result = await uploadFile(`/api/upload/project/${slug}`, file);

      projectData.images.push({
        src: result.path,
        alt: projectData.title
      });

      renderGallery();
      showToast('Image uploaded', 'success');
    } catch (err) {
      showToast('Failed to upload ' + file.name + ': ' + err.message, 'error');
    }
  }

  // Clear input
  imageUpload.value = '';
}

// Save changes
document.getElementById('saveBtn').addEventListener('click', async () => {
  const btn = document.getElementById('saveBtn');
  btn.disabled = true;
  btn.textContent = 'Saving...';

  try {
    await api(`/api/projects/${slug}`, {
      method: 'PUT',
      body: JSON.stringify(projectData)
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
