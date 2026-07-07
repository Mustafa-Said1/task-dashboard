/**
 * Fetch API module.
 * Handles external data fetching with error handling.
 */

import { transformApiTodo } from './tasks.js';

const API_URL = 'https://dummyjson.com/todos?limit=20';

/**
 * Fetch demo tasks from DummyJSON API
 * @returns {Promise<{ success: boolean, tasks: Array, error?: string }>}
 */
export async function fetchDemoTasks() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(API_URL, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.todos || !Array.isArray(data.todos)) {
      throw new Error('Invalid API response format');
    }

    const tasks = data.todos.map((todo, index) => transformApiTodo(todo, index));

    return { success: true, tasks, total: data.total };
  } catch (error) {
    console.error('Fetch error:', error);

    if (error.name === 'AbortError') {
      return { success: false, tasks: [], error: 'Request timed out. Please try again.' };
    }

    if (!navigator.onLine) {
      return { success: false, tasks: [], error: 'No internet connection.' };
    }

    return {
      success: false,
      tasks: [],
      error: error.message || 'Failed to fetch tasks',
    };
  }
}

/**
 * Check online status
 */
export function isOnline() {
  return navigator.onLine;
}

/**
 * Listen for online/offline events
 */
export function watchConnectivity(callback) {
  window.addEventListener('online', () => callback(true));
  window.addEventListener('offline', () => callback(false));
}
