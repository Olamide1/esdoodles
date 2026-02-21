/* ============================================================
   GALLERY — work.html
   Loads projects.json, renders grid, filters, search, lightbox.
   ============================================================ */

const LANES = ['all', 'illustration', 'comics', 'writing', 'social', 'interactive', 'editorial'];
const LANE_LABELS = {
  all: 'All',
  illustration: 'Illustration',
  comics: 'Comics',
  writing: 'Writing',
  social: 'Social Media',
  interactive: 'Interactive',
  editorial: 'Editorial',
};

let allProjects   = [];
let currentFilter = 'all';
let currentSearch = '';
let lightboxImages = [];
let lightboxIndex  = 0;
let releaseFocusTrap = null;

/* ── Build filter chips ── */
function buildFilters(container) {
  container.innerHTML = LANES.map(lane => `
    <button
      class="filter-chip${lane === currentFilter ? ' active' : ''}"
      data-lane="${lane}"
      aria-pressed="${lane === currentFilter}"
    >${LANE_LABELS[lane]}</button>`).join('');

  container.querySelectorAll('.filter-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      currentFilter = btn.dataset.lane;
      container.querySelectorAll('.filter-chip').forEach(b => {
        b.classList.toggle('active', b.dataset.lane === currentFilter);
        b.setAttribute('aria-pressed', String(b.dataset.lane === currentFilter));
      });
      renderGallery();
    });
  });
}

