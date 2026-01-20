/**
 * JZJN CMS - Projects Index Editor
 */

let projectsData = { projects: [] };

// Load data
async function loadData() {
  try {
    projectsData = await api('/api/projects');
    renderProjects();
  } catch (err) {
    showToast('Failed to load data: ' + err.message, 'error');
  }
}

// Render projects list
function renderProjects() {
  const list = document.getElementById('projectsList');
  list.innerHTML = '';

  projectsData.projects.forEach((project, index) => {
    const item = document.createElement('div');
    item.className = 'project-item';
    item.dataset.index = index;
    item.dataset.slug = project.slug;

    item.innerHTML = `
      <span class="drag-handle">&#9776;</span>
      <img src="/${project.thumbnail}" alt="${project.title}">
      <div class="project-info">
        <div class="project-title">${project.title}</div>
        ${project.subtitle ? `<div class="project-subtitle">${project.subtitle}</div>` : ''}
      </div>
      <div class="project-actions">
        <button class="btn btn-small btn-secondary edit-index-btn" data-index="${index}">Edit</button>
        <a href="/admin/project-edit.html?slug=${project.slug}" class="btn btn-small btn-secondary">Gallery</a>
      </div>
    `;

    list.appendChild(item);
  });

  // Add edit button listeners
  list.querySelectorAll('.edit-index-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openEditModal(parseInt(e.target.dataset.index));
    });
  });

  // Initialize sortable
  if (window.Sortable) {
    new Sortable(list, {
      animation: 150,
      handle: '.drag-handle',
      ghostClass: 'sortable-ghost',
      dragClass: 'sortable-drag',
      onEnd: (evt) => {
        const moved = projectsData.projects.splice(evt.oldIndex, 1)[0];
        projectsData.projects.splice(evt.newIndex, 0, moved);
      }
    });
  }
}

// Open edit modal for index entry
function openEditModal(index) {
  const project = projectsData.projects[index];

  document.getElementById('editSlug').value = project.slug;
  document.getElementById('editTitle').value = project.title;
  document.getElementById('editSubtitle').value = project.subtitle || '';
  document.getElementById('currentThumbnail').src = '/' + project.thumbnail;
  document.getElementById('newThumbnail').value = '';

  openModal('editModal');
}

// Close edit modal
document.getElementById('closeEditModal').addEventListener('click', () => {
  closeModal('editModal');
});

// Update index entry
document.getElementById('editForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const slug = document.getElementById('editSlug').value;
  const project = projectsData.projects.find(p => p.slug === slug);

  if (!project) {
    showToast('Project not found', 'error');
    return;
  }

  project.title = document.getElementById('editTitle').value;
  project.subtitle = document.getElementById('editSubtitle').value || null;

  // Handle new thumbnail upload
  const newThumbnailInput = document.getElementById('newThumbnail');
  if (newThumbnailInput.files.length > 0) {
    try {
      const result = await uploadFile('/api/upload/thumbnail', newThumbnailInput.files[0]);
      project.thumbnail = result.path;
    } catch (err) {
      showToast('Failed to upload thumbnail: ' + err.message, 'error');
      return;
    }
  }

  renderProjects();
  closeModal('editModal');
  showToast('Project updated');
});

// Delete project
document.getElementById('deleteProjectBtn').addEventListener('click', async () => {
  if (!confirmAction('Are you sure you want to delete this project? This will also delete its gallery and data.')) return;

  const slug = document.getElementById('editSlug').value;

  try {
    await api(`/api/projects/${slug}`, { method: 'DELETE' });

    projectsData.projects = projectsData.projects.filter(p => p.slug !== slug);
    renderProjects();
    closeModal('editModal');
    showToast('Project deleted', 'success');
  } catch (err) {
    showToast('Failed to delete: ' + err.message, 'error');
  }
});

// Add project modal
document.getElementById('addProjectBtn').addEventListener('click', () => {
  document.getElementById('addForm').reset();
  openModal('addModal');
});

document.getElementById('closeAddModal').addEventListener('click', () => {
  closeModal('addModal');
});

document.getElementById('cancelAdd').addEventListener('click', () => {
  closeModal('addModal');
});

// Create new project
document.getElementById('addForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const title = document.getElementById('projectTitle').value;
  const subtitle = document.getElementById('projectSubtitle').value;

  try {
    const result = await api('/api/projects', {
      method: 'POST',
      body: JSON.stringify({ title, subtitle })
    });

    // Reload data to get the new project
    await loadData();
    closeModal('addModal');
    showToast('Project created. Add a thumbnail and gallery images.', 'success');

    // Navigate to edit the new project
    window.location.href = `/admin/project-edit.html?slug=${result.slug}`;
  } catch (err) {
    showToast('Failed to create project: ' + err.message, 'error');
  }
});

// Save order
document.getElementById('saveBtn').addEventListener('click', async () => {
  const btn = document.getElementById('saveBtn');
  btn.disabled = true;
  btn.textContent = 'Saving...';

  try {
    await api('/api/projects', {
      method: 'PUT',
      body: JSON.stringify(projectsData)
    });
    showToast('Order saved and HTML regenerated!', 'success');
  } catch (err) {
    showToast('Failed to save: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save Order';
  }
});

// Initialize
loadData();
