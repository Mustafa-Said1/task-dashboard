/**
 * Main dashboard application entry point.
 * Orchestrates all modules and handles user interactions.
 */

import { isAuthenticated, getCurrentUser, logout } from './authentication.js';
import { getSettings, saveSettings, getFilters, saveFilters, getSort, saveSort, getItem, setItem, STORAGE_KEYS } from './storage.js';
import {
  getAllTasks, createTask, updateTask, deleteTask, duplicateTask, toggleFavorite,
  filterTasks, sortTasks, paginateTasks, getTaskStatistics, getRecentActivity,
  getUpcomingDeadlines, resetTasks, mergeTasks, exportTasks, undoLastAction, redoLastAction,
} from './tasks.js';
import { validateTaskForm, validateImportData } from './validation.js';
import { initTheme, toggleTheme } from './theme.js';
import { initRouter, navigateTo, redirectIfNeeded } from './router.js';
import { showToast, ToastMessages, initToast } from './toast.js';
import { initModals, openModal, closeModal, openConfirmModal, setPageLoader, showSkeleton } from './modal.js';
import { fetchDemoTasks, watchConnectivity } from './fetch.js';
import { initCardDragDrop, initKanbanDragDrop, destroyAllSortables } from './dragdrop.js';
import { renderCharts, destroyCharts, updateProgressCircle } from './chart.js';
import {
  renderTaskCard, renderKanbanCard, renderEmptyState, renderStatCards,
  renderRecentActivity, renderUpcomingDeadlines, renderPagination, renderTaskForm,
  displayFormErrors, clearFormErrors, getTaskFormData, renderCalendarWidget,
  setSidebarCollapsed, updateNotificationBadge, renderNotifications,
} from './ui.js';
import { debounce, getCurrentDateDisplay, readFileAsText, downloadJSON } from './utils.js';

/** Application state */
const state = {
  tasks: [],
  filteredTasks: [],
  currentPage: 1,
  editingTaskId: null,
  viewMode: 'grid',
  activeKanbanTab: 'todo',
  notifications: [],
};

/** DOM cache */
const el = {};

/** Initialize dashboard */
async function init() {
  setPageLoader(true);
  try {
    initTheme();
    initToast();

    if (redirectIfNeeded(isAuthenticated(), 'dashboard')) return;

    cacheElements();
    loadState();
    initModals();
    initRouter(handleViewChange);
    bindEvents();
    renderAll();
  } catch (error) {
    console.error('Dashboard init error:', error);
    showToast('Failed to initialize dashboard', 'error');
  } finally {
    hidePageLoader();
  }
}

/** Cache DOM elements */
function cacheElements() {
  el.sidebar = document.getElementById('sidebar');
  el.sidebarToggle = document.getElementById('sidebar-toggle');
  el.mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  el.sidebarOverlay = document.getElementById('sidebar-overlay');
  el.searchInput = document.getElementById('global-search');
  el.taskGrid = document.getElementById('task-grid');
  el.kanbanTabs = document.getElementById('kanban-tabs');
  el.kanbanTodo = document.getElementById('kanban-todo');
  el.kanbanInProgress = document.getElementById('kanban-in-progress');
  el.kanbanCompleted = document.getElementById('kanban-completed');
  el.pagination = document.getElementById('pagination');
  el.statCards = document.getElementById('stat-cards');
  el.recentActivity = document.getElementById('recent-activity');
  el.upcomingDeadlines = document.getElementById('upcoming-deadlines');
  el.calendarWidget = document.getElementById('calendar-widget');
  el.welcomeUser = document.getElementById('welcome-user');
  el.currentDate = document.getElementById('current-date');
  el.profileName = document.getElementById('profile-name');
  el.profileAvatar = document.getElementById('profile-avatar');
  el.themeToggle = document.getElementById('theme-toggle');
  el.logoutBtn = document.getElementById('logout-btn');
  el.fab = document.getElementById('fab');
  el.backToTop = document.getElementById('back-to-top');
  el.taskModal = document.getElementById('task-modal');
  el.taskFormContainer = document.getElementById('task-form-container');
  el.taskForm = document.getElementById('task-form');
  el.saveTaskBtn = document.getElementById('save-task-btn');
  el.filterChips = document.getElementById('filter-chips');
  el.sortSelect = document.getElementById('sort-select');
  el.viewToggle = document.getElementById('view-toggle');
  el.fetchBtn = document.getElementById('fetch-tasks-btn');
  el.importBtn = document.getElementById('import-btn');
  el.exportBtn = document.getElementById('export-btn');
  el.resetBtn = document.getElementById('reset-tasks-btn');
  el.importFile = document.getElementById('import-file');
  el.settingsForm = document.getElementById('settings-form');
  el.notificationDropdown = document.getElementById('notification-dropdown');
  el.profileDropdown = document.getElementById('profile-dropdown');
  el.dashboardSummary = document.getElementById('dashboard-summary');
}

