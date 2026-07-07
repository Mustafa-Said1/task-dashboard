/**
 * UI rendering module.
 * All DOM manipulation and template rendering.
 */

import {
  escapeHtml,
  formatDate,
  formatRelativeTime,
  statusLabel,
  priorityLabel,
  isOverdue,
} from './utils.js';
import { FORM_OPTIONS } from './validation.js';

/** Render a single task card */
export function renderTaskCard(task) {
  const overdue = isOverdue(task);
  const progress = task.status === 'completed' ? 100 : task.status === 'in-progress' ? 50 : 0;

  return `
    <article class="task-card animate-fade-in" data-task-id="${task.id}" style="--card-accent: ${task.colorLabel}">
      <div class="task-card__header">
        <button class="task-card__drag-handle" aria-label="Drag to reorder" tabindex="0">
          <i class="fa-solid fa-grip-vertical" aria-hidden="true"></i>
        </button>
        <div class="task-card__color" style="background: ${task.colorLabel}"></div>
        <h3 class="task-card__title">${escapeHtml(task.title)}</h3>
        <button class="task-card__favorite ${task.favorite ? 'task-card__favorite--active' : ''}"
                data-action="favorite" aria-label="${task.favorite ? 'Remove from favorites' : 'Add to favorites'}">
          <i class="fa-${task.favorite ? 'solid' : 'regular'} fa-star" aria-hidden="true"></i>
        </button>
      </div>
      <p class="task-card__description">${escapeHtml(task.description || 'No description')}</p>
      <div class="task-card__meta">
        <span class="badge badge--category"><i class="fa-solid fa-folder" aria-hidden="true"></i> ${escapeHtml(task.category)}</span>
        <span class="badge badge--priority badge--${task.priority}">${priorityLabel(task.priority)}</span>
        <span class="badge badge--status badge--${task.status}">${statusLabel(task.status)}</span>
      </div>
      <div class="task-card__due ${overdue ? 'task-card__due--overdue' : ''}">
        <i class="fa-regular fa-calendar" aria-hidden="true"></i>
        ${task.dueDate ? formatDate(task.dueDate) : 'No due date'}
        ${overdue ? '<span class="overdue-tag">Overdue</span>' : ''}
      </div>
      <div class="task-card__progress">
        <div class="progress-bar">
          <div class="progress-bar__fill" style="width: ${progress}%"></div>
        </div>
        <span class="task-card__progress-text">${progress}%</span>
      </div>
      ${task.tags?.length ? `
        <div class="task-card__tags">
          ${task.tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join('')}
        </div>
      ` : ''}
      <div class="task-card__actions">
        <button class="btn-icon" data-action="edit" aria-label="Edit task" title="Edit">
          <i class="fa-solid fa-pen" aria-hidden="true"></i>
        </button>
        <button class="btn-icon" data-action="duplicate" aria-label="Duplicate task" title="Duplicate">
          <i class="fa-solid fa-copy" aria-hidden="true"></i>
        </button>
        <button class="btn-icon btn-icon--danger" data-action="delete" aria-label="Delete task" title="Delete">
          <i class="fa-solid fa-trash" aria-hidden="true"></i>
        </button>
      </div>
    </article>
  `;
}

/** Render kanban card */
export function renderKanbanCard(task) {
  return `
    <div class="kanban-card" data-task-id="${task.id}" style="--card-accent: ${task.colorLabel}">
      <div class="kanban-card__header">
        <button class="kanban-card__drag" aria-label="Drag card">
          <i class="fa-solid fa-grip-vertical" aria-hidden="true"></i>
        </button>
        <span class="badge badge--priority badge--${task.priority}">${priorityLabel(task.priority)}</span>
      </div>
      <h4 class="kanban-card__title">${escapeHtml(task.title)}</h4>
      <p class="kanban-card__desc">${escapeHtml((task.description || '').slice(0, 80))}${task.description?.length > 80 ? '...' : ''}</p>
      <div class="kanban-card__footer">
        <span class="kanban-card__due"><i class="fa-regular fa-calendar" aria-hidden="true"></i> ${task.dueDate ? formatDate(task.dueDate) : '—'}</span>
        <button class="btn-icon btn-icon--sm" data-action="edit" aria-label="Edit">
          <i class="fa-solid fa-pen" aria-hidden="true"></i>
        </button>
      </div>
    </div>
  `;
}

