/**
 * Task business logic module.
 * CRUD operations, filtering, sorting, and statistics — no DOM access.
 */

import { getItem, setItem, STORAGE_KEYS } from './storage.js';
import {
  generateId,
  trimString,
  deepClone,
  priorityWeight,
  isToday,
  isOverdue,
  calcCompletionPercentage,
  getWeekDays,
} from './utils.js';

/** Get all tasks from storage */
export function getAllTasks() {
  return getItem(STORAGE_KEYS.TASKS, []);
}

/** Save tasks to storage */
export function saveTasks(tasks) {
  return setItem(STORAGE_KEYS.TASKS, tasks);
}

/** Get task by ID */
export function getTaskById(id) {
  return getAllTasks().find((t) => t.id === id) || null;
}

/** Create a new task */
export function createTask(taskData) {
  const tasks = getAllTasks();
  const task = {
    id: generateId(),
    ...taskData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    order: tasks.length,
  };
  tasks.push(task);
  saveTasks(tasks);
  pushUndo('create', null, deepClone(task));
  return task;
}

/** Update existing task */
export function updateTask(id, updates) {
  const tasks = getAllTasks();
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) return null;

  const previous = deepClone(tasks[index]);
  tasks[index] = {
    ...tasks[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveTasks(tasks);
  pushUndo('update', previous, deepClone(tasks[index]));
  return tasks[index];
}

/** Delete task by ID */
export function deleteTask(id) {
  const tasks = getAllTasks();
  const task = tasks.find((t) => t.id === id);
  if (!task) return false;

  const filtered = tasks.filter((t) => t.id !== id);
  saveTasks(filtered);
  pushUndo('delete', deepClone(task), null);
  return true;
}

/** Duplicate a task */
export function duplicateTask(id) {
  const original = getTaskById(id);
  if (!original) return null;

  const copy = {
    ...deepClone(original),
    id: generateId(),
    title: `${original.title} (Copy)`,
    status: 'todo',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    order: getAllTasks().length,
  };

  const tasks = getAllTasks();
  tasks.push(copy);
  saveTasks(tasks);
  return copy;
}

/** Toggle favorite status */
export function toggleFavorite(id) {
  const task = getTaskById(id);
  if (!task) return null;
  return updateTask(id, { favorite: !task.favorite });
}

/** Update task status (for kanban drag) */
export function updateTaskStatus(id, status) {
  return updateTask(id, { status });
}

/** Update task order */
export function updateTaskOrder(orderedIds) {
  const tasks = getAllTasks();
  const taskMap = new Map(tasks.map((t) => [t.id, t]));

  orderedIds.forEach((id, index) => {
    if (taskMap.has(id)) {
      taskMap.get(id).order = index;
    }
  });

  const updated = Array.from(taskMap.values());
  saveTasks(updated);
  setItem(STORAGE_KEYS.CARD_ORDER, orderedIds);
  return updated;
}

/** Save kanban column order */
export function saveKanbanOrder(columnOrders) {
  setItem(STORAGE_KEYS.KANBAN_ORDER, columnOrders);
}

/** Get kanban column order */
export function getKanbanOrder() {
  return getItem(STORAGE_KEYS.KANBAN_ORDER, { todo: [], 'in-progress': [], completed: [] });
}

/** Reset all tasks */
export function resetTasks() {
  saveTasks([]);
  setItem(STORAGE_KEYS.CARD_ORDER, []);
  setItem(STORAGE_KEYS.KANBAN_ORDER, { todo: [], 'in-progress': [], completed: [] });
}

/** Merge imported tasks avoiding duplicates */
export function mergeTasks(importedTasks) {
  const existing = getAllTasks();
  const existingKeys = new Set(
    existing.map((t) => `${trimString(t.title).toLowerCase()}|${t.dueDate}`)
  );

  const newTasks = importedTasks.filter((t) => {
    const key = `${trimString(t.title).toLowerCase()}|${t.dueDate}`;
    return !existingKeys.has(key);
  });

  const merged = [
    ...existing,
    ...newTasks.map((t, i) => ({
      ...t,
      id: t.id || generateId(),
      order: existing.length + i,
      createdAt: t.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })),
  ];

  saveTasks(merged);
  return { merged, imported: newTasks.length, skipped: importedTasks.length - newTasks.length };
}

/** Transform API todo to app task format */
export function transformApiTodo(todo, index) {
  const priorities = ['low', 'medium', 'high'];
  const categories = ['General', 'Work', 'Personal', 'Education'];
  return {
    id: `api-${todo.id}-${Date.now()}`,
    title: todo.todo || `Imported Task ${index + 1}`,
    description: `Imported from DummyJSON API (User ${todo.userId})`,
    category: categories[index % categories.length],
    priority: priorities[todo.id % 3],
    status: todo.completed ? 'completed' : 'todo',
    dueDate: '',
    estimatedTime: 30 + (todo.id % 5) * 15,
    tags: ['imported', 'api'],
    favorite: false,
    colorLabel: ['#6366f1', '#8b5cf6', '#ec4899', '#14b8a6'][index % 4],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    order: index,
  };
}

/**
 * Filter tasks based on filter criteria
 */
export function filterTasks(tasks, filters) {
  let result = [...tasks];
  const search = trimString(filters.search || '').toLowerCase();

  if (search) {
    result = result.filter((t) => {
      const haystack = [
        t.title,
        t.description,
        t.category,
        ...(t.tags || []),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(search);
    });
  }

  switch (filters.status) {
    case 'completed':
      result = result.filter((t) => t.status === 'completed');
      break;
    case 'pending':
      result = result.filter((t) => t.status === 'todo');
      break;
    case 'in-progress':
      result = result.filter((t) => t.status === 'in-progress');
      break;
    case 'favorites':
      result = result.filter((t) => t.favorite);
      break;
    case 'high':
    case 'medium':
    case 'low':
      result = result.filter((t) => t.priority === filters.status);
      break;
    case 'today':
      result = result.filter((t) => isToday(t.dueDate));
      break;
    case 'overdue':
      result = result.filter((t) => isOverdue(t));
      break;
    default:
      break;
  }

  return result;
}

/**
 * Sort tasks
 */
export function sortTasks(tasks, sortConfig) {
  const sorted = [...tasks];
  const { field } = sortConfig;

  switch (field) {
    case 'oldest':
      sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      break;
    case 'newest':
      sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      break;
    case 'priority':
      sorted.sort((a, b) => priorityWeight(b.priority) - priorityWeight(a.priority));
      break;
    case 'alphabetical':
      sorted.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case 'dueDate':
      sorted.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      });
      break;
    case 'order':
      sorted.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      break;
    default:
      break;
  }

  return sorted;
}

