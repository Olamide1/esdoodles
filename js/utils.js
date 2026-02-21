/* ============================================================
   UTILS — Shared helpers
   ============================================================ */

/**
 * Shorthand querySelector
 * @param {string} selector
 * @param {Element|Document} [parent=document]
 */
function qs(selector, parent = document) {
  return parent.querySelector(selector);
}

/**
 * Shorthand querySelectorAll → Array
 * @param {string} selector
 * @param {Element|Document} [parent=document]
 */
function qsa(selector, parent = document) {
  return Array.from(parent.querySelectorAll(selector));
}

/** Cache for fetchJSON: same URL = one request (avoids duplicate network calls). */
const _fetchJSONCache = new Map();

/**
 * Fetch JSON from a URL. Cached by URL so repeated calls reuse the same request.
 * @param {string} url
 * @returns {Promise<any>}
 */
async function fetchJSON(url) {
  let p = _fetchJSONCache.get(url);
  if (p) return p;
  p = fetch(url).then(function (res) {
    if (!res.ok) throw new Error('fetchJSON: ' + url + ' (' + res.status + ')');
    return res.json();
  });
  _fetchJSONCache.set(url, p);
  return p;
}

/**
 * Debounce a function
 * @param {Function} fn
 * @param {number} delay  ms
 */
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Sanitize a string for safe HTML text insertion
 * @param {string} str
 */
function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

/**
 * Get URL query param
 * @param {string} key
 */
function getParam(key) {
  return new URLSearchParams(window.location.search).get(key);
}

/**
 * Trap focus inside an element (for lightbox / modals)
 * Returns a cleanup function.
 * @param {Element} el
 */
function trapFocus(el) {
  const focusable = el.querySelectorAll(
    'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
  );
  const first = focusable[0];
  const last  = focusable[focusable.length - 1];

  function onKey(e) {
    if (e.key !== 'Tab') return;
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
    }
  }

  el.addEventListener('keydown', onKey);
  first && first.focus();

  return () => el.removeEventListener('keydown', onKey);
}

/**
 * Create an element with attributes and optional content
 * @param {string} tag
 * @param {Object} [attrs]
 * @param {string|Element|null} [content]
 */
function el(tag, attrs = {}, content = null) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'class')     node.className = v;
    else if (k === 'data') Object.entries(v).forEach(([dk, dv]) => node.dataset[dk] = dv);
    else                   node.setAttribute(k, v);
  });
  if (content !== null) {
    if (typeof content === 'string') node.innerHTML = content;
    else node.appendChild(content);
  }
  return node;
}

/**
 * Handle img load error — swap for placeholder
 * @param {HTMLImageElement} img
 */
function handleImgError(img) {
  img.addEventListener('error', () => {
    img.style.display = 'none';
    const parent = img.parentElement;
    if (parent) parent.classList.add('img-placeholder');
  }, { once: true });
}

/**
 * Lazily observe images for IntersectionObserver-based lazy loading
 * @param {NodeList|Array} imgs
 */
function lazyLoadImages(imgs) {
  if (!('IntersectionObserver' in window)) {
    imgs.forEach(img => {
      if (img.dataset.src) img.src = img.dataset.src;
    });
    return;
  }

  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const img = entry.target;
      if (img.dataset.src) img.src = img.dataset.src;
      if (img.dataset.srcset) img.srcset = img.dataset.srcset;
      img.removeAttribute('data-src');
      obs.unobserve(img);
    });
  }, { rootMargin: '200px' });

  imgs.forEach(img => io.observe(img));
}

/**
 * Badge HTML for a lane string
 * @param {string} lane
 */
function laneBadge(lane) {
  const map = {
    illustration: 'Illustration',
    comics:       'Comics',
    writing:      'Writing',
    social:       'Social Media',
    interactive:  'Interactive',
    editorial:    'Editorial',
  };
  const label = map[lane] || lane;
  return `<span class="badge badge--${escHtml(lane)}">${escHtml(label)}</span>`;
}
