// ==========================================================================
// File    : presence.ts
// Project : MarkWrite
// Layer   : Infrastructure / Extensions
// Purpose : User presence tracking for cursor positions and selections.
//
// Author  : AuraEG Team
// Created : 2026-03-27
// ==========================================================================

import type { onAwarenessUpdatePayload } from '@hocuspocus/server';
import type { AuthContext } from './auth.js';

// --------------------------------------------------------------------------
// [SECTION] Types
// --------------------------------------------------------------------------

export interface UserPresence {
  id: string;
  username: string;
  avatarUrl?: string;
  color: string;
  cursor?: {
    anchor: number;
    head: number;
  };
  selection?: {
    anchor: number;
    head: number;
  };
}

// --------------------------------------------------------------------------
// [SECTION] Color Generation
// --------------------------------------------------------------------------

// [*] Predefined colors for user cursors (accessible color palette)
const CURSOR_COLORS = [
  '#F97316', // Orange
  '#8B5CF6', // Violet
  '#10B981', // Emerald
  '#EC4899', // Pink
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#14B8A6', // Teal
  '#F59E0B', // Amber
  '#6366F1', // Indigo
  '#84CC16', // Lime
];

// [*] Track assigned colors to avoid duplicates when possible
const assignedColors = new Map<string, string>();
let colorIndex = 0;

/**
 * Gets a consistent color for a user.
 */
export function getUserColor(userId: string): string {
  if (assignedColors.has(userId)) {
    return assignedColors.get(userId)!;
  }

  const color = CURSOR_COLORS[colorIndex % CURSOR_COLORS.length];
  colorIndex++;
  assignedColors.set(userId, color);

  return color;
}

// --------------------------------------------------------------------------
// [SECTION] Presence Hooks
// --------------------------------------------------------------------------

/**
 * Hocuspocus onAwarenessUpdate hook.
 * Processes presence updates from clients.
 */
export async function onAwarenessUpdate({
  documentName,
  awareness,
  context: _context,
}: onAwarenessUpdatePayload): Promise<void> {
  const states = awareness.getStates();

  // [*] Log presence updates in development
  if (process.env.NODE_ENV !== 'production') {
    const users = Array.from(states.values())
      .filter((state) => state.user)
      .map((state) => state.user.username);

    if (users.length > 0) {
      console.log(`[*] Presence for ${documentName}: ${users.join(', ')}`);
    }
  }
}

/**
 * Creates the initial awareness state for a user.
 */
export function createUserAwareness(authContext: AuthContext): UserPresence {
  return {
    id: authContext.user.id,
    username: authContext.user.username,
    avatarUrl: authContext.user.avatarUrl,
    color: getUserColor(authContext.user.id),
  };
}
