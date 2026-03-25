// ==========================================================================
// File    : +page.server.ts
// Project : MarkWrite
// Layer   : Route
// Purpose : Server load function for documents list page.
//
// Author  : AuraEG Team
// Created : 2026-03-25
// ==========================================================================

import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { documents } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
  // [*] Redirect unauthenticated users to home
  if (!locals.user) {
    throw redirect(302, '/');
  }

  // [*] Fetch user's documents
  const userDocuments = await db
    .select({
      id: documents.id,
      title: documents.title,
      isPublic: documents.isPublic,
      createdAt: documents.createdAt,
      updatedAt: documents.updatedAt,
    })
    .from(documents)
    .where(eq(documents.ownerId, locals.user.id))
    .orderBy(desc(documents.updatedAt));

  return {
    user: locals.user,
    documents: userDocuments.map((doc) => ({
      ...doc,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    })),
  };
};