/** Render empty state */
export function renderEmptyState(type = 'tasks') {
  const states = {
    tasks: { icon: 'fa-clipboard-list', title: 'No tasks yet', message: 'Create your first task to get started!' },
    search: { icon: 'fa-magnifying-glass', title: 'No results found', message: 'Try adjusting your search or filters.' },
    favorites: { icon: 'fa-star', title: 'No favorites', message: 'Star tasks to add them to your favorites.' },
    offline: { icon: 'fa-wifi', title: 'No internet connection', message: 'Check your connection and try again.' },
  };
  const state = states[type] || states.tasks;

  return `
    <div class="empty-state" role="status">
      <div class="empty-state__icon"><i class="fa-solid ${state.icon}" aria-hidden="true"></i></div>
      <h3 class="empty-state__title">${state.title}</h3>
      <p class="empty-state__message">${state.message}</p>
    </div>
  `;
}

/** Render statistics cards */
export function renderStatCards(stats) {
  const cards = [
    { label: 'Total Tasks', value: stats.total, icon: 'fa-list-check', color: '#6366f1' },
    { label: 'Completed', value: stats.completed, icon: 'fa-circle-check', color: '#22c55e' },
    { label: 'Pending', value: stats.pending, icon: 'fa-clock', color: '#f59e0b' },
    { label: 'Overdue', value: stats.overdue, icon: 'fa-triangle-exclamation', color: '#ef4444' },
    { label: 'Favorites', value: stats.favorites, icon: 'fa-star', color: '#ec4899' },
    { label: 'Completion', value: `${stats.completionPercentage}%`, icon: 'fa-chart-pie', color: '#8b5cf6' },
  ];

  return cards
    .map(
      (c) => `
    <div class="stat-card" style="--stat-color: ${c.color}">
      <div class="stat-card__icon"><i class="fa-solid ${c.icon}" aria-hidden="true"></i></div>
      <div class="stat-card__content">
        <span class="stat-card__value">${c.value}</span>
        <span class="stat-card__label">${c.label}</span>
      </div>
    </div>
  `
    )
    .join('');
}

/** Render recent activity list */
export function renderRecentActivity(activities) {
  if (!activities.length) {
    return '<p class="text-muted">No recent activity</p>';
  }

  return activities
    .map(
      (task) => `
    <div class="activity-item">
      <div class="activity-item__dot" style="background: ${task.colorLabel}"></div>
      <div class="activity-item__content">
        <span class="activity-item__title">${escapeHtml(task.title)}</span>
        <span class="activity-item__time">${formatRelativeTime(task.updatedAt)}</span>
      </div>
      <span class="badge badge--status badge--${task.status} badge--sm">${statusLabel(task.status)}</span>
    </div>
  `
    )
    .join('');
}

/** Render upcoming deadlines */
export function renderUpcomingDeadlines(tasks) {
  if (!tasks.length) {
    return '<p class="text-muted">No upcoming deadlines</p>';
  }

  return tasks
    .map(
      (task) => `
    <div class="deadline-item">
      <div class="deadline-item__date">
        <span class="deadline-item__day">${new Date(task.dueDate).getDate()}</span>
        <span class="deadline-item__month">${new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short' })}</span>
      </div>
      <div class="deadline-item__info">
        <span class="deadline-item__title">${escapeHtml(task.title)}</span>
        <span class="badge badge--priority badge--${task.priority} badge--sm">${priorityLabel(task.priority)}</span>
      </div>
    </div>
  `
    )
    .join('');
}

