// ==========================================================================
// File    : hocuspocus-provider.ts
// Project : MarkWrite
// Layer   : Collaboration
// Purpose : Hocuspocus WebSocket provider for real-time Yjs sync.
//
// Author  : AuraEG Team
// Created : 2026-03-27
// ==========================================================================

import { HocuspocusProvider } from '@hocuspocus/provider';
import type { Doc } from 'yjs';

// --------------------------------------------------------------------------
// [SECTION] Configuration
// --------------------------------------------------------------------------

const SYNC_SERVER_URL = import.meta.env.VITE_SYNC_SERVER_URL || 'ws://localhost:1234';

// --------------------------------------------------------------------------
// [SECTION] Types
// --------------------------------------------------------------------------

export interface ProviderOptions {
  documentId: string;
  ydoc: Doc;
  token?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onSynced?: () => void;
  onError?: (error: Error) => void;
}

export interface ProviderState {
  isConnected: boolean;
  isSynced: boolean;
  error: Error | null;
}

// --------------------------------------------------------------------------
// [SECTION] Provider Factory
// --------------------------------------------------------------------------

/**
 * Creates a Hocuspocus provider for real-time document sync.
 */
export function createHocuspocusProvider(options: ProviderOptions): HocuspocusProvider {
  const { documentId, ydoc, token, onConnect, onDisconnect, onSynced, onError } = options;

  // [*] Room name follows convention: document:{id}
  const roomName = `document:${documentId}`;

  // [*] Use provided token or 'dev' for development
  const authToken = token || 'dev';

  console.log(`[HocuspocusProvider] Creating provider for ${roomName}`);
  console.log(`[HocuspocusProvider] URL: ${SYNC_SERVER_URL}`);

  const provider = new HocuspocusProvider({
    url: SYNC_SERVER_URL,
    name: roomName,
    document: ydoc,
    token: authToken,

    // [*] Connection settings
    connect: true,
    broadcast: false, // Disable BroadcastChannel (we use WebSocket only)
    preserveConnection: true, // Keep connection alive

    // [*] Event handlers
    onConnect: () => {
      console.log(`[HocuspocusProvider] Connected to ${roomName}`);
      onConnect?.();
    },

    onDisconnect: () => {
      console.log(`[HocuspocusProvider] Disconnected from ${roomName}`);
      onDisconnect?.();
    },

    onSynced: ({ state }) => {
      console.log(`[HocuspocusProvider] Synced event, state: ${state}`);
      if (state) {
        console.log(`[HocuspocusProvider] Synced with ${roomName}`);
        onSynced?.();
      }
    },

    onAuthenticationFailed: ({ reason }) => {
      console.error(`[HocuspocusProvider] Auth failed: ${reason}`);
      onError?.(new Error(`Authentication failed: ${reason}`));
    },

    onClose: ({ event }) => {
      console.log(
        `[HocuspocusProvider] Connection closed: code=${event.code}, reason=${event.reason}`
      );
      if (event.code !== 1000) {
        console.warn(`[HocuspocusProvider] Unexpected close: ${event.reason || event.code}`);
      }
    },

    onStatus: ({ status }) => {
      console.log(`[HocuspocusProvider] Status changed: ${status}`);
    },
  });

  return provider;
}

// --------------------------------------------------------------------------
// [SECTION] Session Token Helper
// --------------------------------------------------------------------------

/**
 * Gets the session token from cookies for WebSocket authentication.
 * Note: This only works on the client side.
 */
export function getSessionToken(): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'auth_session') {
      return value;
    }
  }

  return null;
}
