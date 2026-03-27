// ==========================================================================
// File    : auth.ts
// Project : MarkWrite
// Layer   : Infrastructure / Extensions
// Purpose : Hocuspocus authentication extension for validating session tokens.
//
// Author  : AuraEG Team
// Created : 2026-03-27
// ==========================================================================

import type { onAuthenticatePayload, onConnectPayload } from '@hocuspocus/server';
import { config } from '../config.js';

// --------------------------------------------------------------------------
// [SECTION] Types
// --------------------------------------------------------------------------

export interface AuthenticatedUser {
  id: string;
  username: string;
  email?: string;
  avatarUrl?: string;
}

export interface AuthContext {
  user: AuthenticatedUser;
  documentId: string;
  permissions: 'read' | 'write';
}

// --------------------------------------------------------------------------
// [SECTION] Session Validation
// --------------------------------------------------------------------------

/**
 * Validates a session token by calling the web app's session endpoint.
 * Returns the authenticated user if valid, null otherwise.
 */
async function validateSessionToken(token: string): Promise<AuthenticatedUser | null> {
  try {
    const response = await fetch(`${config.webAppUrl}/api/auth/session`, {
      method: 'GET',
      headers: {
        Cookie: `auth_session=${token}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { user?: AuthenticatedUser };
    return data.user || null;
  } catch (error) {
    console.error('[!] Session validation error:', error);
    return null;
  }
}

/**
 * Validates document access for a user.
 * Returns permissions if allowed, null otherwise.
 */
async function validateDocumentAccess(
  userId: string,
  documentId: string,
  token: string
): Promise<'read' | 'write' | null> {
  try {
    const response = await fetch(`${config.webAppUrl}/api/documents/${documentId}/access`, {
      method: 'GET',
      headers: {
        Cookie: `auth_session=${token}`,
      },
    });

    if (!response.ok) {
      // [*] In dev mode, allow access for testing
      if (config.isDev) {
        console.log(`[!] Dev mode: granting write access to ${userId} for ${documentId}`);
        return 'write';
      }
      return null;
    }

    const data = (await response.json()) as { permission?: 'read' | 'write' };
    return data.permission || null;
  } catch (error) {
    // [*] In dev mode, allow access for testing
    if (config.isDev) {
      console.log(`[!] Dev mode: granting write access (error fallback)`);
      return 'write';
    }
    console.error('[!] Document access validation error:', error);
    return null;
  }
}

// --------------------------------------------------------------------------
// [SECTION] Authentication Hook
// --------------------------------------------------------------------------

/**
 * Hocuspocus onAuthenticate hook.
 * Validates the session token and sets up the auth context.
 */
export async function onAuthenticate({
  token,
  documentName,
  connection,
}: onAuthenticatePayload): Promise<AuthContext> {
  console.log(
    `[*] Authenticating connection for document: ${documentName}, token: ${token ? 'present' : 'none'}`
  );

  // [1] Extract document ID from room name (format: "document:{id}")
  const documentId = documentName.replace('document:', '');

  // [2] In dev mode, always allow connections with a test user
  if (config.isDev) {
    console.log(`[!] Dev mode: granting access for ${documentName}`);
    return {
      user: {
        id: 'dev-user',
        username: 'Developer',
        email: 'dev@localhost',
      },
      documentId,
      permissions: 'write',
    };
  }

  // [3] Validate session token
  if (!token) {
    throw new Error('Authentication required');
  }

  const user = await validateSessionToken(token);
  if (!user) {
    throw new Error('Invalid session token');
  }

  // [4] Validate document access
  const permissions = await validateDocumentAccess(user.id, documentId, token);
  if (!permissions) {
    throw new Error('Document access denied');
  }

  // [5] Set connection to read-only if needed
  if (permissions === 'read') {
    connection.readOnly = true;
  }

  console.log(`[+] Authenticated: ${user.username} (${permissions}) for ${documentName}`);

  return {
    user,
    documentId,
    permissions,
  };
}

// --------------------------------------------------------------------------
// [SECTION] Connection Hook
// --------------------------------------------------------------------------

/**
 * Hocuspocus onConnect hook.
 * Additional validation after authentication.
 */
export async function onConnect({ documentName, context }: onConnectPayload): Promise<void> {
  const authContext = context as AuthContext | undefined;
  const username = authContext?.user?.username || 'Anonymous';
  console.log(`[+] ${username} connected to ${documentName}`);
}
