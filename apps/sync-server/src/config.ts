// ==========================================================================
// File    : config.ts
// Project : MarkWrite
// Layer   : Configuration
// Purpose : Centralized configuration for the sync server.
//
// Author  : AuraEG Team
// Created : 2026-03-27
// ==========================================================================

// --------------------------------------------------------------------------
// [SECTION] Environment Variables
// --------------------------------------------------------------------------

export const config = {
  // [*] Server configuration
  port: parseInt(process.env.PORT || '1234', 10),
  host: process.env.HOST || '0.0.0.0',

  // [*] Database connection
  databaseUrl: process.env.DATABASE_URL || '',

  // [*] CORS configuration
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173').split(','),

  // [*] Authentication
  webAppUrl: process.env.WEB_APP_URL || 'http://localhost:5173',
  sessionSecret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',

  // [*] Rate limiting
  maxConnectionsPerIp: parseInt(process.env.MAX_CONNECTIONS_PER_IP || '10', 10),
  maxConnectionsPerDocument: parseInt(process.env.MAX_CONNECTIONS_PER_DOCUMENT || '50', 10),

  // [*] Persistence
  debounceMs: parseInt(process.env.DEBOUNCE_MS || '2000', 10),
  maxDebounceMs: parseInt(process.env.MAX_DEBOUNCE_MS || '10000', 10),

  // [*] Environment
  isDev: process.env.NODE_ENV !== 'production',
} as const;

// --------------------------------------------------------------------------
// [SECTION] Validation
// --------------------------------------------------------------------------

export function validateConfig(): void {
  const errors: string[] = [];

  if (!config.databaseUrl) {
    errors.push('DATABASE_URL is required');
  }

  if (errors.length > 0) {
    console.error('[!] Configuration errors:');
    errors.forEach((error) => console.error(`    - ${error}`));
    process.exit(1);
  }
}
