// ==========================================================================
// File    : settings.svelte.ts
// Project : MarkWrite
// Layer   : State
// Purpose : User settings store with persistence via API.
//
// Author  : AuraEG Team
// Created : 2026-04-02
// ==========================================================================

import { browser } from '$app/environment';

// --------------------------------------------------------------------------
// [SECTION] Types
// --------------------------------------------------------------------------

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  fontSize: number;
  fontFamily: string;
  tabSize: number;
  lineWrapping: boolean;
  autoSaveInterval: number;
  spellCheck: boolean;
  showLineNumbers: boolean;
}

// --------------------------------------------------------------------------
// [SECTION] Default Settings
// --------------------------------------------------------------------------

const defaultSettings: UserSettings = {
  theme: 'system',
  fontSize: 14,
  fontFamily: 'mono',
  tabSize: 2,
  lineWrapping: true,
  autoSaveInterval: 30,
  spellCheck: false,
  showLineNumbers: true,
};

// --------------------------------------------------------------------------
// [SECTION] State
// --------------------------------------------------------------------------

let settings = $state<UserSettings>({ ...defaultSettings });
let loaded = $state(false);

// --------------------------------------------------------------------------
// [SECTION] Store Functions
// --------------------------------------------------------------------------

async function loadSettings(): Promise<void> {
  if (!browser) return;

  try {
    const response = await fetch('/api/user/settings');
    if (response.ok) {
      const data = await response.json();
      settings = { ...defaultSettings, ...data.settings };
      loaded = true;
    }
  } catch (error) {
    console.warn('[SettingsStore] Failed to load settings:', error);
  }
}

async function saveSettings(updates: Partial<UserSettings>): Promise<boolean> {
  if (!browser) return false;

  try {
    const response = await fetch('/api/user/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (response.ok) {
      const data = await response.json();
      settings = { ...settings, ...data.settings };
      return true;
    } else {
      // [*] Log error details
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      console.error('[SettingsStore] Save failed:', response.status, errorData);
    }
  } catch (error) {
    console.error('[SettingsStore] Failed to save settings:', error);
  }
  return false;
}

function updateLocal(updates: Partial<UserSettings>): void {
  settings = { ...settings, ...updates };
}

function reset(): void {
  settings = { ...defaultSettings };
  loaded = false;
}

// --------------------------------------------------------------------------
// [SECTION] Export Store
// --------------------------------------------------------------------------

export const settingsStore = {
  get settings() {
    return settings;
  },
  get loaded() {
    return loaded;
  },
  loadSettings,
  saveSettings,
  updateLocal,
  reset,
};
