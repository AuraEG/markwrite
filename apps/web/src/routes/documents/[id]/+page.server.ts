// ==========================================================================
// File    : +page.server.ts
// Project : MarkWrite
// Layer   : Server
// Purpose : Load document data for the editor page with permission checks.
//
// Author  : AuraEG Team
// Created : 2026-03-25
// ==========================================================================

import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { documents, documentCollaborators, users } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

// --------------------------------------------------------------------------
// [SECTION] Page Load
// --------------------------------------------------------------------------

export const load: PageServerLoad = async ({ params, locals, url }) => {
  const { id } = params;
  const userId = locals.user?.id ?? null;
  const shareToken = url.searchParams.get('token');

  // [*] Fetch document with owner info
  const [document] = await db
    .select({
      id: documents.id,
      title: documents.title,
      ownerId: documents.ownerId,
      yjsState: documents.yjsState,
      isPublic: documents.isPublic,
      shareToken: documents.shareToken,
      gistId: documents.gistId,
      gistUrl: documents.gistUrl,
      createdAt: documents.createdAt,
      updatedAt: documents.updatedAt,
      ownerUsername: users.username,
      ownerAvatarUrl: users.avatarUrl,
    })
    .from(documents)
    .innerJoin(users, eq(documents.ownerId, users.id))
    .where(eq(documents.id, id))
    .limit(1);

  if (!document) {
    error(404, { message: 'Document not found' });
  }

  // [*] Determine user permission
  let permission: 'owner' | 'edit' | 'view' | null = null;

  if (userId === document.ownerId) {
    permission = 'owner';
  } else if (userId) {
    // [*] Check collaborator permissions
    const [collaborator] = await db
      .select({ permission: documentCollaborators.permission })
      .from(documentCollaborators)
      .where(
        and(eq(documentCollaborators.documentId, id), eq(documentCollaborators.userId, userId))
      )
      .limit(1);

    if (collaborator) {
      permission = collaborator.permission as 'edit' | 'view';
    }
  }

  // [*] Check access via share token
  if (!permission && shareToken && document.shareToken === shareToken) {
    permission = 'view';
  }

  // [*] Check access: user must have permission, share token, or document is public
  if (!permission && !document.isPublic) {
    if (!userId) {
      error(401, { message: 'Please sign in to access this document' });
    }
    error(403, { message: 'You do not have permission to access this document' });
  }

  // [*] Public documents grant view permission to anonymous users
  if (!permission && document.isPublic) {
    permission = 'view';
  }

  // [*] Fetch collaborators for owner
  let collaborators: Array<{
    userId: string;
    username: string;
    avatarUrl: string | null;
    permission: string;
  }> = [];

  if (permission === 'owner') {
    collaborators = await db
      .select({
        userId: documentCollaborators.userId,
        username: users.username,
        avatarUrl: users.avatarUrl,
        permission: documentCollaborators.permission,
      })
      .from(documentCollaborators)
      .innerJoin(users, eq(documentCollaborators.userId, users.id))
      .where(eq(documentCollaborators.documentId, id));
  }

  return {
    user: locals.user
      ? {
          id: locals.user.id,
          username: locals.user.username,
          avatarUrl: locals.user.avatarUrl,
        }
      : null,
    document: {
      id: document.id,
      title: document.title,
      yjsState: document.yjsState,
      isPublic: document.isPublic,
      shareToken: document.shareToken,
      gistUrl: document.gistUrl,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      owner: {
        id: document.ownerId,
        username: document.ownerUsername,
        avatarUrl: document.ownerAvatarUrl,
      },
    },
    permission,
    collaborators,
    canEdit: permission === 'owner' || permission === 'edit',
  };
};
