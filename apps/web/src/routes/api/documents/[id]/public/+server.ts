// ==========================================================================
// File    : +server.ts
// Project : MarkWrite
// Layer   : API
// Purpose : Document public access toggle API.
//
// Author  : AuraEG Team
// Created : 2026-03-31
// ==========================================================================

import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { documents } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// --------------------------------------------------------------------------
// [SECTION] PATCH - Toggle Public Access
// --------------------------------------------------------------------------

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
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
    error(403, { message: 'Only the document owner can change public access' });
  }

  // [*] Parse request body
  const body = await request.json();
  const { isPublic } = body;

  if (typeof isPublic !== 'boolean') {
    error(400, { message: 'isPublic must be a boolean' });
  }

  // [*] Update document public status
  await db.update(documents).set({ isPublic }).where(eq(documents.id, documentId));

  return json({ success: true, isPublic });
};
