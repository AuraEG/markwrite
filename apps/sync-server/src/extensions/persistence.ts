// ==========================================================================
// File    : persistence.ts
// Project : MarkWrite
// Layer   : Infrastructure / Extensions
// Purpose : Hocuspocus persistence extension for PostgreSQL document storage.
//
// Author  : AuraEG Team
// Created : 2026-03-27
// ==========================================================================

import type { Sql } from 'postgres';
import { config } from '../config.js';

// --------------------------------------------------------------------------
// [SECTION] Types
// --------------------------------------------------------------------------

interface DocumentRow {
  id: string;
  yjs_state: string | null;
}

// --------------------------------------------------------------------------
// [SECTION] Persistence Functions
// --------------------------------------------------------------------------

/**
 * Creates a persistence configuration for the Database extension.
 */
export function createPersistenceConfig(sql: Sql) {
  return {
    /**
     * Fetch document state from PostgreSQL.
     * Called when a client connects to a document room.
     */
    fetch: async ({ documentName }: { documentName: string }): Promise<Uint8Array | null> => {
      const documentId = documentName.replace('document:', '');

      try {
        const result = await sql<DocumentRow[]>`
          SELECT id, yjs_state FROM documents WHERE id = ${documentId}
        `;

        if (result.length > 0 && result[0].yjs_state) {
          console.log(`[*] Loaded document state: ${documentId} (${result[0].yjs_state.length} bytes)`);
          return Buffer.from(result[0].yjs_state, 'base64');
        }

        console.log(`[*] No existing state for document: ${documentId}`);
        return null;
      } catch (error) {
        console.error(`[!] Failed to fetch document ${documentId}:`, error);
        return null;
      }
    },

    /**
     * Store document state to PostgreSQL.
     * Called when document changes are debounced.
     */
    store: async ({
      documentName,
      state,
    }: {
      documentName: string;
      state: Uint8Array;
    }): Promise<void> => {
      const documentId = documentName.replace('document:', '');
      const base64State = Buffer.from(state).toString('base64');

      try {
        const result = await sql`
          UPDATE documents
          SET yjs_state = ${base64State}, updated_at = NOW()
          WHERE id = ${documentId}
          RETURNING id
        `;

        if (result.length > 0) {
          console.log(`[ok] Persisted document: ${documentId} (${state.length} bytes)`);
        } else {
          console.warn(`[!] Document not found for persistence: ${documentId}`);
        }
      } catch (error) {
        console.error(`[!] Failed to persist document ${documentId}:`, error);
        throw error;
      }
    },
  };
}

/**
 * Creates debounce configuration for the Database extension.
 */
export function createDebounceConfig() {
  return {
    // [*] Wait this long after the last change before persisting
    debounce: config.debounceMs,
    // [*] Maximum time to wait before forcing persistence
    maxDebounce: config.maxDebounceMs,
  };
}