/** Render pagination controls */
export function renderPagination(currentPage, totalPages) {
  if (totalPages <= 1) return '';

  let pages = '';
  for (let i = 1; i <= totalPages; i++) {
    pages += `<button class="pagination__btn ${i === currentPage ? 'pagination__btn--active' : ''}"
                     data-page="${i}" aria-label="Page ${i}" ${i === currentPage ? 'aria-current="page"' : ''}>${i}</button>`;
  }

  return `
    <nav class="pagination" aria-label="Task pagination">
      <button class="pagination__btn" data-page="prev" ${currentPage === 1 ? 'disabled' : ''} aria-label="Previous page">
        <i class="fa-solid fa-chevron-left" aria-hidden="true"></i>
      </button>
      ${pages}
      <button class="pagination__btn" data-page="next" ${currentPage === totalPages ? 'disabled' : ''} aria-label="Next page">
        <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
      </button>
    </nav>
  `;
}

/** Render task form fields */
export function renderTaskForm(task = null) {
  const t = task || {
    title: '', description: '', category: 'General', priority: 'medium',
    status: 'todo', dueDate: '', estimatedTime: 30, tags: [], favorite: false, colorLabel: '#6366f1',
  };
  const tagsStr = Array.isArray(t.tags) ? t.tags.join(', ') : '';

  return `
    <div class="form-group">
      <label for="task-title" class="form-label">Title <span class="required">*</span></label>
      <input type="text" id="task-title" name="title" class="form-input" value="${escapeHtml(t.title)}"
             placeholder="Enter task title" required minlength="3" aria-describedby="task-title-error">
      <span class="form-error" id="task-title-error" role="alert"></span>
    </div>
    <div class="form-group">
      <label for="task-description" class="form-label">Description</label>
      <textarea id="task-description" name="description" class="form-input form-textarea"
                placeholder="Enter description (max 500 chars)" maxlength="500" rows="3"
                aria-describedby="task-desc-count task-description-error">${escapeHtml(t.description)}</textarea>
      <span class="form-hint" id="task-desc-count">${t.description?.length || 0}/500</span>
      <span class="form-error" id="task-description-error" role="alert"></span>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label for="task-category" class="form-label">Category <span class="required">*</span></label>
        <select id="task-category" name="category" class="form-input" required>
          ${FORM_OPTIONS.CATEGORIES.map((c) => `<option value="${c}" ${t.category === c ? 'selected' : ''}>${c}</option>`).join('')}
        </select>
        <span class="form-error" id="task-category-error" role="alert"></span>
      </div>
      <div class="form-group">
        <label for="task-priority" class="form-label">Priority <span class="required">*</span></label>
        <select id="task-priority" name="priority" class="form-input" required>
          ${FORM_OPTIONS.PRIORITIES.map((p) => `<option value="${p}" ${t.priority === p ? 'selected' : ''}>${priorityLabel(p)}</option>`).join('')}
        </select>
        <span class="form-error" id="task-priority-error" role="alert"></span>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label for="task-status" class="form-label">Status <span class="required">*</span></label>
        <select id="task-status" name="status" class="form-input" required>
          ${FORM_OPTIONS.STATUSES.map((s) => `<option value="${s}" ${t.status === s ? 'selected' : ''}>${statusLabel(s)}</option>`).join('')}
        </select>
        <span class="form-error" id="task-status-error" role="alert"></span>
      </div>
      <div class="form-group">
        <label for="task-due-date" class="form-label">Due Date</label>
        <input type="date" id="task-due-date" name="dueDate" class="form-input" value="${t.dueDate || ''}"
               aria-describedby="task-due-date-error">
        <span class="form-error" id="task-due-date-error" role="alert"></span>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label for="task-estimated-time" class="form-label">Estimated Time (min)</label>
        <input type="number" id="task-estimated-time" name="estimatedTime" class="form-input"
               value="${t.estimatedTime || 30}" min="0" step="5">
      </div>
      <div class="form-group">
        <label for="task-color" class="form-label">Color Label</label>
        <input type="color" id="task-color" name="colorLabel" class="form-input form-color" value="${t.colorLabel || '#6366f1'}">
      </div>
    </div>
    <div class="form-group">
      <label for="task-tags" class="form-label">Tags</label>
      <input type="text" id="task-tags" name="tags" class="form-input" value="${escapeHtml(tagsStr)}"
             placeholder="Comma-separated tags">
    </div>
    <div class="form-group form-group--checkbox">
      <label class="checkbox-label">
        <input type="checkbox" id="task-favorite" name="favorite" ${t.favorite ? 'checked' : ''}>
        <span class="checkbox-custom"></span>
        Mark as favorite
      </label>
    </div>
  `;
}

