// ==========================================================================
// File    : schema.ts
// Project : MarkWrite
// Layer   : Data
// Purpose : Drizzle ORM schema definitions for PostgreSQL database.
//
// Author  : AuraEG Team
// Created : 2026-03-24
// Updated : 2026-04-02 - Added user_settings table
// ==========================================================================

import { pgTable, text, timestamp, boolean, index, integer } from 'drizzle-orm/pg-core';

// --------------------------------------------------------------------------
// [SECTION] User & Session Tables (Lucia Auth Compatible)
// --------------------------------------------------------------------------

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  githubId: text('github_id').unique().notNull(),
  username: text('username').notNull(),
  email: text('email'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
});

// --------------------------------------------------------------------------
// [SECTION] User Settings Table
// --------------------------------------------------------------------------

export const userSettings = pgTable('user_settings', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  // Editor preferences
  theme: text('theme', { enum: ['light', 'dark', 'system'] })
    .default('system')
    .notNull(),
  fontSize: integer('font_size').default(14).notNull(),
  fontFamily: text('font_family').default('mono').notNull(),
  tabSize: integer('tab_size').default(2).notNull(),
  lineWrapping: boolean('line_wrapping').default(true).notNull(),
  autoSaveInterval: integer('auto_save_interval').default(30).notNull(), // seconds
  spellCheck: boolean('spell_check').default(false).notNull(),
  showLineNumbers: boolean('show_line_numbers').default(true).notNull(),
  // Timestamps
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// --------------------------------------------------------------------------
// [SECTION] Document Tables
// --------------------------------------------------------------------------

export const documents = pgTable(
  'documents',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull().default('Untitled'),
    ownerId: text('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    yjsState: text('yjs_state'), // Base64 encoded Yjs state
    isPublic: boolean('is_public').default(false).notNull(),
    shareToken: text('share_token').unique(), // Token for shareable links
    gistId: text('gist_id'), // GitHub Gist ID for public sharing
    gistUrl: text('gist_url'), // GitHub Gist URL
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    ownerIdx: index('documents_owner_idx').on(table.ownerId),
  })
);

export const documentCollaborators = pgTable(
  'document_collaborators',
  {
    documentId: text('document_id')
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    permission: text('permission', { enum: ['view', 'edit'] })
      .default('view')
      .notNull(),
  },
  (table) => ({
    pk: index('collaborators_pk').on(table.documentId, table.userId),
  })
);

export const documentVersions = pgTable(
  'document_versions',
  {
    id: text('id').primaryKey(),
    documentId: text('document_id')
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade' }),
    yjsSnapshot: text('yjs_snapshot').notNull(), // Base64 encoded snapshot
    createdBy: text('created_by').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    documentIdx: index('versions_document_idx').on(table.documentId),
  })
);

// --------------------------------------------------------------------------
// [SECTION] Type Exports
// --------------------------------------------------------------------------

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type UserSettings = typeof userSettings.$inferSelect;
export type NewUserSettings = typeof userSettings.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type DocumentCollaborator = typeof documentCollaborators.$inferSelect;
export type DocumentVersion = typeof documentVersions.$inferSelect;
