// ==========================================================================
// File    : yjs-utils.ts
// Project : MarkWrite
// Layer   : Collaboration
// Purpose : Utility functions for Yjs state serialization and deserialization.
//
// Author  : AuraEG Team
// Created : 2026-03-26
// ==========================================================================

import * as Y from 'yjs';

// --------------------------------------------------------------------------
// [SECTION] Serialization
// --------------------------------------------------------------------------

/**
 * Encodes a Yjs document state to a Base64 string for database storage.
 *
 * @param doc - The Yjs document to encode
 * @returns Base64 encoded string of the document state
 */
export function encodeYjsState(doc: Y.Doc): string {
  const state = Y.encodeStateAsUpdate(doc);
  return base64Encode(state);
}

/**
 * Decodes a Base64 string and applies it to a Yjs document.
 *
 * @param doc - The Yjs document to apply the state to
 * @param encodedState - Base64 encoded state string
 */
export function decodeYjsState(doc: Y.Doc, encodedState: string): void {
  const state = base64Decode(encodedState);
  Y.applyUpdate(doc, state);
}

/**
 * Creates a Yjs document from an encoded state string.
 *
 * @param encodedState - Base64 encoded state string (can be null/undefined)
 * @returns A new Yjs document with the state applied
 */
export function createDocFromState(encodedState: string | null | undefined): Y.Doc {
  const doc = new Y.Doc();

  if (encodedState) {
    try {
      decodeYjsState(doc, encodedState);
    } catch (error) {
      console.error('[Yjs] Failed to decode state:', error);
    }
  }

  return doc;
}

// --------------------------------------------------------------------------
// [SECTION] Snapshot Utilities
// --------------------------------------------------------------------------

/**
 * Creates a snapshot of the current Yjs document state.
 *
 * @param doc - The Yjs document to snapshot
 * @returns Base64 encoded snapshot string
 */
export function createSnapshot(doc: Y.Doc): string {
  const snapshot = Y.snapshot(doc);
  const encoded = Y.encodeSnapshot(snapshot);
  return base64Encode(encoded);
}

/**
 * Restores a Yjs document from a snapshot.
 *
 * @param doc - The target Yjs document
 * @param snapshotEncoded - Base64 encoded snapshot string
 * @param originDoc - The original document to diff against
 */
export function restoreFromSnapshot(doc: Y.Doc, snapshotEncoded: string, originDoc: Y.Doc): void {
  const snapshotData = base64Decode(snapshotEncoded);
  const snapshot = Y.decodeSnapshot(snapshotData);
  const restoredDoc = Y.createDocFromSnapshot(originDoc, snapshot);

  // [*] Apply the restored state to the target document
  const state = Y.encodeStateAsUpdate(restoredDoc);
  Y.applyUpdate(doc, state);
}

// --------------------------------------------------------------------------
// [SECTION] Base64 Encoding/Decoding
// --------------------------------------------------------------------------

/**
 * Encodes a Uint8Array to a Base64 string.
 */
function base64Encode(data: Uint8Array): string {
  // [*] Use browser-compatible method if available
  if (typeof btoa !== 'undefined') {
    const binary = Array.from(data)
      .map((byte) => String.fromCharCode(byte))
      .join('');
    return btoa(binary);
  }

  // [*] Node.js fallback
  return Buffer.from(data).toString('base64');
}

/**
 * Decodes a Base64 string to a Uint8Array.
 */
function base64Decode(encoded: string): Uint8Array {
  // [*] Use browser-compatible method if available
  if (typeof atob !== 'undefined') {
    const binary = atob(encoded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  // [*] Node.js fallback
  return new Uint8Array(Buffer.from(encoded, 'base64'));
}

// --------------------------------------------------------------------------
// [SECTION] Document Content Utilities
// --------------------------------------------------------------------------

/**
 * Extracts plain text content from a Yjs document.
 *
 * @param doc - The Yjs document
 * @param xmlFragmentName - Name of the XML fragment (default: 'prosemirror')
 * @returns Plain text content
 */
export function getTextContent(doc: Y.Doc, xmlFragmentName = 'prosemirror'): string {
  const fragment = doc.getXmlFragment(xmlFragmentName);
  return fragment.toDOM().textContent ?? '';
}

/**
 * Checks if two Yjs documents have the same content.
 *
 * @param doc1 - First document
 * @param doc2 - Second document
 * @returns True if documents are equal
 */
export function areDocsEqual(doc1: Y.Doc, doc2: Y.Doc): boolean {
  const state1 = Y.encodeStateAsUpdate(doc1);
  const state2 = Y.encodeStateAsUpdate(doc2);

  if (state1.length !== state2.length) return false;

  for (let i = 0; i < state1.length; i++) {
    if (state1[i] !== state2[i]) return false;
  }

  return true;
}
