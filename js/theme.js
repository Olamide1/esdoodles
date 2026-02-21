/* ============================================================
   THEME — Dark / light toggle
   Persists to localStorage under key 'esd-theme'.
   Default: dark.
   ============================================================ */

const THEME_KEY     = 'esd-theme';
const DEFAULT_THEME = 'dark';

function getTheme() {
  return localStorage.getItem(THEME_KEY) || DEFAULT_THEME;
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(THEME_KEY, theme);

  // Update toggle button labels / aria
  document.querySelectorAll('.theme-toggle').forEach(btn => {
    const isLight = theme === 'light';
    btn.setAttribute(
      'aria-label',
      isLight ? 'Switch to dark theme' : 'Switch to light theme'
    );
    // Show correct icon (CSS handles via data-theme on <html>)
  });
}

function toggleTheme() {
  applyTheme(getTheme() === 'dark' ? 'light' : 'dark');
}

function initTheme() {
  // Apply immediately (also done inline in <head> to prevent FOUC)
  applyTheme(getTheme());

  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.addEventListener('click', toggleTheme);
  });
}

/* Theme icon rendering via CSS [data-theme] attribute on <html>.
   Button innerHTML is set in main.js nav injection. */
