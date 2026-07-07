/**
 * Authentication module — simulated front-end auth via Local Storage.
 * Business logic only; no DOM manipulation.
 */

import { getItem, setItem, removeItem, STORAGE_KEYS } from './storage.js';
import { isValidEmail, trimString } from './utils.js';

/** Demo account credentials */
export const DEMO_ACCOUNT = {
  email: 'admin@example.com',
  password: 'Admin@123',
  name: 'Admin User',
};

/**
 * Initialize demo account on first launch
 */
export function initializeDemoAccount() {
  const users = getUsers();
  const exists = users.some((u) => u.email === DEMO_ACCOUNT.email);
  if (!exists) {
    users.push({
      id: 'demo-admin',
      email: DEMO_ACCOUNT.email,
      password: DEMO_ACCOUNT.password,
      name: DEMO_ACCOUNT.name,
      createdAt: new Date().toISOString(),
    });
    setItem(STORAGE_KEYS.USERS, users);
  }
}

/**
 * Get all registered users
 * @returns {Array}
 */
export function getUsers() {
  return getItem(STORAGE_KEYS.USERS, []);
}

/**
 * Validate login credentials format
 * @param {string} email
 * @param {string} password
 * @returns {{ valid: boolean, errors: Object }}
 */
export function validateLoginCredentials(email, password) {
  const errors = {};
  const trimmedEmail = trimString(email);
  const trimmedPassword = trimString(password);

  if (!trimmedEmail) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(trimmedEmail)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!trimmedPassword) {
    errors.password = 'Password is required';
  } else if (trimmedPassword.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    email: trimmedEmail,
    password: trimmedPassword,
  };
}

/**
 * Attempt login with email and password
 * @param {string} email
 * @param {string} password
 * @returns {{ success: boolean, message: string, user?: Object }}
 */
export function login(email, password) {
  const validation = validateLoginCredentials(email, password);
  if (!validation.valid) {
    return { success: false, message: 'Please fix validation errors', errors: validation.errors };
  }

  const users = getUsers();
  const user = users.find(
    (u) => u.email === validation.email && u.password === validation.password
  );

  if (!user) {
    return { success: false, message: 'Invalid email or password' };
  }

  return {
    success: true,
    message: 'Login successful',
    user: { id: user.id, email: user.email, name: user.name },
  };
}

/**
 * Create and save session
 * @param {Object} user
 * @param {boolean} rememberMe
 */
export function createSession(user, rememberMe = false) {
  const session = {
    userId: user.id,
    email: user.email,
    name: user.name,
    rememberMe,
    loginAt: new Date().toISOString(),
    expiresAt: rememberMe
      ? null
      : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
  setItem(STORAGE_KEYS.SESSION, session);
  return session;
}

/**
 * Get current session
 * @returns {Object|null}
 */
export function getSession() {
  const session = getItem(STORAGE_KEYS.SESSION, null);
  if (!session) return null;

  if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
    removeItem(STORAGE_KEYS.SESSION);
    return null;
  }

  return session;
}

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
export function isAuthenticated() {
  return getSession() !== null;
}

/**
 * Logout — removes session only, preserves tasks and settings
 */
export function logout() {
  removeItem(STORAGE_KEYS.SESSION);
}

/**
 * Get current user from session
 * @returns {Object|null}
 */
export function getCurrentUser() {
  const session = getSession();
  if (!session) return null;
  return {
    id: session.userId,
    email: session.email,
    name: session.name,
  };
}
