/**
 * Login page entry point.
 * Handles authentication UI and form interactions.
 */

import { initializeDemoAccount, login, createSession, isAuthenticated } from './authentication.js';
import { validateLoginForm } from './validation.js';
import { initTheme } from './theme.js';
import { showToast, ToastMessages, initToast } from './toast.js';
import { setButtonLoading } from './modal.js';
import { redirectIfNeeded } from './router.js';
import { trimString } from './utils.js';

/** DOM references */
const elements = {};

/**
 * Initialize login page
 */
function init() {
  initTheme();
  initToast();
  initializeDemoAccount();

  if (redirectIfNeeded(isAuthenticated(), 'login')) return;

  cacheElements();
  bindEvents();
  hidePageLoader();
}

/** Cache DOM elements */
function cacheElements() {
  elements.form = document.getElementById('login-form');
  elements.email = document.getElementById('email');
  elements.password = document.getElementById('password');
  elements.rememberMe = document.getElementById('remember-me');
  elements.togglePassword = document.getElementById('toggle-password');
  elements.submitBtn = document.getElementById('login-btn');
  elements.themeToggle = document.getElementById('theme-toggle');
}

/** Bind event listeners */
function bindEvents() {
  elements.form?.addEventListener('submit', handleSubmit);
  elements.togglePassword?.addEventListener('click', togglePasswordVisibility);
  elements.themeToggle?.addEventListener('click', handleThemeToggle);

  [elements.email, elements.password].forEach((input) => {
    input?.addEventListener('input', () => clearFieldError(input));
    input?.addEventListener('blur', validateField);
  });
}

/** Handle form submission */
async function handleSubmit(e) {
  e.preventDefault();

  const email = elements.email.value;
  const password = elements.password.value;
  const rememberMe = elements.rememberMe?.checked || false;

  const validation = validateLoginForm(email, password);
  if (!validation.valid) {
    showValidationErrors(validation.errors);
    showToast(ToastMessages.VALIDATION_ERROR, 'error');
    return;
  }

  setButtonLoading(elements.submitBtn, true);

  await new Promise((r) => setTimeout(r, 800));

  const result = login(email, password);

  if (result.success) {
    createSession(result.user, rememberMe);
    showToast(ToastMessages.LOGIN_SUCCESS, 'success');

    await new Promise((r) => setTimeout(r, 1000));
    window.location.href = 'dashboard.html';
  } else {
    setButtonLoading(elements.submitBtn, false);
    showToast(result.message || ToastMessages.LOGIN_FAILED, 'error');
    highlightInvalidFields();
  }
}

/** Toggle password visibility */
function togglePasswordVisibility() {
  const isPassword = elements.password.type === 'password';
  elements.password.type = isPassword ? 'text' : 'password';
  elements.togglePassword.innerHTML = isPassword
    ? '<i class="fa-solid fa-eye-slash" aria-hidden="true"></i>'
    : '<i class="fa-solid fa-eye" aria-hidden="true"></i>';
  elements.togglePassword.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
}

/** Show validation errors under fields */
function showValidationErrors(errors) {
  Object.entries(errors).forEach(([field, message]) => {
    const input = elements[field];
    const errorEl = document.getElementById(`${field}-error`);
    if (input) input.classList.add('form-input--error');
    if (errorEl) errorEl.textContent = message;
  });
}

/** Clear error for a single field */
function clearFieldError(input) {
  input.classList.remove('form-input--error');
  const errorEl = document.getElementById(`${input.id}-error`);
  if (errorEl) errorEl.textContent = '';
}

/** Validate single field on blur */
function validateField(e) {
  const validation = validateLoginForm(elements.email.value, elements.password.value);
  const field = e.target.id === 'email' ? 'email' : 'password';
  if (validation.errors[field]) {
    showValidationErrors({ [field]: validation.errors[field] });
  } else {
    clearFieldError(e.target);
  }
}

/** Highlight both fields on auth failure */
function highlightInvalidFields() {
  elements.email.classList.add('form-input--error');
  elements.password.classList.add('form-input--error');
}

/** Handle theme toggle */
function handleThemeToggle() {
  import('./theme.js').then(({ toggleTheme }) => {
    toggleTheme();
    showToast(ToastMessages.THEME_CHANGED, 'info', 2000);
  });
}

/** Hide page loader */
function hidePageLoader() {
  const loader = document.getElementById('page-loader');
  if (loader) {
    setTimeout(() => loader.classList.add('page-loader--hidden'), 500);
  }
}

document.addEventListener('DOMContentLoaded', init);
