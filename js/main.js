/* ============================================================
   MAIN — Global init: nav, footer, scroll reveal, year
   Runs on every page.
   NOTE: Requires utils.js, theme.js, mode.js loaded first.
   ============================================================ */

/* ── Module-level reveal observer ──────────────────────────── */
let _revealObserver = null;

/**
 * Set up the IntersectionObserver and observe all current [data-reveal] elements.
 * Safe to call multiple times — already-observed elements are skipped.
 */
function initScrollReveal() {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reducedMotion) {
    document.querySelectorAll('[data-reveal]').forEach(el => el.classList.add('visible'));
    return;
  }

  if (!_revealObserver) {
    _revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        _revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' });
  }

  observeRevealElements();
}

/**
 * Observe any [data-reveal] elements in `root` that haven't been observed yet.
 * Call this after dynamically injecting HTML that contains [data-reveal] elements.
 * @param {Document|Element} [root=document]
 */
function observeRevealElements(root = document) {
  root.querySelectorAll('[data-reveal]').forEach(el => {
    if (el.dataset.revealObserved) return;
    el.dataset.revealObserved = '1';

    if (!_revealObserver) {
      el.classList.add('visible');
    } else {
      _revealObserver.observe(el);
    }
  });
}

/* ── Nav HTML template ── */
function buildNav() {
  const page  = location.pathname.split('/').pop() || 'index.html';
  const links = [
    { href: 'index.html',       label: 'Home' },
    { href: 'work.html',        label: 'Work' },
    { href: 'writing.html',     label: 'Writing' },
    { href: 'social.html',      label: 'Social Media' },
    { href: 'interactive.html', label: 'Interactive' },
    { href: 'about.html',       label: 'About' },
    { href: 'hire.html',        label: 'Hire Me' },
    { href: 'contact.html',     label: 'Contact' },
  ];

  const items = links.map(({ href, label }) => {
    const current = href === page ? ' aria-current="page"' : '';
    const cls     = label === 'Hire Me'
      ? 'class="nav__link nav__link--hire"'
      : 'class="nav__link"';
    return `<li><a href="${href}" ${cls}${current}>${label}</a></li>`;
  }).join('');

  return `
<nav class="site-nav" aria-label="Site navigation">
  <a href="index.html" class="nav__logo" aria-label="E.S.Doodles — home">
    <span class="nav__logo-text">E.S.Doodles</span>
  </a>

  <button
    class="nav__hamburger"
    aria-label="Open navigation menu"
    aria-expanded="false"
    aria-controls="nav-list"
  >
    <span class="hamburger-bar"></span>
    <span class="hamburger-bar"></span>
    <span class="hamburger-bar"></span>
  </button>

  <ul class="nav__list" id="nav-list" role="list">
    ${items}
  </ul>

  <div class="nav__controls">
    <div class="mode-toggle-group" role="group" aria-label="View mode">
      <button class="mode-btn" data-mode="portfolio" aria-pressed="true">portfolio</button>
      <button class="mode-btn" data-mode="hire"      aria-pressed="false">hire</button>
    </div>
    <button
      class="theme-toggle"
      aria-label="Switch to light theme"
      title="Toggle theme"
    >
      <span class="theme-icon-sun"  aria-hidden="true">☀</span>
      <span class="theme-icon-moon" aria-hidden="true" style="display:none">☾</span>
    </button>
  </div>
</nav>`;
}

function injectNav() {
  const header = document.getElementById('site-header');
  if (!header) return;
  header.innerHTML = buildNav();

  const burger  = header.querySelector('.nav__hamburger');
  const navList = header.querySelector('.nav__list');
  if (burger && navList) {
    burger.addEventListener('click', () => {
      const open = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', String(!open));
      navList.classList.toggle('open', !open);
    });
    document.addEventListener('click', e => {
      if (!header.contains(e.target)) {
        burger.setAttribute('aria-expanded', 'false');
        navList.classList.remove('open');
      }
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        burger.setAttribute('aria-expanded', 'false');
        navList.classList.remove('open');
      }
    });
  }
}

/* ── Theme icon sync ── */
function syncThemeIcon() {
  const theme = document.documentElement.dataset.theme || 'dark';
  document.querySelectorAll('.theme-toggle').forEach(btn => {
    const sun  = btn.querySelector('.theme-icon-sun');
    const moon = btn.querySelector('.theme-icon-moon');
    if (!sun || !moon) return;
    sun.style.display  = theme === 'dark'  ? '' : 'none';
    moon.style.display = theme === 'light' ? '' : 'none';
  });
}

function patchThemeToggleClick() {
  document.getElementById('site-header')?.addEventListener('click', e => {
    const btn = e.target.closest('.theme-toggle');
    if (btn) { toggleTheme(); syncThemeIcon(); }
  });
}

