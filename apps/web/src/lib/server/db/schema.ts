// ==========================================================================
// File    : schema.ts
// Project : MarkWrite
// Layer   : Data
// Purpose : Drizzle ORM schema definitions for PostgreSQL database.
//
// Author  : AuraEG Team
// Created : 2026-03-24
// ==========================================================================

import { pgTable, text, timestamp, boolean, index } from 'drizzle-orm/pg-core';

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
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull()
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
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    ownerIdx: index('documents_owner_idx').on(table.ownerId)
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
      .notNull()
  },
  (table) => ({
    pk: index('collaborators_pk').on(table.documentId, table.userId)
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
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    documentIdx: index('versions_document_idx').on(table.documentId)
  })
);

// --------------------------------------------------------------------------
// [SECTION] Type Exports
// --------------------------------------------------------------------------

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type DocumentCollaborator = typeof documentCollaborators.$inferSelect;
export type DocumentVersion = typeof documentVersions.$inferSelect;
