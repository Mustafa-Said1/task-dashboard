/**
 * Modal management module.
 * Handles open/close, focus trap, and keyboard interactions.
 */

let activeModal = null;
let previousFocus = null;
let onConfirmCallback = null;

/**
 * Initialize modal system
 */
export function initModals() {
  document.addEventListener('keydown', handleModalKeydown);
  document.querySelectorAll('.modal-overlay').forEach((overlay) => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });
  });
  document.querySelectorAll('[data-modal-close]').forEach((btn) => {
    btn.addEventListener('click', closeModal);
  });
}

/**
 * Open a modal by ID
 * @param {string} modalId
 * @param {Object} options
 */
export function openModal(modalId, options = {}) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  closeModal();

  previousFocus = document.activeElement;
  activeModal = modal;
  onConfirmCallback = options.onConfirm || null;

  const overlay = modal.closest('.modal-overlay') || modal;
  overlay.classList.add('modal-overlay--active');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');

  const focusable = modal.querySelector(
    'input, button, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  if (focusable) focusable.focus();

  if (options.title) {
    const titleEl = modal.querySelector('.modal__title');
    if (titleEl) titleEl.textContent = options.title;
  }

  if (options.message) {
    const msgEl = modal.querySelector('.modal__message');
    if (msgEl) msgEl.textContent = options.message;
  }
}

/**
 * Close active modal
 */
export function closeModal() {
  if (!activeModal) {
    document.querySelectorAll('.modal-overlay--active').forEach((overlay) => {
      overlay.classList.remove('modal-overlay--active');
      overlay.setAttribute('aria-hidden', 'true');
    });
    document.body.classList.remove('modal-open');
    return;
  }

  const overlay = activeModal.closest('.modal-overlay') || activeModal;
  overlay.classList.remove('modal-overlay--active');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');

  if (previousFocus) previousFocus.focus();
  activeModal = null;
  onConfirmCallback = null;
}

/**
 * Open confirmation modal
 */
export function openConfirmModal(options) {
  openModal('confirm-modal', options);

  const confirmBtn = document.getElementById('confirm-btn');
  if (confirmBtn) {
    const newBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
    newBtn.addEventListener('click', () => {
      if (onConfirmCallback) onConfirmCallback();
      closeModal();
    });
  }
}

/** Handle ESC and focus trap */
function handleModalKeydown(e) {
  if (!activeModal) return;

  if (e.key === 'Escape') {
    e.preventDefault();
    closeModal();
    return;
  }

  if (e.key === 'Tab') {
    trapFocus(e, activeModal);
  }
}

/** Focus trap within modal */
function trapFocus(e, modal) {
  const focusable = modal.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const elements = Array.from(focusable).filter((el) => !el.disabled);
  if (!elements.length) return;

  const first = elements[0];
  const last = elements[elements.length - 1];

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

/**
 * Set button loading state
 * @param {HTMLButtonElement} button
 * @param {boolean} loading
 */
export function setButtonLoading(button, loading) {
  if (!button) return;
  button.disabled = loading;
  button.classList.toggle('btn--loading', loading);
  const text = button.querySelector('.btn__text');
  const loader = button.querySelector('.btn__loader');
  if (text) text.hidden = loading;
  if (loader) loader.hidden = !loading;
}

/**
 * Show/hide page loader
 */
export function setPageLoader(show) {
  const loader = document.getElementById('page-loader');
  if (loader) {
    loader.classList.toggle('page-loader--hidden', !show);
    loader.setAttribute('aria-hidden', String(!show));
  }
}

/**
 * Show skeleton loading in container
 */
export function showSkeleton(container, count = 6) {
  if (!container) return;
  container.innerHTML = Array(count)
    .fill(0)
    .map(
      () => `
      <div class="skeleton-card" aria-hidden="true">
        <div class="skeleton skeleton--title"></div>
        <div class="skeleton skeleton--text"></div>
        <div class="skeleton skeleton--text skeleton--short"></div>
        <div class="skeleton skeleton--badge"></div>
      </div>
    `
    )
    .join('');
}
