// ==========================================================================
// File    : +server.ts
// Project : MarkWrite
// Layer   : API
// Purpose : Specific document version endpoints (get, restore).
//
// Author  : AuraEG Team
// Created : 2026-04-02
// ==========================================================================

import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { documentVersions, documents, documentCollaborators } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// --------------------------------------------------------------------------
// GET /api/documents/[id]/versions/[versionId]
// Get a specific version snapshot (requires read access)
// --------------------------------------------------------------------------

export const GET: RequestHandler = async ({ params, locals }) => {
  const user = locals.user;
  if (!user) {
    return error(401, 'Authentication required');
  }

  const documentId = params.id;
  const versionId = params.versionId;

  // Check document access
  const document = await db.query.documents.findFirst({
    where: eq(documents.id, documentId),
  });

  if (!document) {
    return error(404, 'Document not found');
  }

  // Check if user has access
  const isOwner = document.ownerId === user.id;
  const collaborator = await db.query.documentCollaborators.findFirst({
    where: and(
      eq(documentCollaborators.documentId, documentId),
      eq(documentCollaborators.userId, user.id)
    ),
  });

  if (!isOwner && !collaborator && !document.isPublic) {
    return error(403, 'Access denied');
  }

  // Fetch version
  const version = await db.query.documentVersions.findFirst({
    where: and(eq(documentVersions.id, versionId), eq(documentVersions.documentId, documentId)),
  });

  if (!version) {
    return error(404, 'Version not found');
  }

  return json({
    id: version.id,
    label: version.label,
    yjsSnapshot: version.yjsSnapshot,
    createdAt: version.createdAt,
    createdBy: version.createdBy,
  });
};

// --------------------------------------------------------------------------
// PATCH /api/documents/[id]/versions/[versionId]
// Update version label (owner or creator only)
// --------------------------------------------------------------------------

export const PATCH: RequestHandler = async ({ params, locals, request }) => {
  const user = locals.user;
  if (!user) {
    return error(401, 'Authentication required');
  }

  const documentId = params.id;
  const versionId = params.versionId;

  // Check document exists
  const document = await db.query.documents.findFirst({
    where: eq(documents.id, documentId),
  });

  if (!document) {
    return error(404, 'Document not found');
  }

  // Check version exists
  const version = await db.query.documentVersions.findFirst({
    where: and(eq(documentVersions.id, versionId), eq(documentVersions.documentId, documentId)),
  });

  if (!version) {
    return error(404, 'Version not found');
  }

  // Only owner or version creator can update label
  const isOwner = document.ownerId === user.id;
  const isCreator = version.createdBy === user.id;

  if (!isOwner && !isCreator) {
    return error(403, 'Only document owner or version creator can update label');
  }

  // Parse request body
  const body = await request.json();
  const { label } = body;

  // Update label
  await db
    .update(documentVersions)
    .set({ label: label || null })
    .where(eq(documentVersions.id, versionId));

  return json({ success: true });
};

// --------------------------------------------------------------------------
// DELETE /api/documents/[id]/versions/[versionId]
// Delete a version (owner only)
// --------------------------------------------------------------------------

export const DELETE: RequestHandler = async ({ params, locals }) => {
  const user = locals.user;
  if (!user) {
    return error(401, 'Authentication required');
  }

  const documentId = params.id;
  const versionId = params.versionId;

  // Check document exists
  const document = await db.query.documents.findFirst({
    where: eq(documents.id, documentId),
  });

  if (!document) {
    return error(404, 'Document not found');
  }

  // Only owner can delete versions
  if (document.ownerId !== user.id) {
    return error(403, 'Only document owner can delete versions');
  }

  // Check version exists
  const version = await db.query.documentVersions.findFirst({
    where: and(eq(documentVersions.id, versionId), eq(documentVersions.documentId, documentId)),
  });

  if (!version) {
    return error(404, 'Version not found');
  }

  // Delete version
  await db.delete(documentVersions).where(eq(documentVersions.id, versionId));

  return json({ success: true });
};
