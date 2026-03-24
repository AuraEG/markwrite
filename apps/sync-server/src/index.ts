// ==========================================================================
// File    : index.ts
// Project : MarkWrite
// Layer   : Infrastructure
// Purpose : Hocuspocus WebSocket server for Yjs document synchronization.
//
// Author  : AuraEG Team
// Created : 2026-03-24
// ==========================================================================

import { Hocuspocus } from '@hocuspocus/server';
import { Database } from '@hocuspocus/extension-database';
import postgres from 'postgres';

// --------------------------------------------------------------------------
// [SECTION] Configuration
// --------------------------------------------------------------------------

const PORT = parseInt(process.env.PORT || '1234', 10);
const DATABASE_URL = process.env.DATABASE_URL || '';

// --------------------------------------------------------------------------
// [SECTION] Database Client
// --------------------------------------------------------------------------

const sql = postgres(DATABASE_URL);

// --------------------------------------------------------------------------
// [SECTION] Hocuspocus Server
// --------------------------------------------------------------------------

const server = new Hocuspocus({
  port: PORT,
  name: 'markwrite-sync',

  // Log connection events for debugging
  onConnect: async ({ documentName, connection }) => {
    console.log(`[+] Client connected to document: ${documentName}`);
    console.log(`[i] Connection ID: ${connection.readOnly ? 'read-only' : 'read-write'}`);
  },

  onDisconnect: async ({ documentName }) => {
    console.log(`[-] Client disconnected from document: ${documentName}`);
  },

  // Extensions
  extensions: [
    new Database({
      // Fetch document state from PostgreSQL
      fetch: async ({ documentName }) => {
        const result = await sql`
          SELECT yjs_state FROM documents WHERE id = ${documentName}
        `;

        if (result.length > 0 && result[0].yjs_state) {
          return Buffer.from(result[0].yjs_state, 'base64');
        }

        return null;
      },

      // Store document state to PostgreSQL
      store: async ({ documentName, state }) => {
        const base64State = Buffer.from(state).toString('base64');

        await sql`
          UPDATE documents
          SET yjs_state = ${base64State}, updated_at = NOW()
          WHERE id = ${documentName}
        `;

        console.log(`[ok] Persisted document: ${documentName}`);
      }
    })
  ]
});

// --------------------------------------------------------------------------
// [SECTION] Server Startup
// --------------------------------------------------------------------------

server.listen().then(() => {
  console.log('===================================================================');
  console.log(' MarkWrite Sync Server');
  console.log('===================================================================');
  console.log(`[*] Listening on port ${PORT}`);
  console.log(`[*] WebSocket URL: ws://localhost:${PORT}`);
  console.log('-------------------------------------------------------------------');
});

// --------------------------------------------------------------------------
// [SECTION] Graceful Shutdown
// --------------------------------------------------------------------------

process.on('SIGINT', async () => {
  console.log('\n[!] Shutting down...');
  await server.destroy();
  await sql.end();
  process.exit(0);
});
