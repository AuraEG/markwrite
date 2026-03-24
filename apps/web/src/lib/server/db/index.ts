// ==========================================================================
// File    : index.ts
// Project : MarkWrite
// Layer   : Data
// Purpose : Drizzle ORM database client initialization.
//
// Author  : AuraEG Team
// Created : 2026-03-24
// ==========================================================================

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { DATABASE_URL } from '$env/static/private';

const client = postgres(DATABASE_URL);

export const db = drizzle(client, { schema });

export * from './schema';
