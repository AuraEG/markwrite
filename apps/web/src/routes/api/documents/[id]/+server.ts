// ==========================================================================
// File    : +server.ts
// Project : MarkWrite
// Layer   : API
// Purpose : Single document endpoints (GET, PATCH, DELETE by ID).
//
// Author  : AuraEG Team
// Created : 2026-03-25
// ==========================================================================

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { documents, documentCollaborators } from '$lib/server/db/schema';
import { updateDocumentSchema } from '$lib/server/validators';
import { eq, and } from 'drizzle-orm';

// --------------------------------------------------------------------------
// [SECTION] Authorization Helper
// --------------------------------------------------------------------------

type Permission = 'view' | 'edit' | 'owner';

async function checkDocumentAccess(
  documentId: string,
  userId: string,
  requiredPermission: Permission
): Promise<{ document: typeof documents.$inferSelect; permission: Permission } | null> {
  // [*] Fetch document
  const [doc] = await db.select().from(documents).where(eq(documents.id, documentId)).limit(1);

  if (!doc) {
    return null;
  }

  // [*] Owner has full access
  if (doc.ownerId === userId) {
    return { document: doc, permission: 'owner' };
  }

  // [*] Check collaborator permissions
  const [collab] = await db
    .select()
    .from(documentCollaborators)
    .where(
      and(
        eq(documentCollaborators.documentId, documentId),
        eq(documentCollaborators.userId, userId)
      )
    )
    .limit(1);

  if (collab) {
    const hasPermission =
      requiredPermission === 'view' ||
      (requiredPermission === 'edit' && collab.permission === 'edit');
    if (hasPermission) {
      return { document: doc, permission: collab.permission as Permission };
    }
  }

  // [*] Public documents are viewable by anyone
  if (doc.isPublic && requiredPermission === 'view') {
    return { document: doc, permission: 'view' };
  }

  return null;
}

// --------------------------------------------------------------------------
// [SECTION] GET /api/documents/[id] - Get Single Document
// --------------------------------------------------------------------------

export const GET: RequestHandler = async ({ locals, params }) => {
  // [*] Check authentication
  if (!locals.user) {
    throw error(401, { message: 'Unauthorized' });
  }

  const { id } = params;
  const access = await checkDocumentAccess(id, locals.user.id, 'view');

  if (!access) {
    throw error(404, { message: 'Document not found' });
  }

  const { document: doc, permission } = access;

  return json({
    id: doc.id,
    title: doc.title,
    ownerId: doc.ownerId,
    isPublic: doc.isPublic,
    yjsState: doc.yjsState,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    permission,
  });
};

// --------------------------------------------------------------------------
// [SECTION] PATCH /api/documents/[id] - Update Document Metadata
// --------------------------------------------------------------------------

export const PATCH: RequestHandler = async ({ locals, params, request }) => {
  // [*] Check authentication
  if (!locals.user) {
    throw error(401, { message: 'Unauthorized' });
  }

  const { id } = params;

  // [*] Parse and validate request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw error(400, { message: 'Invalid JSON body' });
  }

  const parsed = updateDocumentSchema.safeParse(body);
  if (!parsed.success) {
    throw error(400, {
      message: 'Validation failed',
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  // [*] Check edit permission
  const access = await checkDocumentAccess(id, locals.user.id, 'edit');

  if (!access) {
    // [*] Check if document exists for proper error code
    const [exists] = await db
      .select({ id: documents.id })
      .from(documents)
      .where(eq(documents.id, id))
      .limit(1);
    if (!exists) {
      throw error(404, { message: 'Document not found' });
    }
    throw error(403, { message: 'Forbidden' });
  }

  // [*] Only owner can change isPublic
  if (parsed.data.isPublic !== undefined && access.permission !== 'owner') {
    throw error(403, { message: 'Only the owner can change visibility' });
  }

  // [*] Build update object
  const updateData: Partial<typeof documents.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (parsed.data.title !== undefined) {
    updateData.title = parsed.data.title;
  }
  if (parsed.data.isPublic !== undefined) {
    updateData.isPublic = parsed.data.isPublic;
  }

  // [*] Update document
  const [updated] = await db
    .update(documents)
    .set(updateData)
    .where(eq(documents.id, id))
    .returning();

  return json({
    id: updated.id,
    title: updated.title,
    ownerId: updated.ownerId,
    isPublic: updated.isPublic,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  });
};

// --------------------------------------------------------------------------
// [SECTION] DELETE /api/documents/[id] - Delete Document (Soft)
// --------------------------------------------------------------------------

export const DELETE: RequestHandler = async ({ locals, params }) => {
  // [*] Check authentication
  if (!locals.user) {
    throw error(401, { message: 'Unauthorized' });
  }

  const { id } = params;

  // [*] Only owner can delete
  const [doc] = await db.select().from(documents).where(eq(documents.id, id)).limit(1);

  if (!doc) {
    throw error(404, { message: 'Document not found' });
  }

  if (doc.ownerId !== locals.user.id) {
    throw error(403, { message: 'Only the owner can delete this document' });
  }

  // [*] Delete document (cascade will remove collaborators and versions)
  // NOTE: Currently hard delete. Add deletedAt column for soft delete if needed.
  await db.delete(documents).where(eq(documents.id, id));

  return new Response(null, { status: 204 });
};
