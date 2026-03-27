// ==========================================================================
// File    : config.test.ts
// Project : MarkWrite Sync Server
// Purpose : Unit tests for configuration module.
//
// Author  : AuraEG Team
// Created : 2026-03-27
// ==========================================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// --------------------------------------------------------------------------
// [SECTION] Config Tests
// --------------------------------------------------------------------------

describe('Config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should use default values when env vars are not set', async () => {
    process.env.DATABASE_URL = 'postgresql://test';
    const { config } = await import('../config.js');

    expect(config.port).toBe(1234);
    expect(config.host).toBe('0.0.0.0');
    expect(config.maxConnectionsPerIp).toBe(10);
    expect(config.maxConnectionsPerDocument).toBe(50);
    expect(config.debounceMs).toBe(2000);
  });

  it('should parse environment variables correctly', async () => {
    process.env.DATABASE_URL = 'postgresql://custom';
    process.env.PORT = '3000';
    process.env.CORS_ORIGINS = 'http://localhost:3000,http://localhost:5000';
    process.env.MAX_CONNECTIONS_PER_IP = '20';

    const { config } = await import('../config.js');

    expect(config.port).toBe(3000);
    expect(config.corsOrigins).toEqual(['http://localhost:3000', 'http://localhost:5000']);
    expect(config.maxConnectionsPerIp).toBe(20);
  });

  it('should detect development environment', async () => {
    process.env.DATABASE_URL = 'postgresql://test';
    process.env.NODE_ENV = 'development';

    const { config } = await import('../config.js');
    expect(config.isDev).toBe(true);
  });

  it('should detect production environment', async () => {
    process.env.DATABASE_URL = 'postgresql://test';
    process.env.NODE_ENV = 'production';

    const { config } = await import('../config.js');
    expect(config.isDev).toBe(false);
  });
});
