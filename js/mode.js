/* ============================================================
   MODE — Portfolio / Hire toggle
   Persists to localStorage under key 'esd-mode'.
   Default: portfolio.
   Affects: body sections with .portfolio-only / .hire-only
   ============================================================ */

const MODE_KEY     = 'esd-mode';
const DEFAULT_MODE = 'portfolio';

function getMode() {
  return localStorage.getItem(MODE_KEY) || DEFAULT_MODE;
}

function applyMode(mode) {
  document.documentElement.dataset.mode = mode;
  localStorage.setItem(MODE_KEY, mode);

  // Update all mode toggle buttons
  document.querySelectorAll('.mode-btn').forEach(btn => {
    const isActive = btn.dataset.mode === mode;
    btn.setAttribute('aria-pressed', String(isActive));
  });
}

function initMode() {
  // Apply immediately (also done inline in <head> to prevent FOUC)
  applyMode(getMode());

  // Wire buttons
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      applyMode(btn.dataset.mode);
    });
  });
}
