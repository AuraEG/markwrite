// ==========================================================================
// File    : +server.ts
// Project : MarkWrite
// Layer   : API
// Purpose : User settings API endpoints (GET, PATCH).
//
// Author  : AuraEG Team
// Created : 2026-04-02
// ==========================================================================

import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { userSettings, users, documents, documentCollaborators } from '$lib/server/db/schema';
import { eq, count } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// --------------------------------------------------------------------------
// [SECTION] GET - Retrieve user settings
// --------------------------------------------------------------------------

export const GET: RequestHandler = async ({ locals }) => {
  const user = locals.user;

  if (!user) {
    throw error(401, 'Unauthorized');
  }

  // [*] Get user settings, create default if not exists
  let settings = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, user.id))
    .then((rows) => rows[0]);

  if (!settings) {
    // [*] Create default settings for user
    const [newSettings] = await db
      .insert(userSettings)
      .values({
        userId: user.id,
      })
      .returning();
    settings = newSettings;
  }

  // [*] Get document statistics
  const [ownedDocsResult] = await db
    .select({ count: count() })
    .from(documents)
    .where(eq(documents.ownerId, user.id));

  const [collabDocsResult] = await db
    .select({ count: count() })
    .from(documentCollaborators)
    .where(eq(documentCollaborators.userId, user.id));

  // [*] Get user profile with stats
  const userProfile = await db
    .select()
    .from(users)
    .where(eq(users.id, user.id))
    .then((rows) => rows[0]);

  return json({
    settings: {
      theme: settings.theme,
      fontSize: settings.fontSize,
      fontFamily: settings.fontFamily,
      tabSize: settings.tabSize,
      lineWrapping: settings.lineWrapping,
      autoSaveInterval: settings.autoSaveInterval,
      spellCheck: settings.spellCheck,
      showLineNumbers: settings.showLineNumbers,
    },
    profile: {
      id: userProfile?.id,
      username: userProfile?.username,
      email: userProfile?.email,
      avatarUrl: userProfile?.avatarUrl,
      createdAt: userProfile?.createdAt,
    },
    stats: {
      ownedDocuments: ownedDocsResult?.count ?? 0,
      collaborations: collabDocsResult?.count ?? 0,
    },
  });
};

// --------------------------------------------------------------------------
// [SECTION] PATCH - Update user settings
// --------------------------------------------------------------------------

export const PATCH: RequestHandler = async ({ request, locals }) => {
  const user = locals.user;

  if (!user) {
    throw error(401, 'Unauthorized');
  }

  const body = await request.json();

  // [*] Validate settings values
  const updates: Partial<{
    theme: 'light' | 'dark' | 'system';
    fontSize: number;
    fontFamily: string;
    tabSize: number;
    lineWrapping: boolean;
    autoSaveInterval: number;
    spellCheck: boolean;
    showLineNumbers: boolean;
  }> = {};

  if (body.theme !== undefined) {
    if (!['light', 'dark', 'system'].includes(body.theme)) {
      throw error(400, 'Invalid theme value');
    }
    updates.theme = body.theme;
  }

  if (body.fontSize !== undefined) {
    const fontSize = Number(body.fontSize);
    if (isNaN(fontSize) || fontSize < 12 || fontSize > 24) {
      throw error(400, 'Font size must be between 12 and 24');
    }
    updates.fontSize = fontSize;
  }

  if (body.fontFamily !== undefined) {
    const validFonts = ['mono', 'jetbrains', 'fira', 'source'];
    if (!validFonts.includes(body.fontFamily)) {
      throw error(400, 'Invalid font family');
    }
    updates.fontFamily = body.fontFamily;
  }

  if (body.tabSize !== undefined) {
    const tabSize = Number(body.tabSize);
    if (![2, 4].includes(tabSize)) {
      throw error(400, 'Tab size must be 2 or 4');
    }
    updates.tabSize = tabSize;
  }

  if (body.lineWrapping !== undefined) {
    updates.lineWrapping = Boolean(body.lineWrapping);
  }

  if (body.autoSaveInterval !== undefined) {
    const interval = Number(body.autoSaveInterval);
    if (isNaN(interval) || interval < 10 || interval > 300) {
      throw error(400, 'Auto-save interval must be between 10 and 300 seconds');
    }
    updates.autoSaveInterval = interval;
  }

  if (body.spellCheck !== undefined) {
    updates.spellCheck = Boolean(body.spellCheck);
  }

  if (body.showLineNumbers !== undefined) {
    updates.showLineNumbers = Boolean(body.showLineNumbers);
  }

  if (Object.keys(updates).length === 0) {
    throw error(400, 'No valid settings to update');
  }

  // [*] Upsert settings (insert if not exists, update if exists)
  const existingSettings = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, user.id))
    .then((rows) => rows[0]);

  let updatedSettings;

  if (existingSettings) {
    [updatedSettings] = await db
      .update(userSettings)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(userSettings.userId, user.id))
      .returning();
  } else {
    [updatedSettings] = await db
      .insert(userSettings)
      .values({
        userId: user.id,
        ...updates,
      })
      .returning();
  }

  return json({
    settings: {
      theme: updatedSettings.theme,
      fontSize: updatedSettings.fontSize,
      fontFamily: updatedSettings.fontFamily,
      tabSize: updatedSettings.tabSize,
      lineWrapping: updatedSettings.lineWrapping,
      autoSaveInterval: updatedSettings.autoSaveInterval,
      spellCheck: updatedSettings.spellCheck,
      showLineNumbers: updatedSettings.showLineNumbers,
    },
  });
};