/** Load persisted state */
function loadState() {
  state.tasks = getAllTasks();
  state.currentPage = getItem(STORAGE_KEYS.PAGE, 1);
  state.viewMode = getItem(STORAGE_KEYS.VIEW + '_mode', 'grid');
  state.notifications = getItem(STORAGE_KEYS.NOTIFICATIONS, []);

  const settings = getSettings();
  const user = getCurrentUser();

  if (el.welcomeUser) el.welcomeUser.textContent = `Welcome, ${settings.userName || user?.name || 'User'}`;
  if (el.currentDate) el.currentDate.textContent = getCurrentDateDisplay();
  if (el.profileName) el.profileName.textContent = settings.userName || user?.name;
  if (el.profileAvatar) el.profileAvatar.src = settings.profileImage || 'assets/avatar.png';

  const sidebarCollapsed = getItem(STORAGE_KEYS.SIDEBAR, false);
  setSidebarCollapsed(sidebarCollapsed);
  if (isMobileViewport()) {
    el.sidebarToggle?.setAttribute('aria-expanded', 'false');
  } else {
    updateSidebarToggleState(sidebarCollapsed);
  }

  const filters = getFilters();
  if (el.searchInput) el.searchInput.value = filters.search || '';
  document.querySelectorAll('[data-filter]').forEach((chip) => {
    chip.classList.toggle('filter-chip--active', chip.dataset.filter === (filters.status || 'all'));
  });

  const sort = getSort();
  if (el.sortSelect) el.sortSelect.value = sort.field || 'newest';
}

