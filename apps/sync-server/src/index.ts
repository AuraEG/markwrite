// ==========================================================================
// File    : index.ts
// Project : MarkWrite
// Layer   : Infrastructure
// Purpose : Hocuspocus WebSocket server for Yjs document synchronization.
//
// Author  : AuraEG Team
// Created : 2026-03-24
// Updated : 2026-03-27
// ==========================================================================

// [*] Load environment variables from .env file
import 'dotenv/config';

import { Hocuspocus } from '@hocuspocus/server';
import { Database } from '@hocuspocus/extension-database';
import postgres from 'postgres';
import { config, validateConfig } from './config.js';
import {
  onAuthenticate,
  onConnect,
  onAwarenessUpdate,
  createPersistenceConfig,
  createDebounceConfig,
  checkRateLimit,
  registerConnection,
  unregisterConnection,
  getConnectionStats,
  type AuthContext,
} from './extensions/index.js';

// --------------------------------------------------------------------------
// [SECTION] Initialization
// --------------------------------------------------------------------------

// [*] Validate configuration before starting
validateConfig();

// [*] Create database connection pool
const sql = postgres(config.databaseUrl, {
  max: 10,
  idle_timeout: 30,
  connect_timeout: 10,
});

// --------------------------------------------------------------------------
// [SECTION] Hocuspocus Server
// --------------------------------------------------------------------------

const server = new Hocuspocus({
  port: config.port,
  name: 'markwrite-sync',

  // [*] Enable quiet mode in production
  quiet: !config.isDev,

  // --------------------------------------------------------------------------
  // [HOOK] Authentication
  // --------------------------------------------------------------------------
  onAuthenticate,

  // --------------------------------------------------------------------------
  // [HOOK] Connection Management
  // --------------------------------------------------------------------------
  onConnect: async (payload) => {
    const { documentName, connection, request } = payload;

    // [1] Extract IP address
    const ip =
      (request?.headers?.['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      request?.socket?.remoteAddress ||
      'unknown';

    // [2] Generate connection ID
    const connectionId = `${ip}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    // [3] Check rate limits
    try {
      checkRateLimit(ip, documentName, connectionId);
    } catch (error) {
      console.warn(`[!] Connection rejected: ${(error as Error).message}`);
      throw error;
    }

    // [4] Register connection
    registerConnection(ip, documentName, connectionId);

    // [5] Store connection info for later cleanup
    (connection as unknown as Record<string, string>)._connectionId = connectionId;
    (connection as unknown as Record<string, string>)._ip = ip;

    // [6] Call the auth-based onConnect
    await onConnect(payload);
  },

  onDisconnect: async (data) => {
    try {
      // [*] Extract connection and documentName from payload
      const connection = (data as { connection?: Record<string, unknown>; documentName: string })
        .connection;
      const documentName = data.documentName;
      const connectionId = connection?._connectionId as string | undefined;
      const ip = connection?._ip as string | undefined;

      if (connectionId && ip) {
        unregisterConnection(ip, documentName, connectionId);
      }

      const context = connection?.context as AuthContext | undefined;
      const username = context?.user?.username || 'Unknown';
      console.log(`[-] ${username} disconnected from ${documentName}`);
    } catch (error) {
      console.warn(`[!] Error in onDisconnect:`, error);
    }
  },

  // --------------------------------------------------------------------------
  // [HOOK] Presence (Awareness)
  // --------------------------------------------------------------------------
  onAwarenessUpdate,

  // --------------------------------------------------------------------------
  // [HOOK] Document Lifecycle
  // --------------------------------------------------------------------------
  onLoadDocument: async ({ documentName }) => {
    console.log(`[*] Loading document: ${documentName}`);
  },

  onStoreDocument: async ({ documentName }) => {
    console.log(`[*] Storing document: ${documentName}`);
  },

  // --------------------------------------------------------------------------
  // [EXTENSIONS] Persistence
  // --------------------------------------------------------------------------
  extensions: [
    new Database({
      ...createPersistenceConfig(sql),
      ...createDebounceConfig(),
    }),
  ],
});

// --------------------------------------------------------------------------
// [SECTION] Server Startup
// --------------------------------------------------------------------------

server.listen().then(() => {
  console.log('===================================================================');
  console.log(' MarkWrite Sync Server');
  console.log('===================================================================');
  console.log(`[*] Environment: ${config.isDev ? 'development' : 'production'}`);
  console.log(`[*] Listening on port ${config.port}`);
  console.log(`[*] WebSocket URL: ws://localhost:${config.port}`);
  console.log(`[*] CORS origins: ${config.corsOrigins.join(', ')}`);
  console.log('-------------------------------------------------------------------');
});

// --------------------------------------------------------------------------
// [SECTION] Health Check Endpoint
// --------------------------------------------------------------------------

// [*] Hocuspocus exposes HTTP on the same port for health checks
// The endpoint is available at GET /

// --------------------------------------------------------------------------
// [SECTION] Stats Endpoint (Development Only)
// --------------------------------------------------------------------------

if (config.isDev) {
  setInterval(() => {
    const stats = getConnectionStats();
    const totalConnections = Object.values(stats.byIp).reduce((a, b) => a + b, 0);

    if (totalConnections > 0) {
      console.log(`[i] Active connections: ${totalConnections}`);
    }
  }, 30000); // Log every 30 seconds
}

// --------------------------------------------------------------------------
// [SECTION] Graceful Shutdown
// --------------------------------------------------------------------------

async function shutdown(signal: string): Promise<void> {
  console.log(`\n[!] Received ${signal}, shutting down...`);

  try {
    // [1] Stop accepting new connections
    await server.destroy();
    console.log('[ok] Server stopped');

    // [2] Close database connections
    await sql.end();
    console.log('[ok] Database connections closed');

    process.exit(0);
  } catch (error) {
    console.error('[!] Error during shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