/** Show form validation errors */
export function displayFormErrors(errors) {
  document.querySelectorAll('.form-error').forEach((el) => {
    el.textContent = '';
  });
  document.querySelectorAll('.form-input--error').forEach((el) => {
    el.classList.remove('form-input--error');
  });

  Object.entries(errors).forEach(([field, message]) => {
    const errorEl = document.getElementById(`task-${field.replace(/([A-Z])/g, '-$1').toLowerCase()}-error`)
      || document.getElementById(`task-${field}-error`);
    const inputEl = document.getElementById(`task-${field.replace(/([A-Z])/g, '-$1').toLowerCase()}`)
      || document.getElementById(`task-${field}`)
      || document.querySelector(`[name="${field}"]`);

    if (errorEl) errorEl.textContent = message;
    if (inputEl) inputEl.classList.add('form-input--error');
  });
}

/** Clear form errors */
export function clearFormErrors() {
  displayFormErrors({});
}

/** Get task form data from DOM */
export function getTaskFormData() {
  return {
    title: document.getElementById('task-title')?.value || '',
    description: document.getElementById('task-description')?.value || '',
    category: document.getElementById('task-category')?.value || '',
    priority: document.getElementById('task-priority')?.value || '',
    status: document.getElementById('task-status')?.value || '',
    dueDate: document.getElementById('task-due-date')?.value || '',
    estimatedTime: document.getElementById('task-estimated-time')?.value || 30,
    tags: document.getElementById('task-tags')?.value || '',
    favorite: document.getElementById('task-favorite')?.checked || false,
    colorLabel: document.getElementById('task-color')?.value || '#6366f1',
  };
}

/** Render notifications dropdown */
export function renderNotifications(notifications = []) {
  if (!notifications.length) {
    return '<p class="dropdown__empty">No notifications</p>';
  }

  return notifications
    .map(
      (n) => `
    <div class="notification-item ${n.read ? '' : 'notification-item--unread'}">
      <i class="fa-solid ${n.icon || 'fa-bell'}" aria-hidden="true"></i>
      <div>
        <p class="notification-item__text">${escapeHtml(n.message)}</p>
        <span class="notification-item__time">${formatRelativeTime(n.time)}</span>
      </div>
    </div>
  `
    )
    .join('');
}

/** Render calendar widget (UI only) */
export function renderCalendarWidget() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = now.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  let days = '';
  for (let i = 0; i < firstDay; i++) {
    days += '<span class="calendar__day calendar__day--empty"></span>';
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = d === now.getDate();
    days += `<span class="calendar__day ${isToday ? 'calendar__day--today' : ''}">${d}</span>`;
  }

  return `
    <div class="calendar-widget">
      <div class="calendar-widget__header">
        <span>${monthName}</span>
      </div>
      <div class="calendar__weekdays">
        <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
      </div>
      <div class="calendar__days">${days}</div>
    </div>
  `;
}

/** Toggle sidebar collapsed state */
export function setSidebarCollapsed(collapsed) {
  const sidebar = document.getElementById('sidebar');
  const main = document.getElementById('main-content');
  if (sidebar) sidebar.classList.toggle('sidebar--collapsed', collapsed);
  if (main) main.classList.toggle('main--expanded', collapsed);
}

/** Update notification badge count */
export function updateNotificationBadge(count) {
  const badge = document.getElementById('notification-badge');
  if (badge) {
    badge.textContent = count;
    badge.hidden = count === 0;
  }
}