/** Bind all event listeners */
function bindEvents() {
  el.sidebarToggle?.addEventListener('click', toggleSidebar);
  el.mobileMenuToggle?.addEventListener('click', toggleSidebar);
  el.themeToggle?.addEventListener('click', () => {
    toggleTheme();
    showToast(ToastMessages.THEME_CHANGED, 'info', 2000);
    if (getCurrentView() === 'statistics') {
      const stats = getTaskStatistics(state.tasks);
      renderCharts(stats);
    }
  });
  el.logoutBtn?.addEventListener('click', handleLogout);
  document.getElementById('logout-btn-dropdown')?.addEventListener('click', handleLogout);
  el.fab?.addEventListener('click', () => openTaskModal());
  el.backToTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  el.searchInput?.addEventListener('input', debounce(handleSearch, 300));
  el.sortSelect?.addEventListener('change', handleSortChange);
  el.filterChips?.addEventListener('click', handleFilterClick);
  el.viewToggle?.addEventListener('click', handleViewToggle);
  el.kanbanTabs?.addEventListener('click', handleKanbanTabClick);
  el.kanbanTabs?.addEventListener('keydown', handleKanbanTabKeydown);
  el.pagination?.addEventListener('click', handlePagination);

  el.taskGrid?.addEventListener('click', handleTaskCardAction);
  document.getElementById('kanban-board')?.addEventListener('click', handleTaskCardAction);

  el.taskForm?.addEventListener('submit', handleTaskSubmit);
  el.taskFormContainer?.addEventListener('input', debounce(validateTaskFormLive, 200));

  el.fetchBtn?.addEventListener('click', handleFetchTasks);
  el.importBtn?.addEventListener('click', () => el.importFile?.click());
  el.exportBtn?.addEventListener('click', handleExport);
  el.resetBtn?.addEventListener('click', handleReset);
  el.importFile?.addEventListener('change', handleImport);

  el.settingsForm?.addEventListener('submit', handleSettingsSubmit);

  document.getElementById('notification-btn')?.addEventListener('click', toggleNotificationDropdown);
  document.getElementById('profile-btn')?.addEventListener('click', toggleProfileDropdown);
  document.addEventListener('click', closeDropdowns);

  document.getElementById('quick-add-form')?.addEventListener('submit', handleQuickAdd);

  document.addEventListener('keydown', handleKeyboardShortcuts);
  window.addEventListener('scroll', debounce(handleScroll, 100));
  window.addEventListener('resize', debounce(handleResize, 150));
  el.sidebarOverlay?.addEventListener('click', closeMobileSidebar);
  document.querySelectorAll('.sidebar [data-view]').forEach((link) => {
    link.addEventListener('click', closeMobileSidebar);
  });

  watchConnectivity(handleConnectivityChange);
}

/** Render all UI sections */
function renderAll() {
  applyFiltersAndRender();
  renderDashboard();
  renderSettings();
}

/** Apply filters, sort, and render tasks */
function applyFiltersAndRender() {
  const filters = { ...getFilters(), search: el.searchInput?.value || '' };
  saveFilters(filters);

  let tasks = filterTasks(state.tasks, filters);
  const sort = getSort();
  tasks = sortTasks(tasks, sort);
  state.filteredTasks = tasks;

  renderTaskViews();
}

/** Render task grid and kanban */
function renderTaskViews() {
  const settings = getSettings();
  const { items, currentPage, totalPages } = paginateTasks(
    state.filteredTasks,
    state.currentPage,
    settings.itemsPerPage
  );
  state.currentPage = currentPage;
  setItem(STORAGE_KEYS.PAGE, currentPage);

  if (el.taskGrid) {
    if (!state.filteredTasks.length) {
      const filters = getFilters();
      const emptyType = filters.search ? 'search' : filters.status === 'favorites' ? 'favorites' : 'tasks';
      el.taskGrid.innerHTML = renderEmptyState(emptyType);
    } else {
      el.taskGrid.innerHTML = items.map(renderTaskCard).join('');
    }
  }

  if (el.pagination) {
    el.pagination.innerHTML = renderPagination(currentPage, totalPages);
  }

  renderKanbanBoard();
  syncKanbanTabs();

  destroyAllSortables();
  if (state.viewMode === 'grid' && el.taskGrid?.children.length) {
    initCardDragDrop(el.taskGrid, () => applyFiltersAndRender());
  }
  if (state.viewMode === 'kanban') {
    initKanbanDragDrop(
      { todo: el.kanbanTodo, 'in-progress': el.kanbanInProgress, completed: el.kanbanCompleted },
      () => {
        state.tasks = getAllTasks();
        applyFiltersAndRender();
        showToast(ToastMessages.TASK_UPDATED, 'success', 2000);
      }
    );
  }

  updateViewMode();
}

