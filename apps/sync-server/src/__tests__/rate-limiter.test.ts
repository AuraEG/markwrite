// ==========================================================================
// File    : rate-limiter.test.ts
// Project : MarkWrite Sync Server
// Purpose : Unit tests for the rate limiter extension.
//
// Author  : AuraEG Team
// Created : 2026-03-27
// ==========================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import {
  checkRateLimit,
  registerConnection,
  unregisterConnection,
  getConnectionStats,
  clearConnectionTracking,
} from '../extensions/rate-limiter.js';

// --------------------------------------------------------------------------
// [SECTION] Test Setup
// --------------------------------------------------------------------------

beforeEach(() => {
  clearConnectionTracking();
});

// --------------------------------------------------------------------------
// [SECTION] Rate Limiter Tests
// --------------------------------------------------------------------------

describe('Rate Limiter', () => {
  describe('checkRateLimit', () => {
    it('should allow connections under the limit', () => {
      // [*] Should not throw for first connection
      expect(() => {
        checkRateLimit('192.168.1.1', 'document:123', 'conn-1');
      }).not.toThrow();
    });

    it('should throw when IP limit is exceeded', () => {
      const ip = '192.168.1.1';

      // [*] Register max connections
      for (let i = 0; i < 10; i++) {
        registerConnection(ip, `document:${i}`, `conn-${i}`);
      }

      // [*] Next connection should be rejected
      expect(() => {
        checkRateLimit(ip, 'document:new', 'conn-new');
      }).toThrow('Too many connections from this IP address');
    });

    it('should throw when document limit is exceeded', () => {
      const documentName = 'document:123';

      // [*] Register max connections from different IPs
      for (let i = 0; i < 50; i++) {
        registerConnection(`192.168.1.${i}`, documentName, `conn-${i}`);
      }

      // [*] Next connection should be rejected
      expect(() => {
        checkRateLimit('192.168.2.1', documentName, 'conn-new');
      }).toThrow('Too many connections to this document');
    });
  });

  describe('registerConnection', () => {
    it('should track connections by IP', () => {
      registerConnection('192.168.1.1', 'document:123', 'conn-1');
      registerConnection('192.168.1.1', 'document:456', 'conn-2');

      const stats = getConnectionStats();
      expect(stats.byIp['192.168.1.1']).toBe(2);
    });

    it('should track connections by document', () => {
      registerConnection('192.168.1.1', 'document:123', 'conn-1');
      registerConnection('192.168.1.2', 'document:123', 'conn-2');

      const stats = getConnectionStats();
      expect(stats.byDocument['document:123']).toBe(2);
    });
  });

  describe('unregisterConnection', () => {
    it('should remove connection from tracking', () => {
      registerConnection('192.168.1.1', 'document:123', 'conn-1');
      unregisterConnection('192.168.1.1', 'document:123', 'conn-1');

      const stats = getConnectionStats();
      expect(stats.byIp['192.168.1.1']).toBeUndefined();
      expect(stats.byDocument['document:123']).toBeUndefined();
    });

    it('should keep other connections when one is removed', () => {
      registerConnection('192.168.1.1', 'document:123', 'conn-1');
      registerConnection('192.168.1.1', 'document:456', 'conn-2');
      unregisterConnection('192.168.1.1', 'document:123', 'conn-1');

      const stats = getConnectionStats();
      expect(stats.byIp['192.168.1.1']).toBe(1);
    });
  });

  describe('getConnectionStats', () => {
    it('should return empty stats when no connections', () => {
      const stats = getConnectionStats();
      expect(stats.byIp).toEqual({});
      expect(stats.byDocument).toEqual({});
    });

    it('should return accurate counts', () => {
      registerConnection('192.168.1.1', 'document:123', 'conn-1');
      registerConnection('192.168.1.2', 'document:123', 'conn-2');
      registerConnection('192.168.1.1', 'document:456', 'conn-3');

      const stats = getConnectionStats();
      expect(stats.byIp['192.168.1.1']).toBe(2);
      expect(stats.byIp['192.168.1.2']).toBe(1);
      expect(stats.byDocument['document:123']).toBe(2);
      expect(stats.byDocument['document:456']).toBe(1);
    });
  });
});
