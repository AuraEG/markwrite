// ==========================================================================
// File    : color-hash.ts
// Project : MarkWrite
// Layer   : Utilities
// Purpose : Generate deterministic colors from user IDs for presence.
//
// Author  : AuraEG Team
// Created : 2026-03-27
// ==========================================================================

/**
 * Predefined color palette for collaborator presence.
 * Uses vibrant, accessible colors for cursors and selections.
 */
export const PRESENCE_COLORS = [
  { cursor: '#0284c7', selection: '#0284c720' }, // Sky Blue
  { cursor: '#dc2626', selection: '#dc262620' }, // Red
  { cursor: '#16a34a', selection: '#16a34a20' }, // Green
  { cursor: '#9333ea', selection: '#9333ea20' }, // Purple
  { cursor: '#ea580c', selection: '#ea580c20' }, // Orange
  { cursor: '#0891b2', selection: '#0891b220' }, // Cyan
  { cursor: '#ca8a04', selection: '#ca8a0420' }, // Yellow
  { cursor: '#e11d48', selection: '#e11d4820' }, // Rose
  { cursor: '#7c3aed', selection: '#7c3aed20' }, // Violet
  { cursor: '#059669', selection: '#05966920' }, // Emerald
] as const;

// --------------------------------------------------------------------------
// [SECTION] Hash Function
// --------------------------------------------------------------------------

/**
 * Simple hash function for strings.
 * Converts a string to a numeric hash value.
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// --------------------------------------------------------------------------
// [SECTION] Color Generation
// --------------------------------------------------------------------------

/**
 * Generate a deterministic color for a user based on their ID.
 * Returns cursor and selection colors.
 *
 * @param userId - Unique identifier for the user
 * @returns Object with cursor and selection color strings
 */
export function getUserColor(userId: string): { cursor: string; selection: string } {
  const hash = simpleHash(userId);
  const index = hash % PRESENCE_COLORS.length;
  return PRESENCE_COLORS[index];
}

/**
 * Generate a deterministic color index for a user.
 * Useful when you need the index for other purposes.
 *
 * @param userId - Unique identifier for the user
 * @returns Color index (0-9)
 */
export function getUserColorIndex(userId: string): number {
  const hash = simpleHash(userId);
  return hash % PRESENCE_COLORS.length;
}
