/**
 * Client-side router for dashboard views.
 * Manages view switching without page reloads.
 */

import { getItem, setItem, STORAGE_KEYS } from './storage.js';

const VIEWS = ['dashboard', 'tasks', 'statistics', 'settings'];

let currentView = 'dashboard';
let onViewChange = null;

/**
 * Initialize router
 * @param {Function} callback - Called when view changes
 */
export function initRouter(callback) {
  onViewChange = callback;
  currentView = getItem(STORAGE_KEYS.VIEW, 'dashboard');

  document.querySelectorAll('[data-view]').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const view = link.dataset.view;
      if (view && VIEWS.includes(view)) navigateTo(view);
    });
  });

  navigateTo(currentView, false);
}

/**
 * Navigate to a view
 * @param {string} view
 * @param {boolean} save
 */
export function navigateTo(view, save = true) {
  if (!VIEWS.includes(view)) return;

  currentView = view;
  if (save) setItem(STORAGE_KEYS.VIEW, view);

  document.querySelectorAll('[data-view]').forEach((link) => {
    link.classList.toggle('nav-item--active', link.dataset.view === view);
    link.setAttribute('aria-current', link.dataset.view === view ? 'page' : 'false');
  });

  document.querySelectorAll('[data-section]').forEach((section) => {
    const isActive = section.dataset.section === view;
    section.classList.toggle('section--active', isActive);
    section.hidden = !isActive;
  });

  updateBreadcrumb(view);

  if (onViewChange) onViewChange(view);
}

/** Get current view */
export function getCurrentView() {
  return currentView;
}

/** Update breadcrumb */
function updateBreadcrumb(view) {
  const breadcrumb = document.getElementById('breadcrumb');
  if (!breadcrumb) return;

  const labels = {
    dashboard: 'Dashboard',
    tasks: 'Tasks',
    statistics: 'Statistics',
    settings: 'Settings',
  };

  breadcrumb.innerHTML = `
    <span class="breadcrumb__item">Home</span>
    <i class="fa-solid fa-chevron-right breadcrumb__sep" aria-hidden="true"></i>
    <span class="breadcrumb__item breadcrumb__item--active">${labels[view] || view}</span>
  `;
}

/**
 * Redirect to login or dashboard based on auth
 */
export function redirectIfNeeded(isAuth, page) {
  const isLoginPage = page === 'login';
  const isDashboardPage = page === 'dashboard';

  if (isDashboardPage && !isAuth) {
    window.location.href = 'index.html';
    return true;
  }

  if (isLoginPage && isAuth) {
    window.location.href = 'dashboard.html';
    return true;
  }

  return false;
}
