// ==========================================================================
// File    : +server.ts
// Project : MarkWrite
// Layer   : API
// Purpose : Document version history endpoints.
//
// Author  : AuraEG Team
// Created : 2026-04-02
// ==========================================================================

import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { documentVersions, documents, documentCollaborators, users } from '$lib/server/db/schema';
import { eq, desc, and, notInArray } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type { RequestHandler } from './$types';

// --------------------------------------------------------------------------
// GET /api/documents/[id]/versions
// List all versions for a document (requires read access)
// --------------------------------------------------------------------------

export const GET: RequestHandler = async ({ params, locals }) => {
  const user = locals.user;
  if (!user) {
    return error(401, 'Authentication required');
  }

  const documentId = params.id;

  // Check document access
  const document = await db.query.documents.findFirst({
    where: eq(documents.id, documentId),
  });

  if (!document) {
    return error(404, 'Document not found');
  }

  // Check if user has access (owner, collaborator, or public)
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

  // Fetch versions with author info
  const versions = await db
    .select({
      id: documentVersions.id,
      label: documentVersions.label,
      createdAt: documentVersions.createdAt,
      createdBy: documentVersions.createdBy,
      username: users.username,
      avatarUrl: users.avatarUrl,
    })
    .from(documentVersions)
    .leftJoin(users, eq(documentVersions.createdBy, users.id))
    .where(eq(documentVersions.documentId, documentId))
    .orderBy(desc(documentVersions.createdAt));

  return json({
    versions: versions.map((v) => ({
      id: v.id,
      label: v.label,
      createdAt: v.createdAt,
      author: v.createdBy
        ? {
            id: v.createdBy,
            username: v.username,
            avatarUrl: v.avatarUrl,
          }
        : null,
    })),
  });
};

// --------------------------------------------------------------------------
// POST /api/documents/[id]/versions
// Create a new named version (manual save)
// --------------------------------------------------------------------------

export const POST: RequestHandler = async ({ params, locals, request }) => {
  const user = locals.user;
  if (!user) {
    return error(401, 'Authentication required');
  }

  const documentId = params.id;

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

  // Parse request body
  const body = await request.json();
  const { label, yjsSnapshot } = body;

  if (!yjsSnapshot) {
    return error(400, 'Yjs snapshot required');
  }

  // Create version
  const versionId = nanoid();
  await db.insert(documentVersions).values({
    id: versionId,
    documentId,
    yjsSnapshot,
    label: label || null,
    createdBy: user.id,
  });

  // Check version count and prune if needed (keep last 50)
  const allVersions = await db
    .select({ id: documentVersions.id, createdAt: documentVersions.createdAt })
    .from(documentVersions)
    .where(eq(documentVersions.documentId, documentId))
    .orderBy(desc(documentVersions.createdAt));

  if (allVersions.length > 50) {
    // Keep the most recent 50
    const versionsToKeep = allVersions.slice(0, 50);
    const keepIds = versionsToKeep.map((v) => v.id);

    // Delete old versions (NOT IN keepIds)
    await db
      .delete(documentVersions)
      .where(
        and(eq(documentVersions.documentId, documentId), notInArray(documentVersions.id, keepIds))
      );
  }

  return json({ id: versionId }, { status: 201 });
};
