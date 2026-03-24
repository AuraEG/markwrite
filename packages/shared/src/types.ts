// ==========================================================================
// File    : types.ts
// Project : MarkWrite
// Layer   : Shared
// Purpose : Shared TypeScript type definitions.
//
// Author  : AuraEG Team
// Created : 2026-03-24
// ==========================================================================

// --------------------------------------------------------------------------
// [SECTION] User Types
// --------------------------------------------------------------------------

export interface User {
  id: string;
  githubId: string;
  username: string;
  email: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// --------------------------------------------------------------------------
// [SECTION] Document Types
// --------------------------------------------------------------------------

export interface Document {
  id: string;
  title: string;
  ownerId: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentWithOwner extends Document {
  owner: Pick<User, 'id' | 'username' | 'avatarUrl'>;
}

export type Permission = 'view' | 'edit';

export interface DocumentCollaborator {
  documentId: string;
  userId: string;
  permission: Permission;
}

// --------------------------------------------------------------------------
// [SECTION] Presence Types (for Yjs awareness)
// --------------------------------------------------------------------------

export interface UserPresence {
  id: string;
  name: string;
  color: string;
  avatar?: string;
}

export interface CursorState {
  user: UserPresence;
  anchor: number;
  head: number;
}
