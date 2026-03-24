// ==========================================================================
// File    : lucia.ts
// Project : MarkWrite
// Layer   : Server Auth
// Purpose : Lucia Auth v3 configuration with PostgreSQL adapter.
//
// Author  : AuraEG Team
// Created : 2026-03-24
// ==========================================================================

import { Lucia } from 'lucia';
import { DrizzlePostgreSQLAdapter } from '@lucia-auth/adapter-drizzle';
import { dev } from '$app/environment';
import { db } from '$lib/server/db';
import { sessions, users } from '$lib/server/db/schema';

// --------------------------------------------------------------------------
// [SECTION] Database Adapter
// --------------------------------------------------------------------------

// @ts-expect-error - Drizzle adapter types are slightly incompatible with schema
const adapter = new DrizzlePostgreSQLAdapter(db, sessions, users);

// --------------------------------------------------------------------------
// [SECTION] Lucia Instance
// --------------------------------------------------------------------------

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: !dev,
    },
  },
  getUserAttributes: (attributes) => {
    return {
      githubId: attributes.githubId,
      username: attributes.username,
      email: attributes.email,
      avatarUrl: attributes.avatarUrl,
    };
  },
});

// --------------------------------------------------------------------------
// [SECTION] Type Declarations
// --------------------------------------------------------------------------

declare module 'lucia' {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: DatabaseUserAttributes;
  }
}

interface DatabaseUserAttributes {
  githubId: string;
  username: string;
  email: string | null;
  avatarUrl: string | null;
}
