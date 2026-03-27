// ==========================================================================
// File    : presence.test.ts
// Project : MarkWrite Sync Server
// Purpose : Unit tests for the presence extension.
//
// Author  : AuraEG Team
// Created : 2026-03-27
// ==========================================================================

import { describe, it, expect } from 'vitest';
import { getUserColor, createUserAwareness } from '../extensions/presence.js';
import type { AuthContext } from '../extensions/auth.js';

// --------------------------------------------------------------------------
// [SECTION] Presence Tests
// --------------------------------------------------------------------------

describe('Presence Extension', () => {
  describe('getUserColor', () => {
    it('should return a color string', () => {
      const color = getUserColor('user-1');
      expect(color).toMatch(/^#[0-9A-F]{6}$/i);
    });

    it('should return consistent color for same user', () => {
      const color1 = getUserColor('user-consistent');
      const color2 = getUserColor('user-consistent');
      expect(color1).toBe(color2);
    });

    it('should return different colors for different users', () => {
      const colors = new Set<string>();
      for (let i = 0; i < 5; i++) {
        colors.add(getUserColor(`unique-user-${i}-${Date.now()}`));
      }
      // [*] Should have at least 3 unique colors (allowing some collisions)
      expect(colors.size).toBeGreaterThanOrEqual(3);
    });
  });

  describe('createUserAwareness', () => {
    it('should create awareness state from auth context', () => {
      const authContext: AuthContext = {
        user: {
          id: 'user-123',
          username: 'testuser',
          email: 'test@example.com',
          avatarUrl: 'https://example.com/avatar.png',
        },
        documentId: 'doc-456',
        permissions: 'write',
      };

      const awareness = createUserAwareness(authContext);

      expect(awareness.id).toBe('user-123');
      expect(awareness.username).toBe('testuser');
      expect(awareness.avatarUrl).toBe('https://example.com/avatar.png');
      expect(awareness.color).toMatch(/^#[0-9A-F]{6}$/i);
    });

    it('should work without optional fields', () => {
      const authContext: AuthContext = {
        user: {
          id: 'user-minimal',
          username: 'minimal',
        },
        documentId: 'doc-789',
        permissions: 'read',
      };

      const awareness = createUserAwareness(authContext);

      expect(awareness.id).toBe('user-minimal');
      expect(awareness.username).toBe('minimal');
      expect(awareness.avatarUrl).toBeUndefined();
      expect(awareness.color).toBeDefined();
    });
  });
});
