// ==========================================================================
// File    : +server.ts
// Project : MarkWrite
// Layer   : API Routes
// Purpose : Session validation endpoint for sync server authentication.
//
// Author  : AuraEG Team
// Created : 2026-03-27
// ==========================================================================

import { json, type RequestHandler } from '@sveltejs/kit';

// --------------------------------------------------------------------------
// [ROUTE] GET /api/auth/session
// --------------------------------------------------------------------------

/**
 * Returns the current user session if authenticated.
 * Used by the sync server to validate WebSocket connections.
 */
export const GET: RequestHandler = async ({ locals }) => {
  const user = locals.user;

  if (!user) {
    return json({ user: null }, { status: 401 });
  }

  return json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
    },
  });
};
