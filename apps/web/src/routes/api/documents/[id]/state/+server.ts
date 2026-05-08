// ==========================================================================
// File    : +server.ts
// Project : MarkWrite
// Layer   : API
// Purpose : API endpoints for document Yjs state persistence.
//
// Author  : AuraEG Team
// Created : 2026-03-26
// ==========================================================================

import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { documents, documentCollaborators } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import pako from 'pako';

// --------------------------------------------------------------------------
// [SECTION] GET /api/documents/[id]/state
// Purpose: Load Yjs state for a document
// --------------------------------------------------------------------------

export const GET: RequestHandler = async ({ params, locals }) => {
  const { id } = params;
  const userId = locals.user?.id ?? null;

  // [*] Fetch document
  const [document] = await db
    .select({
      id: documents.id,
      ownerId: documents.ownerId,
      yjsState: documents.yjsState,
      isPublic: documents.isPublic,
    })
    .from(documents)
    .where(eq(documents.id, id))
    .limit(1);

  if (!document) {
    error(404, { message: 'Document not found' });
  }

  // [*] Check permission
  const hasAccess = await checkDocumentAccess(id, userId, document);

  if (!hasAccess) {
    error(403, { message: 'Access denied' });
  }

  return json({
    state: document.yjsState,
    updatedAt: new Date().toISOString(),
  });
};

// --------------------------------------------------------------------------
// [SECTION] PUT /api/documents/[id]/state
// Purpose: Save Yjs state for a document
// --------------------------------------------------------------------------

export const PUT: RequestHandler = async ({ params, locals, request }) => {
  const { id } = params;
  const userId = locals.user?.id;

  if (!userId) {
    error(401, { message: 'Authentication required' });
  }

  // Check if content is compressed
  const isCompressed = request.headers.get('x-content-encoding') === 'gzip';

  // [*] Parse request body
  let body: { state: string };
  try {
    body = await request.json();
  } catch (err) {
    console.error('[!] Failed to parse request body:', err);
    error(400, { message: 'Invalid JSON body' });
  }

  if (typeof body.state !== 'string') {
    error(400, { message: 'State must be a string' });
  }

  let state = body.state;

  // Decompress if needed
  if (isCompressed) {
    try {
      const compressed = Uint8Array.from(atob(state), c => c.charCodeAt(0));
      const decompressed = pako.ungzip(compressed, { to: 'string' });
      state = decompressed;
      console.log(`[*] Decompressed state: ${compressed.length} → ${state.length} bytes`);
    } catch (err) {
      console.error('[!] Decompression failed:', err);
      error(400, { message: 'Failed to decompress state' });
    }
  }

  // [*] Validate state size (max 5MB base64 encoded)
  const stateSizeBytes = Buffer.byteLength(state, 'utf8');
  const maxSizeBytes = 5 * 1024 * 1024; // 5MB
  
  if (stateSizeBytes > maxSizeBytes) {
    console.error(`[!] State too large: ${stateSizeBytes} bytes (max: ${maxSizeBytes})`);
    error(413, { 
      message: `Document too large. Size: ${(stateSizeBytes / 1024 / 1024).toFixed(2)}MB, Max: ${maxSizeBytes / 1024 / 1024}MB` 
    });
  }

  console.log(`[*] Saving state for document ${id}: ${(stateSizeBytes / 1024).toFixed(2)}KB`);

  // [*] Fetch document
  const [document] = await db
    .select({
      id: documents.id,
      ownerId: documents.ownerId,
      isPublic: documents.isPublic,
    })
    .from(documents)
    .where(eq(documents.id, id))
    .limit(1);

  if (!document) {
    error(404, { message: 'Document not found' });
  }

  // [*] Check edit permission
  const canEdit = await checkEditPermission(id, userId, document);

  if (!canEdit) {
    error(403, { message: 'Edit permission required' });
  }

  // [*] Update document state
  try {
    await db
      .update(documents)
      .set({
        yjsState: state,
        updatedAt: new Date(),
      })
      .where(eq(documents.id, id));

    console.log(`[ok] Saved state for document ${id}`);

    return json({
      success: true,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[!] Failed to update document state:', err);
    error(500, { message: 'Failed to save document state' });
  }
};

// --------------------------------------------------------------------------
// [SECTION] Helper Functions
// --------------------------------------------------------------------------

interface DocumentInfo {
  ownerId: string;
  isPublic: boolean;
}

async function checkDocumentAccess(
  documentId: string,
  userId: string | null,
  document: DocumentInfo
): Promise<boolean> {
  // [*] Public documents are accessible to everyone
  if (document.isPublic) {
    return true;
  }

  // [*] Must be authenticated for private documents
  if (!userId) {
    return false;
  }

  // [*] Owner has access
  if (document.ownerId === userId) {
    return true;
  }

  // [*] Check collaborator access
  const [collaborator] = await db
    .select({ permission: documentCollaborators.permission })
    .from(documentCollaborators)
    .where(
      and(
        eq(documentCollaborators.documentId, documentId),
        eq(documentCollaborators.userId, userId)
      )
    )
    .limit(1);

  return !!collaborator;
}

async function checkEditPermission(
  documentId: string,
  userId: string,
  document: DocumentInfo
): Promise<boolean> {
  // [*] Owner can always edit
  if (document.ownerId === userId) {
    return true;
  }

  // [*] Check collaborator edit permission
  const [collaborator] = await db
    .select({ permission: documentCollaborators.permission })
    .from(documentCollaborators)
    .where(
      and(
        eq(documentCollaborators.documentId, documentId),
        eq(documentCollaborators.userId, userId)
      )
    )
    .limit(1);

  return collaborator?.permission === 'edit';
}
