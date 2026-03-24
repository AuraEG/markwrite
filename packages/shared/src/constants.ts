// ==========================================================================
// File    : constants.ts
// Project : MarkWrite
// Layer   : Shared
// Purpose : Shared constants across packages.
//
// Author  : AuraEG Team
// Created : 2026-03-24
// ==========================================================================

// --------------------------------------------------------------------------
// [SECTION] Document Limits
// --------------------------------------------------------------------------

export const MAX_DOCUMENT_TITLE_LENGTH = 255;
export const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

// --------------------------------------------------------------------------
// [SECTION] Collaboration
// --------------------------------------------------------------------------

export const COLLABORATION_COLORS = [
  '#958DF1', // Purple
  '#F98181', // Red
  '#FBBC88', // Orange
  '#FAF594', // Yellow
  '#70CFF8', // Blue
  '#94FADB', // Teal
  '#B9F18D', // Green
  '#E8A0BF', // Pink
] as const;

// Get a consistent color for a user based on their ID
export function getUserColor(userId: string): string {
  const hash = userId.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  return COLLABORATION_COLORS[Math.abs(hash) % COLLABORATION_COLORS.length];
}

// --------------------------------------------------------------------------
// [SECTION] WebSocket
// --------------------------------------------------------------------------

export const WS_RECONNECT_DELAY_MS = 2000;
export const WS_MAX_RECONNECT_ATTEMPTS = 10;

// --------------------------------------------------------------------------
// [SECTION] Version History
// --------------------------------------------------------------------------

export const VERSION_SNAPSHOT_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
export const MAX_VERSIONS_PER_DOCUMENT = 50;
