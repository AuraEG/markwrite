// ==========================================================================
// File    : +server.ts
// Project : MarkWrite
// Layer   : API
// Purpose : Create/update GitHub Gist from document for public sharing.
//
// Author  : AuraEG Team
// Created : 2026-03-31
// ==========================================================================

import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { documents } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import * as Y from 'yjs';
import type { RequestHandler } from './$types';

// --------------------------------------------------------------------------
// [SECTION] POST - Create/Update Gist
// --------------------------------------------------------------------------

export const POST: RequestHandler = async ({ params, locals, cookies }) => {
  const { id: documentId } = params;
  const userId = locals.user?.id;

  if (!userId) {
    error(401, { message: 'Authentication required' });
  }

  // [*] Get GitHub access token from session
  const accessToken = cookies.get('github_access_token');
  if (!accessToken) {
    error(401, {
      message:
        'Please log out and log back in to enable GitHub Gist sharing (new permission required)',
    });
  }

  // [*] Fetch document
  const [document] = await db
    .select({
      id: documents.id,
      title: documents.title,
      ownerId: documents.ownerId,
      yjsState: documents.yjsState,
      gistId: documents.gistId,
      gistUrl: documents.gistUrl,
    })
    .from(documents)
    .where(eq(documents.id, documentId))
    .limit(1);

  if (!document) {
    error(404, { message: 'Document not found' });
  }

  if (document.ownerId !== userId) {
    error(403, { message: 'Only the document owner can share to Gist' });
  }

  // [*] Extract markdown content from Yjs state
  let markdownContent = '';
  if (document.yjsState) {
    try {
      const ydoc = new Y.Doc();
      const stateBuffer = Buffer.from(document.yjsState, 'base64');
      Y.applyUpdate(ydoc, new Uint8Array(stateBuffer));
      const ytext = ydoc.getText('content');
      markdownContent = ytext.toString();
    } catch (err) {
      console.error('[!] Failed to extract content from Yjs:', err);
      markdownContent = '# ' + document.title + '\n\nContent could not be extracted.';
    }
  }

  if (!markdownContent.trim()) {
    markdownContent = '# ' + document.title + '\n\n*Empty document*';
  }

  // [*] Prepare Gist data
  const filename = `${document.title.replace(/[^a-zA-Z0-9-_\s]/g, '').replace(/\s+/g, '-')}.md`;
  const gistData = {
    description: `MarkWrite Document: ${document.title}`,
    public: true,
    files: {
      [filename]: {
        content: markdownContent,
      },
    },
  };

  try {
    let gistResponse;

    if (document.gistId) {
      // [*] Update existing Gist
      gistResponse = await fetch(`https://api.github.com/gists/${document.gistId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'MarkWrite-App',
        },
        body: JSON.stringify(gistData),
      });

      if (gistResponse.status === 404) {
        // [*] Gist was deleted, create a new one
        gistResponse = await fetch('https://api.github.com/gists', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'MarkWrite-App',
          },
          body: JSON.stringify(gistData),
        });
      }
    } else {
      // [*] Create new Gist
      gistResponse = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'MarkWrite-App',
        },
        body: JSON.stringify(gistData),
      });
    }

    if (!gistResponse.ok) {
      const errorData = await gistResponse.json();
      console.error('[!] GitHub API error:', errorData);
      error(500, { message: 'Failed to create Gist. Please try again.' });
    }

    const gistResult = await gistResponse.json();
    const gistId = gistResult.id;
    const gistUrl = gistResult.html_url;

    // [*] Save Gist info to database
    await db.update(documents).set({ gistId, gistUrl }).where(eq(documents.id, documentId));

    return json({
      success: true,
      gistId,
      gistUrl,
      rawUrl: gistResult.files[filename]?.raw_url,
    });
  } catch (err) {
    console.error('[!] Gist creation error:', err);
    error(500, { message: 'Failed to create Gist' });
  }
};

// --------------------------------------------------------------------------
// [SECTION] DELETE - Unlink Gist (doesn't delete from GitHub)
// --------------------------------------------------------------------------

export const DELETE: RequestHandler = async ({ params, locals }) => {
  const { id: documentId } = params;
  const userId = locals.user?.id;

  if (!userId) {
    error(401, { message: 'Authentication required' });
  }

  const [document] = await db
    .select({ ownerId: documents.ownerId })
    .from(documents)
    .where(eq(documents.id, documentId))
    .limit(1);

  if (!document) {
    error(404, { message: 'Document not found' });
  }

  if (document.ownerId !== userId) {
    error(403, { message: 'Only the document owner can unlink Gist' });
  }

  await db
    .update(documents)
    .set({ gistId: null, gistUrl: null })
    .where(eq(documents.id, documentId));

  return json({ success: true });
};
