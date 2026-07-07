/**
 * Toast notification module.
 * Manages ephemeral UI feedback messages.
 */

const TOAST_DURATION = 4000;
let toastContainer = null;

/** Toast type configurations */
const TOAST_TYPES = {
  success: { icon: 'fa-circle-check', className: 'toast--success' },
  error: { icon: 'fa-circle-xmark', className: 'toast--error' },
  warning: { icon: 'fa-triangle-exclamation', className: 'toast--warning' },
  info: { icon: 'fa-circle-info', className: 'toast--info' },
};

/**
 * Initialize toast container
 */
export function initToast() {
  if (toastContainer) return;
  toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'toast-container';
    toastContainer.setAttribute('role', 'alert');
    toastContainer.setAttribute('aria-live', 'polite');
    document.body.appendChild(toastContainer);
  }
}

/**
 * Show a toast notification
 * @param {string} message
 * @param {string} type - success | error | warning | info
 * @param {number} duration
 */
export function showToast(message, type = 'info', duration = TOAST_DURATION) {
  initToast();

  const config = TOAST_TYPES[type] || TOAST_TYPES.info;
  const toast = document.createElement('div');
  toast.className = `toast ${config.className} animate-slide-in-right`;
  toast.setAttribute('role', 'alert');

  toast.innerHTML = `
    <i class="fa-solid ${config.icon}" aria-hidden="true"></i>
    <span class="toast__message">${message}</span>
    <button class="toast__close" aria-label="Dismiss notification">
      <i class="fa-solid fa-xmark" aria-hidden="true"></i>
    </button>
  `;

  const closeBtn = toast.querySelector('.toast__close');
  const dismiss = () => {
    toast.classList.add('animate-fade-out');
    setTimeout(() => toast.remove(), 300);
  };

  closeBtn.addEventListener('click', dismiss);
  toastContainer.appendChild(toast);

  if (duration > 0) {
    setTimeout(dismiss, duration);
  }

  return toast;
}

/** Predefined toast messages */
export const ToastMessages = {
  TASK_ADDED: 'Task added successfully',
  TASK_UPDATED: 'Task updated successfully',
  TASK_DELETED: 'Task deleted successfully',
  TASK_DUPLICATED: 'Task duplicated successfully',
  FETCH_SUCCESS: 'Tasks imported from API successfully',
  FETCH_ERROR: 'Failed to fetch tasks from API',
  THEME_CHANGED: 'Theme updated',
  IMPORT_SUCCESS: 'Tasks imported successfully',
  EXPORT_SUCCESS: 'Tasks exported successfully',
  LOGIN_SUCCESS: 'Welcome back! Redirecting...',
  LOGIN_FAILED: 'Invalid email or password',
  LOGOUT_SUCCESS: 'Logged out successfully',
  RESET_SUCCESS: 'All tasks have been reset',
  UNDO_SUCCESS: 'Action undone',
  REDO_SUCCESS: 'Action redone',
  VALIDATION_ERROR: 'Please fix the form errors',
  NETWORK_ERROR: 'Network error. Please check your connection',
  SETTINGS_SAVED: 'Settings saved successfully',
};
