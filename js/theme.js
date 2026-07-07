/**
 * Theme management module.
 * Handles dark/light mode with persistence.
 */

import { getItem, setItem, STORAGE_KEYS } from './storage.js';

const THEME_KEY = STORAGE_KEYS.THEME;

/**
 * Initialize theme from storage or system preference
 */
export function initTheme() {
  const saved = getItem(THEME_KEY, null);
  const theme = saved || getSystemPreference();
  applyTheme(theme, false);
  return theme;
}

/** Get system color scheme preference */
function getSystemPreference() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Apply theme to document
 * @param {string} theme - 'light' | 'dark'
 * @param {boolean} animate
 */
export function applyTheme(theme, animate = true) {
  const root = document.documentElement;
  if (animate) root.classList.add('theme-transition');
  root.setAttribute('data-theme', theme);
  setItem(THEME_KEY, theme);

  if (animate) {
    setTimeout(() => root.classList.remove('theme-transition'), 300);
  }
}

/** Get current theme */
export function getTheme() {
  return document.documentElement.getAttribute('data-theme') || 'light';
}

/** Toggle between light and dark */
export function toggleTheme() {
  const current = getTheme();
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  return next;
}

/** Listen for system theme changes */
export function watchSystemTheme(callback) {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', (e) => {
    if (!getItem(THEME_KEY, null)) {
      const theme = e.matches ? 'dark' : 'light';
      applyTheme(theme, false);
      if (callback) callback(theme);
    }
  });
}