/** Render kanban columns */
function renderKanbanBoard() {
  const columns = { todo: [], 'in-progress': [], completed: [] };
  state.filteredTasks.forEach((t) => {
    if (columns[t.status]) columns[t.status].push(t);
  });

  if (el.kanbanTodo) el.kanbanTodo.innerHTML = columns.todo.map(renderKanbanCard).join('') || '<p class="kanban-empty">Drop tasks here</p>';
  if (el.kanbanInProgress) el.kanbanInProgress.innerHTML = columns['in-progress'].map(renderKanbanCard).join('') || '<p class="kanban-empty">Drop tasks here</p>';
  if (el.kanbanCompleted) el.kanbanCompleted.innerHTML = columns.completed.map(renderKanbanCard).join('') || '<p class="kanban-empty">Drop tasks here</p>';
}

/** Render dashboard summary section */
function renderDashboard() {
  const stats = getTaskStatistics(state.tasks);
  const recent = getRecentActivity(state.tasks);
  const upcoming = getUpcomingDeadlines(state.tasks);

  if (el.statCards) el.statCards.innerHTML = renderStatCards(stats);
  if (el.recentActivity) el.recentActivity.innerHTML = renderRecentActivity(recent);
  if (el.upcomingDeadlines) el.upcomingDeadlines.innerHTML = renderUpcomingDeadlines(upcoming);
  if (el.calendarWidget) el.calendarWidget.innerHTML = renderCalendarWidget();
  if (el.dashboardSummary) {
    el.dashboardSummary.innerHTML = `
      <div class="summary-card">
        <h3>Task Overview</h3>
        <p>${stats.total} total tasks · ${stats.completionPercentage}% complete</p>
      </div>
    `;
  }

  updateProgressCircle(stats.completionPercentage);
}

/** Render statistics view */
function renderStatistics() {
  const stats = getTaskStatistics(state.tasks);
  if (el.statCards) {
    const statsSection = document.getElementById('statistics-stat-cards');
    if (statsSection) statsSection.innerHTML = renderStatCards(stats);
  }
  renderCharts(stats);
}

/** Render settings form */
function renderSettings() {
  const settings = getSettings();
  const userName = document.getElementById('settings-username');
  const profilePreview = document.getElementById('settings-avatar-preview');
  if (userName) userName.value = settings.userName;
  if (profilePreview) profilePreview.src = settings.profileImage;
}

/** Handle view change from router */
function handleViewChange(view) {
  closeMobileSidebar();
  if (view === 'statistics') {
    setTimeout(() => renderStatistics(), 100);
  }
  if (view === 'dashboard') renderDashboard();
}

/** Open task modal for add/edit */
function openTaskModal(task = null) {
  state.editingTaskId = task?.id || null;
  const title = task ? 'Edit Task' : 'Add New Task';
  const titleEl = document.getElementById('task-modal-title');
  if (titleEl) titleEl.textContent = title;

  if (el.taskFormContainer) {
    el.taskFormContainer.innerHTML = renderTaskForm(task);
  }

  if (el.saveTaskBtn) el.saveTaskBtn.disabled = true;
  openModal('task-modal');
  validateTaskFormLive();
}

/** Live task form validation */
function validateTaskFormLive() {
  const data = getTaskFormData();
  const result = validateTaskForm(data, state.tasks, state.editingTaskId);

  if (el.saveTaskBtn) el.saveTaskBtn.disabled = !result.valid;

  const descCount = document.getElementById('task-desc-count');
  if (descCount) descCount.textContent = `${data.description.length}/500`;

  return result;
}

/** Handle task form submit */
function handleTaskSubmit(e) {
  e.preventDefault();
  const data = getTaskFormData();
  const result = validateTaskForm(data, state.tasks, state.editingTaskId);

  if (!result.valid) {
    displayFormErrors(result.errors);
    showToast(ToastMessages.VALIDATION_ERROR, 'error');
    return;
  }

  clearFormErrors();

  if (state.editingTaskId) {
    updateTask(state.editingTaskId, result.sanitized);
    addNotification('Task updated', 'fa-pen');
    showToast(ToastMessages.TASK_UPDATED, 'success');
  } else {
    createTask(result.sanitized);
    addNotification('New task created', 'fa-plus');
    showToast(ToastMessages.TASK_ADDED, 'success');
  }

  state.tasks = getAllTasks();
  closeModal();
  applyFiltersAndRender();
  renderDashboard();
}

