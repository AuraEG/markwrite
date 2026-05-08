// ==========================================================================
// File    : document-sync.ts
// Project : MarkWrite
// Layer   : Collaboration
// Purpose : Document synchronization manager using Yjs for real-time CRDT.
//
// Author  : AuraEG Team
// Created : 2026-03-26
// ==========================================================================

import * as Y from 'yjs';
import { encodeYjsState, decodeYjsState } from './yjs-utils';
import pako from 'pako';

// --------------------------------------------------------------------------
// [SECTION] Types
// --------------------------------------------------------------------------

export interface SyncOptions {
  documentId: string;
  initialState?: string | null;
  onUpdate?: (state: string) => void;
  debounceMs?: number;
}

export interface DocumentSync {
  doc: Y.Doc;
  getState: () => string;
  destroy: () => void;
}

// --------------------------------------------------------------------------
// [SECTION] Document Sync Manager
// --------------------------------------------------------------------------

/**
 * Creates a document synchronization manager.
 *
 * This manager handles:
 * - Initializing Yjs document from persisted state
 * - Debounced updates for persistence
 * - Cleanup on unmount
 *
 * @param options - Sync configuration options
 * @returns DocumentSync interface
 */
export function createDocumentSync(options: SyncOptions): DocumentSync {
  const { documentId, initialState, onUpdate, debounceMs = 1000 } = options;

  // [*] Create Yjs document
  const doc = new Y.Doc();

  // [*] Apply initial state if provided
  if (initialState) {
    try {
      decodeYjsState(doc, initialState);
    } catch (error) {
      console.error(`[DocumentSync] Failed to load state for ${documentId}:`, error);
    }
  }

  // [*] Setup debounced update handler
  let updateTimeout: ReturnType<typeof setTimeout> | null = null;

  const handleUpdate = () => {
    if (updateTimeout) {
      clearTimeout(updateTimeout);
    }

    updateTimeout = setTimeout(() => {
      if (onUpdate) {
        const state = encodeYjsState(doc);
        onUpdate(state);
      }
    }, debounceMs);
  };

  // [*] Subscribe to document updates
  doc.on('update', handleUpdate);

  // [*] Return interface
  return {
    doc,
    getState: () => encodeYjsState(doc),
    destroy: () => {
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
      doc.off('update', handleUpdate);
      doc.destroy();
    },
  };
}

// --------------------------------------------------------------------------
// [SECTION] Persistence API
// --------------------------------------------------------------------------

/**
 * Saves document state to the server.
 *
 * @param documentId - The document ID
 * @param state - Base64 encoded Yjs state
 * @returns Success status
 */
export async function saveDocumentState(
  documentId: string,
  state: string
): Promise<{ success: boolean; error?: string }> {
  const stateSize = state.length;
  console.log(`[DocumentSync] Saving state for ${documentId}: ${(stateSize / 1024).toFixed(2)}KB`);

  // Compress large states to avoid body size limits (SvelteKit has ~512KB limit)
  let payload = state;
  let isCompressed = false;
  
  if (stateSize > 50 * 1024) { // Compress if > 50KB to stay well below 512KB limit
    try {
      const compressed = pako.gzip(state);
      payload = btoa(String.fromCharCode(...compressed));
      isCompressed = true;
      console.log(`[DocumentSync] Compressed: ${(stateSize / 1024).toFixed(2)}KB → ${(payload.length / 1024).toFixed(2)}KB`);
    } catch (err) {
      console.error('[DocumentSync] Compression failed:', err);
      // If compression fails and state is too large, return error immediately
      if (stateSize > 100 * 1024) {
        return {
          success: false,
          error: `Document too large (${(stateSize / 1024).toFixed(2)}KB) and compression failed. Please reduce content.`
        };
      }
    }
  }

  try {
    const response = await fetch(`/api/documents/${documentId}/state`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        ...(isCompressed && { 'X-Content-Encoding': 'gzip' })
      },
      body: JSON.stringify({ state: payload }),
      keepalive: true,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to save';
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }

      console.error(`[DocumentSync] Save failed (${response.status}):`, errorMessage);
      
      if (response.status === 413) {
        return { 
          success: false, 
          error: `Document too large (${(stateSize / 1024).toFixed(2)}KB)` 
        };
      }
      
      return { success: false, error: errorMessage };
    }

    console.log(`[DocumentSync] Save successful for ${documentId}`);
    return { success: true };
  } catch (error) {
    console.error('[DocumentSync] Network error during save:', error);
    return { success: false, error: 'Network error - check connection' };
  }
}

/**
 * Loads document state from the server.
 *
 * @param documentId - The document ID
 * @returns The encoded state or null
 */
export async function loadDocumentState(
  documentId: string
): Promise<{ state: string | null; error?: string }> {
  try {
    const response = await fetch(`/api/documents/${documentId}/state`);

    if (!response.ok) {
      const error = await response.json();
      return { state: null, error: error.message ?? 'Failed to load' };
    }

    const data = await response.json();
    return { state: data.state };
  } catch (error) {
    console.error('[DocumentSync] Load failed:', error);
    return { state: null, error: 'Network error' };
  }
}
