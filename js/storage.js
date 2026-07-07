/**
 * Local Storage abstraction layer.
 * Centralizes all persistence with error handling and namespacing.
 */

const PREFIX = 'td_';

/** Storage keys used throughout the application */
export const STORAGE_KEYS = {
  USERS: `${PREFIX}users`,
  SESSION: `${PREFIX}session`,
  TASKS: `${PREFIX}tasks`,
  THEME: `${PREFIX}theme`,
  SIDEBAR: `${PREFIX}sidebar`,
  FILTERS: `${PREFIX}filters`,
  SORT: `${PREFIX}sort`,
  CARD_ORDER: `${PREFIX}card_order`,
  KANBAN_ORDER: `${PREFIX}kanban_order`,
  SETTINGS: `${PREFIX}settings`,
  RECENT_SEARCHES: `${PREFIX}recent_searches`,
  VIEW: `${PREFIX}view`,
  PAGE: `${PREFIX}page`,
  UNDO_STACK: `${PREFIX}undo_stack`,
  REDO_STACK: `${PREFIX}redo_stack`,
  NOTIFICATIONS: `${PREFIX}notifications`,
};

/**
 * Safely get item from localStorage
 * @param {string} key
 * @param {*} defaultValue
 * @returns {*}
 */
export function getItem(key, defaultValue = null) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return defaultValue;
    return JSON.parse(raw);
  } catch (error) {
    console.error(`Storage read error [${key}]:`, error);
    return defaultValue;
  }
}

/**
 * Safely set item in localStorage
 * @param {string} key
 * @param {*} value
 * @returns {boolean}
 */
export function setItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Storage write error [${key}]:`, error);
    return false;
  }
}

/**
 * Remove item from localStorage
 * @param {string} key
 */
export function removeItem(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Storage remove error [${key}]:`, error);
  }
}

/**
 * Clear all app-related storage (used for full reset)
 */
export function clearAppStorage() {
  Object.values(STORAGE_KEYS).forEach((key) => removeItem(key));
}

/** Default application settings */
export function getDefaultSettings() {
  return {
    userName: 'Admin User',
    profileImage: 'assets/avatar.png',
    itemsPerPage: 9,
    defaultView: 'grid',
    enableAnimations: true,
    enableSounds: false,
  };
}

/** Default filter state */
export function getDefaultFilters() {
  return {
    status: 'all',
    search: '',
  };
}

/** Default sort state */
export function getDefaultSort() {
  return {
    field: 'newest',
    direction: 'desc',
  };
}

/** Get settings with defaults */
export function getSettings() {
  return { ...getDefaultSettings(), ...getItem(STORAGE_KEYS.SETTINGS, {}) };
}

/** Save settings */
export function saveSettings(settings) {
  return setItem(STORAGE_KEYS.SETTINGS, settings);
}

/** Get filters */
export function getFilters() {
  return { ...getDefaultFilters(), ...getItem(STORAGE_KEYS.FILTERS, {}) };
}

/** Save filters */
export function saveFilters(filters) {
  return setItem(STORAGE_KEYS.FILTERS, filters);
}

/** Get sort preferences */
export function getSort() {
  return { ...getDefaultSort(), ...getItem(STORAGE_KEYS.SORT, {}) };
}

/** Save sort preferences */
export function saveSort(sort) {
  return setItem(STORAGE_KEYS.SORT, sort);
}