/** Handle task card actions */
function handleTaskCardAction(e) {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;

  const card = btn.closest('[data-task-id]');
  if (!card) return;

  const taskId = card.dataset.taskId;
  const action = btn.dataset.action;
  const task = state.tasks.find((t) => t.id === taskId);
  if (!task && action !== 'delete') return;

  switch (action) {
    case 'edit':
      openTaskModal(task);
      break;
    case 'delete':
      openConfirmModal({
        title: 'Delete Task',
        message: `Are you sure you want to delete "${task.title}"?`,
        onConfirm: () => {
          deleteTask(taskId);
          state.tasks = getAllTasks();
          addNotification('Task deleted', 'fa-trash');
          showToast(ToastMessages.TASK_DELETED, 'success');
          applyFiltersAndRender();
          renderDashboard();
        },
      });
      break;
    case 'duplicate':
      duplicateTask(taskId);
      state.tasks = getAllTasks();
      showToast(ToastMessages.TASK_DUPLICATED, 'success');
      applyFiltersAndRender();
      break;
    case 'favorite':
      toggleFavorite(taskId);
      state.tasks = getAllTasks();
      applyFiltersAndRender();
      break;
    default:
      break;
  }
}

/** Handle search */
function handleSearch() {
  state.currentPage = 1;
  applyFiltersAndRender();
  saveRecentSearch(el.searchInput.value);
}

/** Save recent search */
function saveRecentSearch(term) {
  if (!term) return;
  const recent = getItem(STORAGE_KEYS.RECENT_SEARCHES, []);
  const updated = [term, ...recent.filter((s) => s !== term)].slice(0, 5);
  setItem(STORAGE_KEYS.RECENT_SEARCHES, updated);
}

/** Handle filter chip click */
function handleFilterClick(e) {
  const chip = e.target.closest('[data-filter]');
  if (!chip) return;

  const filter = chip.dataset.filter;
  const filters = getFilters();
  filters.status = filter;
  saveFilters(filters);

  document.querySelectorAll('[data-filter]').forEach((c) => {
    c.classList.toggle('filter-chip--active', c.dataset.filter === filter);
  });

  state.currentPage = 1;
  applyFiltersAndRender();
}

/** Handle sort change */
function handleSortChange() {
  saveSort({ field: el.sortSelect.value, direction: 'desc' });
  applyFiltersAndRender();
}

/** Handle view toggle (grid/kanban) */
function handleViewToggle(e) {
  const btn = e.target.closest('[data-view-mode]');
  if (!btn) return;

  state.viewMode = btn.dataset.viewMode;
  setItem(STORAGE_KEYS.VIEW + '_mode', state.viewMode);
  updateViewMode();
  applyFiltersAndRender();
}

/** Update view mode UI */
function updateViewMode() {
  const grid = document.getElementById('tasks-grid-view');
  const kanban = document.getElementById('kanban-board');
  if (grid) grid.hidden = state.viewMode === 'kanban';
  if (kanban) kanban.hidden = state.viewMode !== 'kanban';
  if (el.kanbanTabs) el.kanbanTabs.hidden = state.viewMode !== 'kanban' || !isMobileViewport();

  document.querySelectorAll('[data-view-mode]').forEach((btn) => {
    btn.classList.toggle('view-btn--active', btn.dataset.viewMode === state.viewMode);
    btn.setAttribute('aria-pressed', String(btn.dataset.viewMode === state.viewMode));
  });

  syncKanbanTabs();
}

/** Handle mobile kanban tab click */
function handleKanbanTabClick(e) {
  const tab = e.target.closest('[data-kanban-tab]');
  if (!tab) return;
  setActiveKanbanTab(tab.dataset.kanbanTab, true);
}

