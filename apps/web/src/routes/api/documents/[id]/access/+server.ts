// ==========================================================================
// File    : +server.ts
// Project : MarkWrite
// Layer   : API Routes
// Purpose : Document access validation endpoint for sync server.
//
// Author  : AuraEG Team
// Created : 2026-03-27
// ==========================================================================

import { json, error, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { documents } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

// --------------------------------------------------------------------------
// [ROUTE] GET /api/documents/[id]/access
// --------------------------------------------------------------------------

/**
 * Checks if the current user has access to a document.
 * Returns the permission level ('read' or 'write').
 * Used by the sync server to authorize WebSocket connections.
 */
export const GET: RequestHandler = async ({ params, locals }) => {
  const user = locals.user;
  const documentId = params.id;

  if (!user) {
    throw error(401, 'Authentication required');
  }

  if (!documentId) {
    throw error(400, 'Document ID is required');
  }

  // [1] Fetch the document
  const [document] = await db.select().from(documents).where(eq(documents.id, documentId)).limit(1);

  if (!document) {
    throw error(404, 'Document not found');
  }

  // [2] Check if user is the owner
  if (document.ownerId === user.id) {
    return json({ permission: 'write' });
  }

  // [3] TODO: Check document_collaborators table for shared access
  // For now, only owner has access
  throw error(403, 'Access denied');
};
