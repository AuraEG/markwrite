// ==========================================================================
// File    : theme.svelte.ts
// Project : MarkWrite
// Layer   : State Management
// Purpose : Theme store for dark/light mode with system preference detection.
//
// Author  : AuraEG Team
// Created : 2026-03-31
// ==========================================================================

import { browser } from '$app/environment';

// --------------------------------------------------------------------------
// [SECTION] Types
// --------------------------------------------------------------------------

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'markwrite-theme';

// --------------------------------------------------------------------------
// [SECTION] Theme State (Module-level for true reactivity)
// --------------------------------------------------------------------------

let themeValue = $state<Theme>('system');
let resolvedThemeValue = $state<ResolvedTheme>('light');

// Get system preference
function getSystemTheme(): ResolvedTheme {
  if (!browser) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// Update resolved theme based on current theme setting
function updateResolvedTheme(): void {
  resolvedThemeValue = themeValue === 'system' ? getSystemTheme() : themeValue;
}

// Apply theme to document
function applyTheme(): void {
  if (!browser) return;

  const root = document.documentElement;
  if (resolvedThemeValue === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

// Handle system theme change
function handleSystemThemeChange(): void {
  if (themeValue === 'system') {
    updateResolvedTheme();
    applyTheme();
  }
}

// Initialize from localStorage or system preference
function initialize(): void {
  if (!browser) return;

  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (stored && ['light', 'dark', 'system'].includes(stored)) {
    themeValue = stored;
  }

  updateResolvedTheme();
  applyTheme();

  // Listen for system theme changes
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', handleSystemThemeChange);
}

// Set theme
function setTheme(newTheme: Theme): void {
  themeValue = newTheme;
  if (browser) {
    localStorage.setItem(STORAGE_KEY, newTheme);
  }
  updateResolvedTheme();
  applyTheme();
}

// Toggle between light and dark (skips system)
function toggle(): void {
  setTheme(resolvedThemeValue === 'light' ? 'dark' : 'light');
}

// --------------------------------------------------------------------------
// [SECTION] Exported Store Object
// --------------------------------------------------------------------------

export const themeStore = {
  get theme() {
    return themeValue;
  },
  get resolvedTheme() {
    return resolvedThemeValue;
  },
  initialize,
  setTheme,
  toggle,
};