/** Handle keyboard navigation for mobile kanban tabs */
function handleKanbanTabKeydown(e) {
  const tabs = [...document.querySelectorAll('[data-kanban-tab]')];
  const currentIndex = tabs.findIndex((tab) => tab === document.activeElement);
  if (currentIndex === -1) return;

  let nextIndex = currentIndex;
  if (e.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabs.length;
  else if (e.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
  else if (e.key === 'Home') nextIndex = 0;
  else if (e.key === 'End') nextIndex = tabs.length - 1;
  else return;

  e.preventDefault();
  setActiveKanbanTab(tabs[nextIndex].dataset.kanbanTab, true);
  tabs[nextIndex].focus();
}

/** Activate a kanban tab on mobile */
function setActiveKanbanTab(status, focusPanel = false) {
  if (!['todo', 'in-progress', 'completed'].includes(status)) return;
  state.activeKanbanTab = status;
  syncKanbanTabs();

  if (focusPanel && isMobileViewport()) {
    document.querySelector(`[data-kanban-panel="${status}"]`)?.focus({ preventScroll: true });
  }
}

/** Keep kanban tabs and panels in sync with the active breakpoint */
function syncKanbanTabs() {
  const mobile = isMobileViewport();
  const kanbanActive = state.viewMode === 'kanban';

  if (el.kanbanTabs) {
    el.kanbanTabs.hidden = !kanbanActive || !mobile;
  }

  document.querySelectorAll('[data-kanban-tab]').forEach((tab) => {
    const active = tab.dataset.kanbanTab === state.activeKanbanTab;
    tab.classList.toggle('kanban-tab--active', active);
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
  });

  document.querySelectorAll('[data-kanban-panel]').forEach((panel) => {
    const active = panel.dataset.kanbanPanel === state.activeKanbanTab;
    panel.hidden = mobile && kanbanActive ? !active : false;
    panel.tabIndex = mobile && active ? 0 : -1;
  });
}

/** Handle pagination */
function handlePagination(e) {
  const btn = e.target.closest('[data-page]');
  if (!btn || btn.disabled) return;

  const page = btn.dataset.page;
  const settings = getSettings();
  const { totalPages } = paginateTasks(state.filteredTasks, state.currentPage, settings.itemsPerPage);

  if (page === 'prev') state.currentPage = Math.max(1, state.currentPage - 1);
  else if (page === 'next') state.currentPage = Math.min(totalPages, state.currentPage + 1);
  else state.currentPage = parseInt(page, 10);

  applyFiltersAndRender();
  el.taskGrid?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/** Fetch tasks from API */
async function handleFetchTasks() {
  setPageLoader(true);
  const result = await fetchDemoTasks();
  setPageLoader(false);

  if (result.success) {
    const { imported, skipped } = mergeTasks(result.tasks);
    state.tasks = getAllTasks();
    addNotification(`Imported ${imported} tasks from API`, 'fa-cloud-arrow-down');
    showToast(`${ToastMessages.FETCH_SUCCESS} (${imported} new, ${skipped} skipped)`, 'success');
    applyFiltersAndRender();
    renderDashboard();
  } else {
    showToast(result.error || ToastMessages.FETCH_ERROR, 'error');
  }
}

/** Export tasks */
function handleExport() {
  const data = exportTasks();
  downloadJSON(data, `tasks-export-${Date.now()}.json`);
  showToast(ToastMessages.EXPORT_SUCCESS, 'success');
}

/** Import tasks from JSON file */
async function handleImport(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    const text = await readFileAsText(file);
    const data = JSON.parse(text);
    const validation = validateImportData(data);

    if (!validation.valid) {
      showToast(validation.errors[0] || 'Invalid file', 'error');
      return;
    }

    const { imported } = mergeTasks(validation.tasks);
    state.tasks = getAllTasks();
    showToast(`${ToastMessages.IMPORT_SUCCESS} (${imported} tasks)`, 'success');
    applyFiltersAndRender();
    renderDashboard();
  } catch {
    showToast('Failed to parse JSON file', 'error');
  }

  e.target.value = '';
}

/** Reset all tasks */
function handleReset() {
  openConfirmModal({
    title: 'Reset All Tasks',
    message: 'This will permanently delete all tasks. This action can be undone once.',
    onConfirm: () => {
      resetTasks();
      state.tasks = [];
      showToast(ToastMessages.RESET_SUCCESS, 'warning');
      applyFiltersAndRender();
      renderDashboard();
    },
  });
}

/** Handle settings form */
function handleSettingsSubmit(e) {
  e.preventDefault();
  const settings = getSettings();
  settings.userName = document.getElementById('settings-username')?.value || settings.userName;
  const avatarInput = document.getElementById('settings-avatar');
  if (avatarInput?.files?.[0]) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      settings.profileImage = ev.target.result;
      saveSettings(settings);
      if (el.profileAvatar) el.profileAvatar.src = settings.profileImage;
      showToast(ToastMessages.SETTINGS_SAVED, 'success');
    };
    reader.readAsDataURL(avatarInput.files[0]);
  } else {
    saveSettings(settings);
    if (el.welcomeUser) el.welcomeUser.textContent = `Welcome, ${settings.userName}`;
    if (el.profileName) el.profileName.textContent = settings.userName;
    showToast(ToastMessages.SETTINGS_SAVED, 'success');
  }
}

