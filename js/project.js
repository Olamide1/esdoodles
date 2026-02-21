/* ============================================================
   PROJECT — project.html
   Reads ?id= from URL, fetches projects.json, renders detail.
   ============================================================ */

let projectLightboxImages = [];
let projectLightboxIndex  = 0;
let releaseFocusTrap      = null;

/* ── Carousel ── */
function buildCarousel(images, altText) {
  if (!images || images.length === 0) return '';
  if (images.length === 1) {
    return `
      <div class="project-single-img" style="border-radius:var(--radius-lg);overflow:hidden">
        <img
          src="${escHtml(images[0])}"
          alt="${escHtml(altText)}"
          style="width:100%;object-fit:contain;max-height:60vh;background:var(--surface-2)"
          loading="eager"
          onerror="this.style.display='none';this.parentElement.classList.add('img-placeholder')"
        >
      </div>`;
  }

  const slides = images.map((src, i) => `
    <div class="carousel__slide" role="group" aria-label="Image ${i + 1} of ${images.length}">
      <img
        src="${escHtml(src)}"
        alt="${escHtml(altText)}${images.length > 1 ? ` (${i + 1} of ${images.length})` : ''}"
        loading="${i === 0 ? 'eager' : 'lazy'}"
        onerror="this.style.display='none';this.parentElement.classList.add('img-placeholder')"
      >
    </div>`).join('');

  const dots = images.map((_, i) => `
    <button class="carousel__dot${i === 0 ? ' active' : ''}" data-index="${i}" aria-label="Go to image ${i + 1}"></button>
  `).join('');

  return `
    <div class="carousel" aria-label="Project images">
      <div class="carousel__track" id="carousel-track">${slides}</div>
      <button class="carousel__btn-prev" aria-label="Previous image">&#8249;</button>
      <button class="carousel__btn-next" aria-label="Next image">&#8250;</button>
      <div class="carousel__controls" role="tablist" aria-label="Carousel navigation">
        ${dots}
      </div>
    </div>`;
}

function initCarousel() {
  const track    = document.getElementById('carousel-track');
  if (!track) return;

  const slides   = track.querySelectorAll('.carousel__slide');
  const dots     = document.querySelectorAll('.carousel__dot');
  const prevBtn  = document.querySelector('.carousel__btn-prev');
  const nextBtn  = document.querySelector('.carousel__btn-next');
  let current    = 0;

  function goTo(i) {
    current = (i + slides.length) % slides.length;
    track.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((d, idx) => d.classList.toggle('active', idx === current));
  }

  prevBtn?.addEventListener('click', () => goTo(current - 1));
  nextBtn?.addEventListener('click', () => goTo(current + 1));
  dots.forEach(dot => dot.addEventListener('click', () => goTo(Number(dot.dataset.index))));

  // Keyboard
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft')  goTo(current - 1);
    if (e.key === 'ArrowRight') goTo(current + 1);
  });

  // Click image for lightbox
  slides.forEach((slide, i) => {
    slide.style.cursor = 'zoom-in';
    slide.addEventListener('click', () => {
      openProjectLightbox(
        Array.from(slides).map(s => ({ src: s.querySelector('img')?.src, alt: s.querySelector('img')?.alt })),
        i
      );
    });
  });
}

/* ── Lightbox ── */
function openProjectLightbox(images, index) {
  const lb = document.getElementById('project-lightbox');
  if (!lb) return;

  projectLightboxImages = images;
  projectLightboxIndex  = index;
  showProjectLightboxSlide();
  lb.removeAttribute('hidden');
  document.body.style.overflow = 'hidden';
  releaseFocusTrap = trapFocus(lb);
}

function showProjectLightboxSlide() {
  const lb = document.getElementById('project-lightbox');
  if (!lb) return;
  const img     = lb.querySelector('.lightbox__img');
  const counter = lb.querySelector('.lightbox__counter');
  const data    = projectLightboxImages[projectLightboxIndex];
  img.src = data.src;
  img.alt = data.alt || '';
  if (counter) counter.textContent = `${projectLightboxIndex + 1} / ${projectLightboxImages.length}`;
}

function closeProjectLightbox() {
  const lb = document.getElementById('project-lightbox');
  if (!lb) return;
  lb.setAttribute('hidden', '');
  document.body.style.overflow = '';
  if (releaseFocusTrap) { releaseFocusTrap(); releaseFocusTrap = null; }
}

function initProjectLightbox() {
  const lb = document.getElementById('project-lightbox');
  if (!lb) return;

  lb.querySelector('.lightbox__close')?.addEventListener('click', closeProjectLightbox);
  lb.querySelector('.lightbox__prev')?.addEventListener('click', () => {
    projectLightboxIndex = (projectLightboxIndex - 1 + projectLightboxImages.length) % projectLightboxImages.length;
    showProjectLightboxSlide();
  });
  lb.querySelector('.lightbox__next')?.addEventListener('click', () => {
    projectLightboxIndex = (projectLightboxIndex + 1) % projectLightboxImages.length;
    showProjectLightboxSlide();
  });

  lb.addEventListener('click', e => {
    if (e.target === lb) closeProjectLightbox();
  });

  document.addEventListener('keydown', e => {
    if (lb.hasAttribute('hidden')) return;
    if (e.key === 'Escape')     closeProjectLightbox();
    if (e.key === 'ArrowRight') {
      projectLightboxIndex = (projectLightboxIndex + 1) % projectLightboxImages.length;
      showProjectLightboxSlide();
    }
    if (e.key === 'ArrowLeft') {
      projectLightboxIndex = (projectLightboxIndex - 1 + projectLightboxImages.length) % projectLightboxImages.length;
      showProjectLightboxSlide();
    }
  });
}

