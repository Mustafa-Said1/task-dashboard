/**
 * Utility functions shared across the application.
 * Pure helpers with no side effects or DOM access.
 */

/** Generate a unique identifier */
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/** Trim and normalize whitespace in a string */
export function trimString(value) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
}

/** Validate email format */
export function isValidEmail(email) {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
}

/** Format date for display */
export function formatDate(dateString, options = {}) {
  if (!dateString) return 'No date';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'Invalid date';
  const defaults = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString(undefined, { ...defaults, ...options });
}

/** Format relative time (e.g. "2 hours ago") */
export function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateString);
}

/** Check if a date is in the past (before today) */
export function isPastDate(dateString) {
  if (!dateString) return false;
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date < today;
}

/** Check if date is today */
export function isToday(dateString) {
  if (!dateString) return false;
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

/** Check if task is overdue */
export function isOverdue(task) {
  return task.status !== 'completed' && task.dueDate && isPastDate(task.dueDate);
}

/** Debounce function calls */
export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/** Throttle function calls */
export function throttle(fn, limit = 200) {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => { inThrottle = false; }, limit);
    }
  };
}

/** Deep clone a plain object/array */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/** Escape HTML to prevent XSS */
export function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/** Parse tags from comma-separated string */
export function parseTags(tagString) {
  if (!tagString) return [];
  return tagString
    .split(',')
    .map((t) => trimString(t))
    .filter(Boolean);
}

/** Join tags for display */
export function formatTags(tags) {
  return Array.isArray(tags) ? tags.join(', ') : '';
}

/** Get today's date as YYYY-MM-DD */
export function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

/** Get current formatted date for header */
export function getCurrentDateDisplay() {
  return new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** Calculate completion percentage */
export function calcCompletionPercentage(tasks) {
  if (!tasks.length) return 0;
  const completed = tasks.filter((t) => t.status === 'completed').length;
  return Math.round((completed / tasks.length) * 100);
}

/** Priority sort weight */
export function priorityWeight(priority) {
  const weights = { high: 3, medium: 2, low: 1 };
  return weights[priority] || 0;
}

/** Status display label */
export function statusLabel(status) {
  const labels = {
    todo: 'To Do',
    'in-progress': 'In Progress',
    completed: 'Completed',
  };
  return labels[status] || status;
}

/** Priority display label */
export function priorityLabel(priority) {
  return priority ? priority.charAt(0).toUpperCase() + priority.slice(1) : '';
}

/** Download JSON file */
export function downloadJSON(data, filename = 'tasks-export.json') {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/** Read file as text */
export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/** Get start of week (Monday) */
export function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Get days of current week as date strings */
export function getWeekDays() {
  const start = getWeekStart();
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

/** Clamp number between min and max */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/** Create empty task template */
export function createEmptyTask() {
  return {
    id: generateId(),
    title: '',
    description: '',
    category: 'General',
    priority: 'medium',
    status: 'todo',
    dueDate: '',
    estimatedTime: 30,
    tags: [],
    favorite: false,
    colorLabel: '#6366f1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    order: 0,
  };
}