/** Quick add task */
function handleQuickAdd(e) {
  e.preventDefault();
  const input = document.getElementById('quick-add-input');
  const title = input?.value?.trim();
  if (!title || title.length < 3) {
    showToast('Title must be at least 3 characters', 'error');
    return;
  }

  createTask({
    title,
    description: '',
    category: 'General',
    priority: 'medium',
    status: 'todo',
    dueDate: '',
    estimatedTime: 30,
    tags: [],
    favorite: false,
    colorLabel: '#6366f1',
  });

  state.tasks = getAllTasks();
  input.value = '';
  showToast(ToastMessages.TASK_ADDED, 'success');
  applyFiltersAndRender();
  renderDashboard();
}

/** Toggle sidebar */
function toggleSidebar() {
  if (isMobileViewport()) {
    const isOpen = el.sidebar?.classList.contains('sidebar--open');
    if (isOpen) closeMobileSidebar();
    else openMobileSidebar();
    return;
  }

  const collapsed = !getItem(STORAGE_KEYS.SIDEBAR, false);
  setSidebarCollapsed(collapsed);
  setItem(STORAGE_KEYS.SIDEBAR, collapsed);
  updateSidebarToggleState(collapsed);
}

/** Open mobile sidebar drawer */
function openMobileSidebar() {
  el.sidebar?.classList.add('sidebar--open');
  el.sidebarOverlay?.classList.add('sidebar-overlay--active');
  el.sidebarOverlay?.setAttribute('aria-hidden', 'false');
  document.body.classList.add('sidebar-open');
  el.mobileMenuToggle?.setAttribute('aria-expanded', 'true');
  el.mobileMenuToggle?.setAttribute('aria-label', 'Close navigation');
  el.sidebarToggle?.setAttribute('aria-expanded', 'true');
}

/** Close mobile sidebar drawer */
function closeMobileSidebar() {
  el.sidebar?.classList.remove('sidebar--open');
  el.sidebarOverlay?.classList.remove('sidebar-overlay--active');
  el.sidebarOverlay?.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('sidebar-open');
  el.mobileMenuToggle?.setAttribute('aria-expanded', 'false');
  el.mobileMenuToggle?.setAttribute('aria-label', 'Open navigation');

  el.sidebarToggle?.setAttribute(
    'aria-expanded',
    isMobileViewport() ? 'false' : String(!getItem(STORAGE_KEYS.SIDEBAR, false))
  );
}

