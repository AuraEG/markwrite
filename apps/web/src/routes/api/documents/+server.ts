// ==========================================================================
// File    : +server.ts
// Project : MarkWrite
// Layer   : API
// Purpose : Document collection endpoints (POST: create, GET: list).
//
// Author  : AuraEG Team
// Created : 2026-03-25
// ==========================================================================

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { documents } from '$lib/server/db/schema';
import { createDocumentSchema, listDocumentsQuerySchema } from '$lib/server/validators';
import { eq, desc, count } from 'drizzle-orm';

// --------------------------------------------------------------------------
// [SECTION] POST /api/documents - Create Document
// --------------------------------------------------------------------------

export const POST: RequestHandler = async ({ locals, request }) => {
  // [*] Check authentication
  if (!locals.user) {
    throw error(401, { message: 'Unauthorized' });
  }

  // [*] Parse and validate request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw error(400, { message: 'Invalid JSON body' });
  }

  const parsed = createDocumentSchema.safeParse(body);
  if (!parsed.success) {
    throw error(400, {
      message: 'Validation failed',
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  // [*] Generate document ID
  const id = crypto.randomUUID();
  const now = new Date();

  // [*] Insert document
  const [newDoc] = await db
    .insert(documents)
    .values({
      id,
      title: parsed.data.title,
      ownerId: locals.user.id,
      isPublic: false,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return json(
    {
      id: newDoc.id,
      title: newDoc.title,
      ownerId: newDoc.ownerId,
      isPublic: newDoc.isPublic,
      createdAt: newDoc.createdAt.toISOString(),
      updatedAt: newDoc.updatedAt.toISOString(),
    },
    { status: 201 }
  );
};

// --------------------------------------------------------------------------
// [SECTION] GET /api/documents - List User Documents
// --------------------------------------------------------------------------

export const GET: RequestHandler = async ({ locals, url }) => {
  // [*] Check authentication
  if (!locals.user) {
    throw error(401, { message: 'Unauthorized' });
  }

  // [*] Parse query parameters
  const queryParams = {
    page: url.searchParams.get('page') ?? undefined,
    limit: url.searchParams.get('limit') ?? undefined,
  };

  const parsed = listDocumentsQuerySchema.safeParse(queryParams);
  if (!parsed.success) {
    throw error(400, {
      message: 'Invalid query parameters',
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const { page, limit } = parsed.data;
  const offset = (page - 1) * limit;

  // [*] Fetch documents with pagination
  const [userDocs, totalResult] = await Promise.all([
    db
      .select({
        id: documents.id,
        title: documents.title,
        ownerId: documents.ownerId,
        isPublic: documents.isPublic,
        createdAt: documents.createdAt,
        updatedAt: documents.updatedAt,
      })
      .from(documents)
      .where(eq(documents.ownerId, locals.user.id))
      .orderBy(desc(documents.updatedAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: count() }).from(documents).where(eq(documents.ownerId, locals.user.id)),
  ]);

  const total = totalResult[0]?.count ?? 0;
  const totalPages = Math.ceil(total / limit);

  return json({
    data: userDocs.map((doc) => ({
      id: doc.id,
      title: doc.title,
      ownerId: doc.ownerId,
      isPublic: doc.isPublic,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  });
};
