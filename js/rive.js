/* ============================================================
   RIVE — interactive.html (and home page highlight)
   Loads Rive runtime on-demand, renders embeds or link-out cards.
   Rive runtime: https://unpkg.com/@rive-app/canvas-lite
   ============================================================ */

const RIVE_RUNTIME_SRC = 'https://unpkg.com/@rive-app/canvas-lite@latest';

let riveInstances      = [];
let riveRuntimeLoaded  = false;

/* ── Load Rive runtime dynamically ── */
function loadRiveRuntime() {
  return new Promise((resolve, reject) => {
    if (riveRuntimeLoaded || window.rive) {
      riveRuntimeLoaded = true;
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = RIVE_RUNTIME_SRC;
    script.onload = () => { riveRuntimeLoaded = true; resolve(); };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

/* ── Prefer reduced motion: skip autoplay ── */
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── Render a single Rive item ── */
function renderRiveItem(item, container) {
  const hasRivFile = Boolean(item.riv_src);
  const canEmbed   = hasRivFile && !prefersReducedMotion;

  const tagsHTML = (item.tags || []).map(t =>
    `<span class="tag-pill">${escHtml(t)}</span>`
  ).join('');

  if (canEmbed) {
    // Live embed mode
    const canvasId = `rive-canvas-${escHtml(item.id)}`;
    container.innerHTML = `
      <div class="rive-card">
        <div class="rive-card__embed" style="height:${item.height || 480}px;position:relative">
          <canvas
            id="${canvasId}"
            style="width:100%;height:100%"
            data-riv-src="${escHtml(item.riv_src)}"
            data-artboard="${escHtml(item.artboard || '')}"
            data-state-machine="${escHtml(item.state_machine || '')}"
            aria-label="${escHtml(item.title)} — interactive Rive animation"
            role="img"
          ></canvas>
          <noscript>
            <img src="${escHtml(item.poster)}"
                 alt="${escHtml(item.title)} — static preview"
                 style="width:100%;height:100%;object-fit:cover">
          </noscript>
        </div>
        <div class="rive-card__body">
          <h3 class="rive-card__title">${escHtml(item.title)}</h3>
          <p class="rive-card__summary">${escHtml(item.summary)}</p>
          <div class="rive-card__tags">${tagsHTML}</div>
          <div class="rive-card__footer">
            <a href="${escHtml(item.rive_page_url)}"
               class="btn btn--primary btn--sm"
               target="_blank"
               rel="noopener noreferrer">
              open on Rive ↗
            </a>
          </div>
        </div>
      </div>`;

    // Boot Rive
    loadRiveRuntime().then(() => {
      const canvas = document.getElementById(canvasId);
      if (!canvas || !window.rive) return;

      const instance = new window.rive.Rive({
        src:           item.riv_src,
        canvas:        canvas,
        autoplay:      true,
        artboard:      item.artboard || undefined,
        stateMachines: item.state_machine ? [item.state_machine] : undefined,
        onLoad: () => {
          instance.resizeDrawingSurfaceToCanvas();
        },
      });

      riveInstances.push(instance);

      // Resize handling
      const ro = new ResizeObserver(() => {
        if (instance && instance.resizeDrawingSurfaceToCanvas) {
          instance.resizeDrawingSurfaceToCanvas();
        }
      });
      ro.observe(canvas.parentElement);

    }).catch(err => {
      console.warn('Rive runtime failed to load:', err);
      // Fall back to poster
      fallbackToPoster(container, item, tagsHTML);
    });

  } else {
    // Link-out card (no .riv file, or reduced motion)
    fallbackToPoster(container, item, tagsHTML);
  }
}

function fallbackToPoster(container, item, tagsHTML) {
  container.innerHTML = `
    <div class="rive-card">
      <div style="position:relative;overflow:hidden;border-radius:var(--radius-lg) var(--radius-lg) 0 0">
        <img
          src="${escHtml(item.poster)}"
          alt="${escHtml(item.title)} — preview"
          class="rive-card__poster"
          loading="lazy"
          onerror="this.style.display='none';this.parentElement.classList.add('img-placeholder')"
        >
        <div style="
          position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
          background:rgba(11,11,18,0.45)">
          <span style="
            font-size:0.75rem;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;
            color:#fff;background:rgba(254,41,118,0.75);padding:4px 12px;border-radius:999px">
            view on Rive
          </span>
        </div>
      </div>
      <div class="rive-card__body">
        <h3 class="rive-card__title">${escHtml(item.title)}</h3>
        <p class="rive-card__summary">${escHtml(item.summary)}</p>
        <div class="rive-card__tags">${tagsHTML}</div>
        <div class="rive-card__footer">
          <a href="${escHtml(item.rive_page_url)}"
             class="btn btn--primary btn--sm"
             target="_blank"
             rel="noopener noreferrer">
            open on Rive ↗
          </a>
        </div>
      </div>
    </div>`;
}

/* ── Filter logic ── */
let allRiveItems   = [];
let activeRiveTags = new Set(['all']);

function buildRiveTags(items) {
  const tagSet = new Set(['all']);
  items.forEach(item => (item.tags || []).forEach(t => tagSet.add(t)));

  const bar = document.getElementById('rive-filter-bar');
  if (!bar) return;

  bar.innerHTML = Array.from(tagSet).map(tag => `
    <button
      class="filter-chip${tag === 'all' ? ' active' : ''}"
      data-tag="${escHtml(tag)}"
      aria-pressed="${tag === 'all'}"
    >${escHtml(tag === 'all' ? 'All' : tag)}</button>`).join('');

  bar.querySelectorAll('.filter-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const tag = btn.dataset.tag;
      if (tag === 'all') {
        activeRiveTags = new Set(['all']);
      } else {
        activeRiveTags.delete('all');
        if (activeRiveTags.has(tag)) activeRiveTags.delete(tag);
        else activeRiveTags.add(tag);
        if (activeRiveTags.size === 0) activeRiveTags.add('all');
      }

      bar.querySelectorAll('.filter-chip').forEach(b => {
        const active = activeRiveTags.has(b.dataset.tag);
        b.classList.toggle('active', active);
        b.setAttribute('aria-pressed', String(active));
      });

      renderRiveGrid();
    });
  });
}

function renderRiveGrid() {
  const grid = document.getElementById('rive-grid');
  if (!grid) return;

  const filtered = activeRiveTags.has('all')
    ? allRiveItems
    : allRiveItems.filter(item =>
        (item.tags || []).some(t => activeRiveTags.has(t))
      );

  // Clean up previous Rive instances
  riveInstances.forEach(inst => { try { inst.cleanup?.(); } catch (_) {} });
  riveInstances = [];

  grid.innerHTML = '';
  if (filtered.length === 0) {
    grid.innerHTML = `<p class="text-muted" style="font-style:italic">nothing here for that filter.</p>`;
    return;
  }

  filtered.forEach(item => {
    const wrapper = document.createElement('div');
    wrapper.setAttribute('data-reveal', '');
    grid.appendChild(wrapper);
    renderRiveItem(item, wrapper);
  });

  // Trigger scroll reveal
  document.querySelectorAll('[data-reveal]').forEach(el => {
    if (!el.classList.contains('visible')) el.classList.add('visible');
  });
}

/* ── Cleanup on page unload ── */
window.addEventListener('beforeunload', () => {
  riveInstances.forEach(inst => { try { inst.cleanup?.(); } catch (_) {} });
});

/* ── Init ── */
async function initRivePage() {
  try {
    allRiveItems = await fetchJSON('data/rive.json');
  } catch (err) {
    console.error('Rive: failed to load rive.json', err);
    const grid = document.getElementById('rive-grid');
    if (grid) grid.innerHTML = `<p class="text-muted">Couldn't load Rive data. Ensure you're running a local server.</p>`;
    return;
  }

  buildRiveTags(allRiveItems);
  renderRiveGrid();
}

if (document.getElementById('rive-grid')) {
  document.addEventListener('DOMContentLoaded', initRivePage);
}