/** Reflect desktop sidebar collapsed state for assistive tech */
function updateSidebarToggleState(collapsed) {
  el.sidebarToggle?.setAttribute('aria-expanded', String(!collapsed));
}

/** Current responsive drawer breakpoint */
function isMobileViewport() {
  return window.matchMedia('(max-width: 767px)').matches;
}

/** Keep responsive-only UI state correct after breakpoint changes */
function handleResize() {
  if (!isMobileViewport()) {
    closeMobileSidebar();
    setSidebarCollapsed(getItem(STORAGE_KEYS.SIDEBAR, false));
    updateSidebarToggleState(getItem(STORAGE_KEYS.SIDEBAR, false));
  }
  syncKanbanTabs();
}

/** Handle logout */
function handleLogout() {
  logout();
  showToast(ToastMessages.LOGOUT_SUCCESS, 'info', 1500);
  setTimeout(() => { window.location.href = 'index.html'; }, 800);
}

/** Add notification */
function addNotification(message, icon = 'fa-bell') {
  state.notifications.unshift({ message, icon, time: new Date().toISOString(), read: false });
  state.notifications = state.notifications.slice(0, 20);
  setItem(STORAGE_KEYS.NOTIFICATIONS, state.notifications);
  updateNotificationBadge(state.notifications.filter((n) => !n.read).length);
}

/** Toggle notification dropdown */
function toggleNotificationDropdown(e) {
  e.stopPropagation();
  if (el.notificationDropdown) {
    el.notificationDropdown.classList.toggle('dropdown--open');
    el.notificationDropdown.innerHTML = renderNotifications(state.notifications);
    state.notifications.forEach((n) => { n.read = true; });
    setItem(STORAGE_KEYS.NOTIFICATIONS, state.notifications);
    updateNotificationBadge(0);
  }
}

/** Toggle profile dropdown */
function toggleProfileDropdown(e) {
  e.stopPropagation();
  el.profileDropdown?.classList.toggle('dropdown--open');
}

/** Close dropdowns on outside click */
function closeDropdowns() {
  el.notificationDropdown?.classList.remove('dropdown--open');
  el.profileDropdown?.classList.remove('dropdown--open');
}

/** Keyboard shortcuts */
function handleKeyboardShortcuts(e) {
  if (e.key === 'n' && !e.ctrlKey && !e.metaKey && !isInputFocused()) {
    e.preventDefault();
    openTaskModal();
  }
  if (e.key === 'Escape') {
    closeModal();
    closeMobileSidebar();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    if (document.getElementById('task-modal')?.closest('.modal-overlay--active')) {
      el.taskForm?.requestSubmit();
    }
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
    e.preventDefault();
    el.searchInput?.focus();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
    e.preventDefault();
    if (e.shiftKey) {
      redoLastAction();
      state.tasks = getAllTasks();
      showToast(ToastMessages.REDO_SUCCESS, 'info', 2000);
    } else {
      undoLastAction();
      state.tasks = getAllTasks();
      showToast(ToastMessages.UNDO_SUCCESS, 'info', 2000);
    }
    applyFiltersAndRender();
    renderDashboard();
  }
}

/** Check if input is focused */
function isInputFocused() {
  const tag = document.activeElement?.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

/** Handle scroll for back-to-top */
function handleScroll() {
  if (el.backToTop) {
    el.backToTop.classList.toggle('back-to-top--visible', window.scrollY > 400);
  }
}

/** Handle connectivity changes */
function handleConnectivityChange(online) {
  if (!online) showToast(ToastMessages.NETWORK_ERROR, 'warning');
}

/** Hide page loader */
function hidePageLoader() {
  setTimeout(() => setPageLoader(false), 600);
}

/** Get current view helper */
function getCurrentView() {
  return document.querySelector('.section--active')?.dataset.section || 'dashboard';
}

document.addEventListener('DOMContentLoaded', init);