/* ── Render metrics ── */
function renderMetrics(metrics) {
  if (!metrics || metrics.length === 0) return '';
  const items = metrics.map(m => {
    const isNDA = m.visibility === 'nda';
    return `
      <div class="metrics-grid__item">
        <div class="metrics-grid__value">${isNDA ? '<span class="nda-badge">NDA</span>' : escHtml(String(m.value))}</div>
        <div class="metrics-grid__label">${escHtml(m.label)}</div>
        <div class="metrics-grid__timeframe">${escHtml(m.timeframe)}</div>
      </div>`;
  }).join('');

  return `
    <section aria-label="Project metrics" style="margin-top:var(--sp-7)">
      <h2 class="section__title" style="margin-bottom:var(--sp-5)">results</h2>
      <div class="metrics-grid">${items}</div>
    </section>`;
}

/* ── Main render ── */
async function initProjectPage() {
  const id = getParam('id');
  const main = document.getElementById('main');
  if (!id || !main) return;

  let projects;
  try {
    projects = await fetchJSON('data/projects.json');
  } catch (e) {
    main.innerHTML = `<div class="container" style="padding:var(--sp-10) 0;text-align:center"><p>Could not load project data. Make sure you're running a local server.</p></div>`;
    return;
  }

  const project = projects.find(p => p.id === id);
  if (!project) {
    main.innerHTML = `
      <div class="container" style="padding:var(--sp-10) 0;text-align:center">
        <p class="text-muted">Project not found. <a href="work.html">← Back to work</a></p>
      </div>`;
    return;
  }

  // Update page title & OG
  document.title = `${project.title} — E.S.Doodles`;

  // Adjacent projects
  const currentIndex = projects.indexOf(project);
  const prevProject  = projects[currentIndex - 1];
  const nextProject  = projects[currentIndex + 1];

  const storyHTML = (project.story || []).map(para =>
    `<p>${escHtml(para)}</p>`
  ).join('');

  const toolsHTML = (project.tools || []).map(t =>
    `<span class="tool-tag">${escHtml(t)}</span>`
  ).join('');

  const tagsHTML = (project.tags || []).map(t =>
    `<span class="tag-pill">${escHtml(t)}</span>`
  ).join('');

  const prevLink = prevProject ? `
    <a href="project.html?id=${encodeURIComponent(prevProject.id)}" class="project-nav__link">
      <span class="project-nav__dir">← previous</span>
      <span class="project-nav__title">${escHtml(prevProject.title)}</span>
    </a>` : `<span></span>`;

  const nextLink = nextProject ? `
    <a href="project.html?id=${encodeURIComponent(nextProject.id)}" class="project-nav__link" style="text-align:right;margin-left:auto">
      <span class="project-nav__dir">next →</span>
      <span class="project-nav__title">${escHtml(nextProject.title)}</span>
    </a>` : `<span></span>`;

  main.innerHTML = `
    <div class="project-detail">
      <div class="container">

        <!-- Media gallery -->
        ${buildCarousel(project.images, project.alt_text || project.title)}

        <!-- Header -->
        <div class="project-detail__header" style="margin-top:var(--sp-7)">
          <div class="project-detail__meta">
            ${laneBadge(project.lane)}
            <span class="label" style="color:var(--text-faint)">${project.year}</span>
          </div>
          <h1 class="project-detail__title">${escHtml(project.title)}</h1>
          <p class="project-detail__desc">${escHtml(project.description)}</p>
          ${tagsHTML ? `<div class="writing-item__tags" style="margin-top:var(--sp-4)">${tagsHTML}</div>` : ''}
        </div>

        <!-- Body -->
        <div class="project-detail__body">
          <div class="project-story" aria-label="Project story">
            ${storyHTML}

            ${project.lane === 'social' ? renderMetrics(project.metrics) : ''}
          </div>

          <aside class="project-aside" aria-label="Project details">
            <div class="project-aside__block">
              <span class="project-aside__label">Role</span>
              <p class="project-aside__value">${escHtml(project.role || '—')}</p>
            </div>
            <div class="project-aside__block">
              <span class="project-aside__label">Tools</span>
              <div class="project-aside__tools">${toolsHTML || '—'}</div>
            </div>
            <div class="project-aside__block">
              <span class="project-aside__label">Year</span>
              <p class="project-aside__value">${project.year}</p>
            </div>
            ${project.external_link ? `
              <a href="${escHtml(project.external_link)}"
                 class="btn btn--secondary btn--sm"
                 target="_blank" rel="noopener noreferrer">
                view external ↗
              </a>` : ''}
          </aside>
        </div>

        <!-- Project nav -->
        <div class="project-nav" aria-label="Navigate between projects">
          ${prevLink}
          ${nextLink}
        </div>

      </div>
    </div>

    <!-- Lightbox -->
    <div id="project-lightbox" class="lightbox" role="dialog" aria-modal="true" aria-label="Image viewer" hidden tabindex="-1">
      <div class="lightbox__inner">
        <img class="lightbox__img" src="" alt="">
        <p class="lightbox__counter" aria-live="polite"></p>
      </div>
      <button class="lightbox__close" aria-label="Close image viewer">&#215;</button>
      <button class="lightbox__prev" aria-label="Previous image">&#8249;</button>
      <button class="lightbox__next" aria-label="Next image">&#8250;</button>
    </div>`;

  initCarousel();
  initProjectLightbox();

  // Scroll reveal on new elements
  document.querySelectorAll('[data-reveal]').forEach(el => {
    el.classList.add('visible');
  });
}

document.addEventListener('DOMContentLoaded', initProjectPage);
