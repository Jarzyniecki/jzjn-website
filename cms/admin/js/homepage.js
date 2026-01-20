/**
 * JZJN CMS - Homepage Slideshow Editor
 */

let homepageData = { slides: [], sidebar: {} };
let projects = [];

// Load data
async function loadData() {
  try {
    const [homepage, projectsData] = await Promise.all([
      api('/api/homepage'),
      api('/api/projects')
    ]);

    homepageData = homepage;
    projects = projectsData.projects || [];

    renderSlides();
    populateProjectSelects();
  } catch (err) {
    showToast('Failed to load data: ' + err.message, 'error');
  }
}

// Populate project dropdowns
function populateProjectSelects() {
  const selects = ['projectLink', 'newSlideProject'];
  selects.forEach(id => {
    const select = document.getElementById(id);
    if (!select) return;

    // Keep first option (No link)
    select.innerHTML = '<option value="">No link</option>';

    projects.forEach(p => {
      const option = document.createElement('option');
      option.value = `projects/${p.slug}.html`;
      option.textContent = p.title;
      select.appendChild(option);
    });
  });
}

// Render slides grid
function renderSlides() {
  const grid = document.getElementById('slidesGrid');
  grid.innerHTML = '';

  homepageData.slides.forEach((slide, index) => {
    const card = document.createElement('div');
    card.className = 'slide-card';
    card.dataset.index = index;

    card.innerHTML = `
      <img src="/${slide.image}" alt="${slide.name}">
      <div class="slide-info">
        <div class="slide-name">${slide.name}</div>
        <div class="slide-link">${slide.projectLink ? 'Linked' : 'No link'}</div>
      </div>
    `;

    card.addEventListener('click', () => openEditModal(index));
    grid.appendChild(card);
  });

  // Initialize sortable
  if (window.Sortable) {
    new Sortable(grid, {
      animation: 150,
      ghostClass: 'sortable-ghost',
      dragClass: 'sortable-drag',
      onEnd: (evt) => {
        const moved = homepageData.slides.splice(evt.oldIndex, 1)[0];
        homepageData.slides.splice(evt.newIndex, 0, moved);
      }
    });
  }
}

// Open edit modal
function openEditModal(index) {
  const slide = homepageData.slides[index];

  document.getElementById('slideIndex').value = index;
  document.getElementById('slideName').value = slide.name;
  document.getElementById('projectLink').value = slide.projectLink || '';
  document.getElementById('isLight').checked = slide.isLight || false;
  document.getElementById('currentImage').src = '/' + slide.image;
  document.getElementById('newImage').value = '';

  openModal('editModal');
}

// Save slide edits
document.getElementById('editForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const index = parseInt(document.getElementById('slideIndex').value);
  const slide = homepageData.slides[index];

  slide.name = document.getElementById('slideName').value;
  slide.projectLink = document.getElementById('projectLink').value || null;
  slide.isLight = document.getElementById('isLight').checked;

  // Handle new image upload
  const newImageInput = document.getElementById('newImage');
  if (newImageInput.files.length > 0) {
    try {
      const result = await uploadFile('/api/upload/slideshow', newImageInput.files[0]);
      slide.image = result.path;
    } catch (err) {
      showToast('Failed to upload image: ' + err.message, 'error');
      return;
    }
  }

  renderSlides();
  closeModal('editModal');
  showToast('Slide updated');
});

// Delete slide
document.getElementById('deleteSlideBtn').addEventListener('click', () => {
  if (!confirmAction('Are you sure you want to delete this slide?')) return;

  const index = parseInt(document.getElementById('slideIndex').value);
  homepageData.slides.splice(index, 1);

  renderSlides();
  closeModal('editModal');
  showToast('Slide deleted');
});

// Add slide modal
document.getElementById('addSlideBtn').addEventListener('click', () => {
  document.getElementById('addForm').reset();
  openModal('addModal');
});

document.getElementById('closeAddModal').addEventListener('click', () => {
  closeModal('addModal');
});

document.getElementById('cancelAdd').addEventListener('click', () => {
  closeModal('addModal');
});

// Add new slide
document.getElementById('addForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('newSlideName').value;
  const projectLink = document.getElementById('newSlideProject').value || null;
  const isLight = document.getElementById('newSlideIsLight').checked;
  const imageInput = document.getElementById('newSlideImage');

  if (imageInput.files.length === 0) {
    showToast('Please select an image', 'error');
    return;
  }

  try {
    const result = await uploadFile('/api/upload/slideshow', imageInput.files[0]);

    homepageData.slides.push({
      id: Date.now(),
      image: result.path,
      name,
      projectLink,
      isLight
    });

    renderSlides();
    closeModal('addModal');
    showToast('Slide added');
  } catch (err) {
    showToast('Failed to add slide: ' + err.message, 'error');
  }
});

// Save all changes
document.getElementById('saveBtn').addEventListener('click', async () => {
  const btn = document.getElementById('saveBtn');
  btn.disabled = true;
  btn.textContent = 'Saving...';

  try {
    await api('/api/homepage', {
      method: 'PUT',
      body: JSON.stringify(homepageData)
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
