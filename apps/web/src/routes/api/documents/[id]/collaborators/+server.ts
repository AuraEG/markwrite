// ==========================================================================
// File    : +server.ts
// Project : MarkWrite
// Layer   : API
// Purpose : Document collaborators management API.
//
// Author  : AuraEG Team
// Created : 2026-03-31
// ==========================================================================

import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { documentCollaborators, documents, users } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// --------------------------------------------------------------------------
// [SECTION] GET - List Collaborators
// --------------------------------------------------------------------------

export const GET: RequestHandler = async ({ params, locals }) => {
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
    error(403, { message: 'Only the document owner can manage collaborators' });
  }

  // [*] Fetch all collaborators
  const collaborators = await db
    .select({
      userId: documentCollaborators.userId,
      permission: documentCollaborators.permission,
    })
    .from(documentCollaborators)
    .where(eq(documentCollaborators.documentId, documentId));

  return json({ collaborators });
};

// --------------------------------------------------------------------------
// [SECTION] POST - Add/Update Collaborator
// --------------------------------------------------------------------------

export const POST: RequestHandler = async ({ params, request, locals }) => {
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
    error(403, { message: 'Only the document owner can manage collaborators' });
  }

  // [*] Parse request body
  const body = await request.json();
  const { username, permission } = body;

  if (!username || !permission) {
    error(400, { message: 'username and permission are required' });
  }

  if (permission !== 'view' && permission !== 'edit') {
    error(400, { message: 'Permission must be "view" or "edit"' });
  }

  // [*] Find user by username (user must have logged into MarkWrite at least once)
  const [collaboratorUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (!collaboratorUser) {
    error(404, {
      message:
        'User not found. They must log into MarkWrite first before being added as a collaborator.',
    });
  }

  if (collaboratorUser.id === document.ownerId) {
    error(400, { message: 'Cannot add owner as collaborator' });
  }

  // [*] Insert or update collaborator
  await db
    .insert(documentCollaborators)
    .values({
      documentId,
      userId: collaboratorUser.id,
      permission,
    })
    .onConflictDoUpdate({
      target: [documentCollaborators.documentId, documentCollaborators.userId],
      set: { permission },
    });

  return json({ success: true });
};

// --------------------------------------------------------------------------
// [SECTION] DELETE - Remove Collaborator
// --------------------------------------------------------------------------

export const DELETE: RequestHandler = async ({ params, request, locals }) => {
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
    error(403, { message: 'Only the document owner can manage collaborators' });
  }

  // [*] Parse request body
  const body = await request.json();
  const { userId: collaboratorUserId } = body;

  if (!collaboratorUserId) {
    error(400, { message: 'userId is required' });
  }

  // [*] Delete collaborator
  await db
    .delete(documentCollaborators)
    .where(
      and(
        eq(documentCollaborators.documentId, documentId),
        eq(documentCollaborators.userId, collaboratorUserId)
      )
    );

  return json({ success: true });
};
