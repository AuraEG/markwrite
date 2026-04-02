// ==========================================================================
// File    : +server.ts
// Project : MarkWrite
// Layer   : API
// Purpose : Document version restore endpoint.
//
// Author  : AuraEG Team
// Created : 2026-04-02
// ==========================================================================

import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { documentVersions, documents, documentCollaborators } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type { RequestHandler } from './$types';

// --------------------------------------------------------------------------
// POST /api/documents/[id]/versions/[versionId]/restore
// Restore document to a specific version (creates new version entry)
// --------------------------------------------------------------------------

export const POST: RequestHandler = async ({ params, locals }) => {
  const user = locals.user;
  if (!user) {
    return error(401, 'Authentication required');
  }

  const documentId = params.id;
  const versionId = params.versionId;

  // Check document exists and user has edit access
  const document = await db.query.documents.findFirst({
    where: eq(documents.id, documentId),
  });

  if (!document) {
    return error(404, 'Document not found');
  }

  const isOwner = document.ownerId === user.id;
  const collaborator = await db.query.documentCollaborators.findFirst({
    where: and(
      eq(documentCollaborators.documentId, documentId),
      eq(documentCollaborators.userId, user.id),
      eq(documentCollaborators.permission, 'edit')
    ),
  });

  if (!isOwner && !collaborator) {
    return error(403, 'Edit access required');
  }

  // Fetch version to restore
  const version = await db.query.documentVersions.findFirst({
    where: and(eq(documentVersions.id, versionId), eq(documentVersions.documentId, documentId)),
  });

  if (!version) {
    return error(404, 'Version not found');
  }

  // Create a new version entry with the restored state
  // (Non-destructive: keeps history before restoration)
  const restoredVersionId = nanoid();
  await db.insert(documentVersions).values({
    id: restoredVersionId,
    documentId,
    yjsSnapshot: version.yjsSnapshot,
    label: `Restored from ${version.label || 'version'}`,
    createdBy: user.id,
  });

  // Update document's current state to the restored version
  await db
    .update(documents)
    .set({
      yjsState: version.yjsSnapshot,
      updatedAt: new Date(),
    })
    .where(eq(documents.id, documentId));

  return json({
    success: true,
    restoredVersionId,
    message: 'Document restored successfully',
  });
};