/* ── Footer ── */
async function injectFooter(profile) {
  const footer = document.getElementById('site-footer');
  if (!footer) return;

  const socialLinks = [
    { key: 'instagram', label: 'Instagram', icon: '📸' },
    { key: 'medium',    label: 'Medium',    icon: '✍' },
    { key: 'rive',      label: 'Rive',      icon: '✦' },
    { key: 'linkedin',  label: 'LinkedIn',  icon: '💼' },
  ];

  const socialHTML = socialLinks
    .filter(s => profile.links[s.key])
    .map(s => `
      <a href="${escHtml(profile.links[s.key])}"
         class="footer__social-link"
         target="_blank"
         rel="noopener noreferrer"
         aria-label="${escHtml(s.label)} — opens in new tab">
        <span aria-hidden="true">${s.icon}</span> ${escHtml(s.label)}
      </a>`)
    .join('');

  footer.innerHTML = `
<div class="footer__bg" aria-hidden="true">
  <img src="assets/patterns/starfield-tile.svg" class="footer__starfield" alt="" role="presentation">
</div>
<div class="container footer__inner">
  <div class="footer__brand">
    <span class="footer__name">${escHtml(profile.name)}</span>
    <p class="footer__tagline">writer · illustrator · social media manager</p>
  </div>
  <nav class="footer__nav" aria-label="Footer navigation">
    <ul role="list">
      <li><a href="work.html">Work</a></li>
      <li><a href="writing.html">Writing</a></li>
      <li><a href="social.html">Social Media</a></li>
      <li><a href="interactive.html">Interactive</a></li>
      <li><a href="about.html">About</a></li>
      <li><a href="hire.html">Hire Me</a></li>
      <li><a href="contact.html">Contact</a></li>
    </ul>
  </nav>
  <div class="footer__social" aria-label="External profiles">
    ${socialHTML}
  </div>
  <p class="footer__copy">
    &copy; <span id="year"></span> ${escHtml(profile.name)}. All rights reserved.
  </p>
</div>`;

  const yearEl = footer.querySelector('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

/* ═══════════════════════════════════════════════
   HOME PAGE — populate all dynamic sections
═══════════════════════════════════════════════ */

async function initHomePage() {
  if (!document.querySelector('.hero')) return;

  let copy, projects, writing, profile;
  try {
    [copy, projects, writing, profile] = await Promise.all([
      fetchJSON('data/copy.json'),
      fetchJSON('data/projects.json'),
      fetchJSON('data/writing.json'),
      fetchJSON('data/profile.json'),
    ]);
  } catch (err) {
    console.warn('Home page data load error:', err);
    return;
  }

  populateHeroCopy(copy);
  populateLanes(copy, projects, profile);
  populateProof(copy);
  populateWritingHighlights(writing, profile);
  populateRiveHighlight(profile);

  /* Re-observe any [data-reveal] elements we just injected */
  observeRevealElements();
}

/* ── Hero copy ── */
function populateHeroCopy(copy) {
  const subEl = document.getElementById('hero-sub');
  if (subEl && copy.hero?.sub_line) subEl.textContent = copy.hero.sub_line;

  const ctaLine = document.getElementById('cta-strip-line');
  if (ctaLine && copy.sections?.cta_strip_line) ctaLine.textContent = copy.sections.cta_strip_line;
}

/* ── Lane cards ── */
function populateLanes(copy, projects, profile) {
  const grid = document.getElementById('lanes-grid');
  if (!grid || !copy.lanes) return;

  grid.innerHTML = copy.lanes.map(lane => {
    const laneProjects = projects.filter(p => p.lane === lane.id);
    const featuredIds  = profile.featured.projects || [];
    const featured     = [
      ...laneProjects.filter(p => featuredIds.includes(p.id)),
      ...laneProjects.filter(p => !featuredIds.includes(p.id)),
    ].slice(0, 2);

    const itemsHTML = featured.map(p =>
      `<li class="lane-card__item">${escHtml(p.title)}</li>`
    ).join('');

    return `
      <a href="${escHtml(lane.link)}" class="lane-card" data-reveal>
        <div class="lane-card__inner">
          <header>
            <p class="lane-card__eyebrow">${escHtml(lane.id)}</p>
            <h3 class="lane-card__title">${escHtml(lane.label)}</h3>
          </header>
          <p class="lane-card__desc">${escHtml(lane.description)}</p>
          ${featured.length ? `<ul class="lane-card__items">${itemsHTML}</ul>` : ''}
          <span class="lane-card__cta">explore →</span>
        </div>
      </a>`;
  }).join('');

  /* Observe newly added [data-reveal] lane cards */
  observeRevealElements(grid);
}

/* ── Social proof metrics ── */
function populateProof(copy) {
  const strip = document.getElementById('proof-strip');
  if (!strip || !copy.proof_metrics) return;

  strip.innerHTML = copy.proof_metrics.map(m => `
    <div class="metric-card" data-reveal>
      <div class="metric-card__value">${escHtml(m.value)}</div>
      <div class="metric-card__label">${escHtml(m.label)}</div>
      <div class="metric-card__timeframe">${escHtml(m.timeframe)}</div>
    </div>`).join('');

  observeRevealElements(strip);
}

/* ── Writing highlights (3 items) ── */
function populateWritingHighlights(writing, profile) {
  const list = document.getElementById('writing-highlights');
  if (!list) return;

  const featured = profile.featured.writing || [];
  const items = [
    ...writing.filter(w => featured.includes(w.id)),
    ...writing.filter(w => !featured.includes(w.id)),
  ].slice(0, 3);

  list.innerHTML = items.map(w => {
    const isExternal = w.link && w.link.startsWith('http');
    const target     = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `
      <article class="writing-item" data-reveal>
        <div>
          <div class="writing-item__meta">
            <span class="label">${escHtml(w.type)}</span>
            <span class="text-muted" style="font-size:var(--text-xs)">${escHtml(w.platform)}</span>
          </div>
          <a href="${escHtml(w.link)}" class="writing-item__title"${target}>${escHtml(w.title)}</a>
          <p class="writing-item__excerpt">${escHtml(w.excerpt)}</p>
        </div>
        <a href="${escHtml(w.link)}" class="writing-item__link"${target}>
          ${isExternal ? 'read ↗' : 'view →'}
        </a>
      </article>`;
  }).join('');

  observeRevealElements(list);
}

/* ── Interactive / Rive highlight (1 featured piece) ── */
function populateRiveHighlight(profile) {
  const container = document.getElementById('rive-highlight');
  if (!container) return;

  fetchJSON('data/rive.json').then(riveItems => {
    const featuredId = (profile.featured.rive || [])[0];
    const item       = riveItems.find(r => r.id === featuredId) || riveItems[0];
    if (!item) return;

    container.innerHTML = `
      <div class="rive-fallback-card" data-reveal>
        <div class="rive-fallback-card__poster">
          <img src="${escHtml(item.poster)}"
               alt="${escHtml(item.title)} — preview"
               loading="lazy"
               onerror="this.style.display='none';this.parentElement.classList.add('img-placeholder')">
        </div>
        <div>
          <h3 style="font-family:var(--font-heading);margin-bottom:var(--sp-3)">${escHtml(item.title)}</h3>
          <p style="font-size:var(--text-sm);color:var(--text-muted);margin-bottom:var(--sp-5)">${escHtml(item.summary)}</p>
          <div style="display:flex;gap:var(--sp-3);flex-wrap:wrap">
            <a href="${escHtml(item.rive_page_url)}"
               class="btn btn--primary btn--sm"
               target="_blank"
               rel="noopener noreferrer">
              open on Rive
            </a>
            <a href="interactive.html" class="btn btn--ghost btn--sm">see all →</a>
          </div>
        </div>
      </div>`;

    observeRevealElements(container);
  }).catch(() => {
    container.innerHTML = `
      <p class="text-muted">
        Interactive work available on <a href="interactive.html">the Interactive page</a>.
      </p>`;
  });
}

/* ═══════════════════════════════════════════════
   MAIN INIT — runs on every page
═══════════════════════════════════════════════ */

async function init() {
  /* 1. Theme (applied inline in <head> already — this syncs the toggle icon) */
  initTheme();

  /* 2. Nav — must come before initMode() so .mode-btn elements exist in the DOM */
  injectNav();
  patchThemeToggleClick();
  syncThemeIcon();

  /* 3. Mode — wires click listeners on .mode-btn (now present after injectNav) */
  initMode();

  /* 3. Scroll reveal on static HTML elements */
  initScrollReveal();

  /* 4. Footer (needs profile.json) */
  try {
    const profile = await fetchJSON('data/profile.json');
    await injectFooter(profile);
  } catch (e) {
    console.warn('Footer load error:', e);
    const footer = document.getElementById('site-footer');
    if (footer) footer.innerHTML = `
      <div class="container" style="padding:var(--sp-6) var(--container-pad)">
        <p style="font-size:var(--text-xs);color:var(--text-faint);text-align:center">
          &copy; ${new Date().getFullYear()} E.S.Doodles
        </p>
      </div>`;
  }

  /* 5. Home page: populate dynamic sections, then re-observe new elements */
  await initHomePage();
}

document.addEventListener('DOMContentLoaded', init);