/* ── Render gallery ── */
function renderGallery() {
  const grid = document.getElementById('gallery-grid');
  if (!grid) return;

  const filtered = allProjects.filter(p => {
    const matchLane   = currentFilter === 'all' || p.lane === currentFilter;
    const q           = currentSearch.toLowerCase();
    const matchSearch = !q
      || p.title.toLowerCase().includes(q)
      || (p.tags || []).some(t => t.toLowerCase().includes(q));
    return matchLane && matchSearch;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `<p class="gallery-empty">nothing here yet for this filter — try another.</p>`;
    return;
  }

  grid.innerHTML = filtered.map((p, i) => {
    const isExternal  = !!p.external_link;
    const href        = isExternal
      ? escHtml(p.external_link)
      : `project.html?id=${encodeURIComponent(p.id)}`;
    const linkAttrs   = isExternal
      ? ' target="_blank" rel="noopener noreferrer"'
      : '';
    const ariaLabel   = isExternal
      ? `${escHtml(p.title)} — ${LANE_LABELS[p.lane] || p.lane}, ${p.year} (opens in new tab)`
      : `${escHtml(p.title)} — ${LANE_LABELS[p.lane] || p.lane}, ${p.year}`;

    return `
    <a
      href="${href}"${linkAttrs}
      class="project-card${isExternal ? ' project-card--external' : ''}"
      data-lane="${escHtml(p.lane)}"
      data-title="${escHtml(p.title)}"
      data-tags="${escHtml((p.tags || []).join(','))}"
      data-reveal
      style="animation-delay:${i * 40}ms"
      aria-label="${ariaLabel}"
    >
      <div class="card__thumb">
        <img
          src="${escHtml(p.thumbnail)}"
          alt="${escHtml(p.alt_text || p.title)}"
          width="400" height="300"
          loading="lazy"
          onerror="this.style.display='none';this.parentElement.classList.add('img-placeholder')"
        >
        <img
          src="assets/icons/sparkle.svg"
          class="card__sparkle"
          alt=""
          aria-hidden="true"
        >
      </div>
      <div class="card__body">
        <div class="card__meta">
          ${laneBadge(p.lane)}
          <span class="card__year">${p.year}</span>
          ${isExternal ? '<span class="card__external-hint" aria-hidden="true">↗</span>' : ''}
        </div>
        <h2 class="card__title">${escHtml(p.title)}</h2>
      </div>
    </a>`;
  }).join('');

  // Re-observe scroll reveal on new elements
  if (typeof observeRevealElements === 'function') {
    observeRevealElements(grid);
  }
}

/* ── Lightbox ── */
function openLightbox(images, index, caption) {
  const lb  = document.getElementById('lightbox');
  if (!lb) return;

  lightboxImages = images;
  lightboxIndex  = index;

  showLightboxSlide();
  lb.removeAttribute('hidden');
  document.body.style.overflow = 'hidden';
  releaseFocusTrap = trapFocus(lb);
  lb.focus();
}

function showLightboxSlide() {
  const lb = document.getElementById('lightbox');
  if (!lb) return;

  const img     = lb.querySelector('.lightbox__img');
  const counter = lb.querySelector('.lightbox__counter');

  img.src = lightboxImages[lightboxIndex].src || lightboxImages[lightboxIndex];
  img.alt = lightboxImages[lightboxIndex].alt || '';

  if (counter) {
    counter.textContent = `${lightboxIndex + 1} / ${lightboxImages.length}`;
  }

  const prevBtn = lb.querySelector('.lightbox__prev');
  const nextBtn = lb.querySelector('.lightbox__next');
  if (prevBtn) prevBtn.hidden = lightboxImages.length <= 1;
  if (nextBtn) nextBtn.hidden = lightboxImages.length <= 1;
}

function closeLightbox() {
  const lb = document.getElementById('lightbox');
  if (!lb) return;
  lb.setAttribute('hidden', '');
  document.body.style.overflow = '';
  if (releaseFocusTrap) { releaseFocusTrap(); releaseFocusTrap = null; }
}

function lightboxNext() {
  lightboxIndex = (lightboxIndex + 1) % lightboxImages.length;
  showLightboxSlide();
}

function lightboxPrev() {
  lightboxIndex = (lightboxIndex - 1 + lightboxImages.length) % lightboxImages.length;
  showLightboxSlide();
}

function initLightbox() {
  const lb = document.getElementById('lightbox');
  if (!lb) return;

  lb.querySelector('.lightbox__close')?.addEventListener('click', closeLightbox);
  lb.querySelector('.lightbox__prev')?.addEventListener('click', lightboxPrev);
  lb.querySelector('.lightbox__next')?.addEventListener('click', lightboxNext);

  // Click outside image to close
  lb.addEventListener('click', e => {
    if (e.target === lb || e.target.classList.contains('lightbox__inner')) closeLightbox();
  });

  // Keyboard navigation
  document.addEventListener('keydown', e => {
    if (lb.hasAttribute('hidden')) return;
    if (e.key === 'Escape')     closeLightbox();
    if (e.key === 'ArrowRight') lightboxNext();
    if (e.key === 'ArrowLeft')  lightboxPrev();
  });
}

/* ── Init ── */
async function initGallery() {
  try {
    allProjects = await fetchJSON('data/projects.json');
  } catch (err) {
    console.error('Gallery: failed to load projects.json', err);
    const grid = document.getElementById('gallery-grid');
    if (grid) grid.innerHTML = `<p class="gallery-empty">Couldn't load projects. Ensure you're running a local server.</p>`;
    return;
  }

  // Filter chips
  const chipsContainer = document.getElementById('filter-chips');
  if (chipsContainer) buildFilters(chipsContainer);

  // Search input
  const searchEl = document.getElementById('gallery-search');
  if (searchEl) {
    searchEl.addEventListener('input', debounce(() => {
      currentSearch = searchEl.value.trim();
      renderGallery();
    }, 250));
  }

  // Check URL param for pre-selected filter
  const filterParam = getParam('filter');
  if (filterParam && LANES.includes(filterParam)) {
    currentFilter = filterParam;
    const chips = document.querySelectorAll('.filter-chip');
    chips.forEach(c => {
      c.classList.toggle('active', c.dataset.lane === currentFilter);
      c.setAttribute('aria-pressed', String(c.dataset.lane === currentFilter));
    });
  }

  renderGallery();
  initLightbox();
}

if (document.getElementById('gallery-grid')) {
  document.addEventListener('DOMContentLoaded', initGallery);
}
