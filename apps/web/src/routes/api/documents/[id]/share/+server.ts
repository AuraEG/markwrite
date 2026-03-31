// ==========================================================================
// File    : +server.ts
// Project : MarkWrite
// Layer   : API
// Purpose : Document sharing token management API.
//
// Author  : AuraEG Team
// Created : 2026-03-31
// ==========================================================================

import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { documents } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type { RequestHandler } from './$types';

// --------------------------------------------------------------------------
// [SECTION] POST - Generate/Regenerate Share Token
// --------------------------------------------------------------------------

export const POST: RequestHandler = async ({ params, locals }) => {
  const { id: documentId } = params;
  const userId = locals.user?.id;

  if (!userId) {
    error(401, { message: 'Authentication required' });
  }

  // [*] Check if user is the owner
  const [document] = await db
    .select({ ownerId: documents.ownerId })
    .from(documents)
    .where(eq(documents.id, documentId))
    .limit(1);

  if (!document) {
    error(404, { message: 'Document not found' });
  }

  if (document.ownerId !== userId) {
    error(403, { message: 'Only the document owner can generate share links' });
  }

  // [*] Generate new share token
  const shareToken = nanoid(32);

  // [*] Update document with new token
  await db.update(documents).set({ shareToken }).where(eq(documents.id, documentId));

  return json({ shareToken });
};

// --------------------------------------------------------------------------
// [SECTION] DELETE - Revoke Share Token
// --------------------------------------------------------------------------

export const DELETE: RequestHandler = async ({ params, locals }) => {
  const { id: documentId } = params;
  const userId = locals.user?.id;

  if (!userId) {
    error(401, { message: 'Authentication required' });
  }

  // [*] Check if user is the owner
  const [document] = await db
    .select({ ownerId: documents.ownerId })
    .from(documents)
    .where(eq(documents.id, documentId))
    .limit(1);

  if (!document) {
    error(404, { message: 'Document not found' });
  }

  if (document.ownerId !== userId) {
    error(403, { message: 'Only the document owner can revoke share links' });
  }

  // [*] Remove share token
  await db.update(documents).set({ shareToken: null }).where(eq(documents.id, documentId));

  return json({ success: true });
};