/** Paginate tasks */
export function paginateTasks(tasks, page = 1, perPage = 9) {
  const total = tasks.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * perPage;
  const items = tasks.slice(start, start + perPage);

  return { items, currentPage, totalPages, total, perPage };
}

/** Calculate task statistics */
export function getTaskStatistics(tasks) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'completed').length;
  const inProgress = tasks.filter((t) => t.status === 'in-progress').length;
  const pending = tasks.filter((t) => t.status === 'todo').length;
  const overdue = tasks.filter((t) => isOverdue(t)).length;
  const favorites = tasks.filter((t) => t.favorite).length;

  const byPriority = {
    high: tasks.filter((t) => t.priority === 'high').length,
    medium: tasks.filter((t) => t.priority === 'medium').length,
    low: tasks.filter((t) => t.priority === 'low').length,
  };

  const byCategory = {};
  tasks.forEach((t) => {
    byCategory[t.category] = (byCategory[t.category] || 0) + 1;
  });

  const weekDays = getWeekDays();
  const weeklyActivity = weekDays.map((day) => {
    return tasks.filter((t) => t.updatedAt && t.updatedAt.startsWith(day)).length;
  });

  return {
    total,
    completed,
    pending,
    inProgress,
    overdue,
    favorites,
    completionPercentage: calcCompletionPercentage(tasks),
    byPriority,
    byCategory,
    byStatus: { completed, pending, inProgress },
    weeklyActivity,
    weekLabels: weekDays.map((d) => {
      const date = new Date(d);
      return date.toLocaleDateString(undefined, { weekday: 'short' });
    }),
  };
}

/** Get recent activity (last 10 updated tasks) */
export function getRecentActivity(tasks, limit = 10) {
  return [...tasks]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, limit);
}

/** Get upcoming deadlines */
export function getUpcomingDeadlines(tasks, limit = 5) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  return tasks
    .filter((t) => t.dueDate && t.status !== 'completed')
    .filter((t) => {
      const d = new Date(t.dueDate);
      d.setHours(0, 0, 0, 0);
      return d >= now;
    })
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, limit);
}

/** Undo/Redo stack management */
function pushUndo(action, before, after) {
  const stack = getItem(STORAGE_KEYS.UNDO_STACK, []);
  stack.push({ action, before, after, timestamp: Date.now() });
  if (stack.length > 20) stack.shift();
  setItem(STORAGE_KEYS.UNDO_STACK, stack);
  setItem(STORAGE_KEYS.REDO_STACK, []);
}

/** Undo last action */
export function undoLastAction() {
  const stack = getItem(STORAGE_KEYS.UNDO_STACK, []);
  if (!stack.length) return null;

  const entry = stack.pop();
  setItem(STORAGE_KEYS.UNDO_STACK, stack);

  const tasks = getAllTasks();
  const redoStack = getItem(STORAGE_KEYS.REDO_STACK, []);

  switch (entry.action) {
    case 'create':
      saveTasks(tasks.filter((t) => t.id !== entry.after.id));
      redoStack.push(entry);
      break;
    case 'delete':
      tasks.push(entry.before);
      saveTasks(tasks);
      redoStack.push(entry);
      break;
    case 'update': {
      const idx = tasks.findIndex((t) => t.id === entry.before.id);
      if (idx !== -1) {
        tasks[idx] = entry.before;
        saveTasks(tasks);
      }
      redoStack.push(entry);
      break;
    }
    default:
      break;
  }

  setItem(STORAGE_KEYS.REDO_STACK, redoStack);
  return entry;
}

/** Redo last undone action */
export function redoLastAction() {
  const redoStack = getItem(STORAGE_KEYS.REDO_STACK, []);
  if (!redoStack.length) return null;

  const entry = redoStack.pop();
  setItem(STORAGE_KEYS.REDO_STACK, redoStack);

  const tasks = getAllTasks();
  const undoStack = getItem(STORAGE_KEYS.UNDO_STACK, []);

  switch (entry.action) {
    case 'create':
      tasks.push(entry.after);
      saveTasks(tasks);
      undoStack.push(entry);
      break;
    case 'delete':
      saveTasks(tasks.filter((t) => t.id !== entry.before.id));
      undoStack.push(entry);
      break;
    case 'update': {
      const idx = tasks.findIndex((t) => t.id === entry.after.id);
      if (idx !== -1) {
        tasks[idx] = entry.after;
        saveTasks(tasks);
      }
      undoStack.push(entry);
      break;
    }
    default:
      break;
  }

  setItem(STORAGE_KEYS.UNDO_STACK, undoStack);
  return entry;
}

/** Export tasks as JSON object */
export function exportTasks() {
  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    tasks: getAllTasks(),
  };
}
