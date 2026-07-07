/**
 * Form validation module.
 * Pure validation logic separated from UI rendering.
 */

import { trimString, isPastDate, parseTags } from './utils.js';

const CATEGORIES = ['General', 'Work', 'Personal', 'Shopping', 'Health', 'Education', 'Finance', 'Other'];
const PRIORITIES = ['high', 'medium', 'low'];
const STATUSES = ['todo', 'in-progress', 'completed'];

/**
 * Validate login form fields
 */
export function validateLoginForm(email, password) {
  const errors = {};
  const trimmedEmail = trimString(email);
  const trimmedPassword = trimString(password);

  if (!trimmedEmail) errors.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!trimmedPassword) errors.password = 'Password is required';
  else if (trimmedPassword.length < 8) errors.password = 'Password must be at least 8 characters';

  return { valid: Object.keys(errors).length === 0, errors };
}

/**
 * Validate task form data
 * @param {Object} data - Task form fields
 * @param {Array} existingTasks - For duplicate check
 * @param {string} excludeId - Task ID to exclude when editing
 */
export function validateTaskForm(data, existingTasks = [], excludeId = null) {
  const errors = {};
  const title = trimString(data.title || '');
  const description = trimString(data.description || '');
  const category = trimString(data.category || '');
  const priority = data.priority || '';
  const status = data.status || '';
  const dueDate = data.dueDate || '';

  if (!title) {
    errors.title = 'Title is required';
  } else if (title.length < 3) {
    errors.title = 'Title must be at least 3 characters';
  }

  if (description.length > 500) {
    errors.description = 'Description cannot exceed 500 characters';
  }

  if (!category) {
    errors.category = 'Category is required';
  } else if (!CATEGORIES.includes(category)) {
    errors.category = 'Please select a valid category';
  }

  if (!priority) {
    errors.priority = 'Priority is required';
  } else if (!PRIORITIES.includes(priority)) {
    errors.priority = 'Please select a valid priority';
  }

  if (!status) {
    errors.status = 'Status is required';
  } else if (!STATUSES.includes(status)) {
    errors.status = 'Please select a valid status';
  }

  if (dueDate && isPastDate(dueDate)) {
    errors.dueDate = 'Due date cannot be in the past';
  }

  const duplicate = existingTasks.find(
    (t) =>
      t.id !== excludeId &&
      trimString(t.title).toLowerCase() === title.toLowerCase() &&
      t.dueDate === dueDate &&
      title.length >= 3
  );

  if (duplicate) {
    errors.title = 'A task with this title and due date already exists';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    sanitized: {
      title,
      description,
      category,
      priority,
      status,
      dueDate,
      estimatedTime: Math.max(0, parseInt(data.estimatedTime, 10) || 0),
      tags: typeof data.tags === 'string' ? parseTags(data.tags) : (data.tags || []),
      favorite: Boolean(data.favorite),
      colorLabel: data.colorLabel || '#6366f1',
    },
  };
}

/**
 * Validate imported JSON data
 * @param {*} data
 * @returns {{ valid: boolean, errors: string[], tasks: Array }}
 */
export function validateImportData(data) {
  const errors = [];

  if (!data) {
    return { valid: false, errors: ['Invalid or empty file'], tasks: [] };
  }

  let tasks = [];

  if (Array.isArray(data)) {
    tasks = data;
  } else if (data.tasks && Array.isArray(data.tasks)) {
    tasks = data.tasks;
  } else {
    return { valid: false, errors: ['File must contain a tasks array'], tasks: [] };
  }

  const validTasks = [];
  tasks.forEach((task, index) => {
    if (!task.title || typeof task.title !== 'string') {
      errors.push(`Task ${index + 1}: missing or invalid title`);
      return;
    }
    validTasks.push({
      id: task.id || `${Date.now()}-${index}`,
      title: trimString(task.title),
      description: trimString(task.description || ''),
      category: CATEGORIES.includes(task.category) ? task.category : 'General',
      priority: PRIORITIES.includes(task.priority) ? task.priority : 'medium',
      status: STATUSES.includes(task.status) ? task.status : 'todo',
      dueDate: task.dueDate || '',
      estimatedTime: parseInt(task.estimatedTime, 10) || 30,
      tags: Array.isArray(task.tags) ? task.tags : parseTags(task.tags || ''),
      favorite: Boolean(task.favorite),
      colorLabel: task.colorLabel || '#6366f1',
      createdAt: task.createdAt || new Date().toISOString(),
      updatedAt: task.updatedAt || new Date().toISOString(),
      order: task.order ?? index,
    });
  });

  if (validTasks.length === 0 && tasks.length > 0) {
    return { valid: false, errors: ['No valid tasks found in file'], tasks: [] };
  }

  return { valid: true, errors, tasks: validTasks };
}

/** Export category/priority/status lists for forms */
export const FORM_OPTIONS = { CATEGORIES, PRIORITIES, STATUSES };
